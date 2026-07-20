import type { UploadItemPayload } from '@/store/inventory/inventoryService';

type RequiredField = 'reference' | 'name' | 'price' | 'quantity' | 'supplier';
type OptionalField = 'supplierAddress' | 'supplierPhone' | 'service' | 'serviceName' | 'servicePrice';

// Supplier spreadsheets vary — Portuguese/English header aliases are kept,
// alongside the older snake_case column names still accepted server-side.
const COLUMN_ALIASES: Record<RequiredField, string[]> = {
  reference: ['SKU', 'sku', 'reference', 'Reference', 'referencia', 'Referencia', 'CodArtigo', 'codigo', 'Código'],
  name: ['Product', 'product', 'name', 'Name', 'nome', 'Nome', 'Descricao', 'Descrição', 'artigo', 'Artigo'],
  price: ['price', 'Price', 'preco', 'Preco', 'Preço', 'PVP', 'PVP1'],
  quantity: ['quantity', 'Quantity', 'quantidade', 'Quantidade', 'stock', 'Stock', 'StkActual'],
  supplier: ['Supplier Name', 'supplier_name', 'supplier', 'Supplier', 'fornecedor', 'Fornecedor'],
};

// Not required columns — a file with no service offering (or no supplier
// address/phone) at all simply won't have these headers, so they're never
// checked against missingColumns.
const OPTIONAL_COLUMN_ALIASES: Record<OptionalField, string[]> = {
  supplierAddress: ['Supplier Address', 'supplier_address', 'supplier_province', 'endereco_fornecedor'],
  supplierPhone: ['Supplier Phone', 'supplier_phone', 'telefone_fornecedor'],
  service: ['service', 'Service', 'servico', 'Servico', 'Serviço'],
  serviceName: ['Service Name', 'service_name', 'nome_servico', 'Nome do Serviço', 'nome_serviço'],
  servicePrice: ['Service Price', 'service_price', 'preco_servico', 'Preço do Serviço', 'preco_serviço'],
};

const FIELD_LABELS: Record<RequiredField, string> = {
  reference: 'SKU',
  name: 'Product',
  price: 'Price',
  quantity: 'Quantity / Stock',
  supplier: 'Supplier Name',
};

const YES_VALUES = new Set(['yes', 'sim', 'true', '1']);

export interface ParseResult {
  items: UploadItemPayload[];
  /** Rows dropped because they lacked a reference or name value. */
  skippedCount: number;
  /** Required fields that had no matching header anywhere in the sheet. */
  missingColumns: string[];
}

function pick(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') return row[alias];
  }
  return undefined;
}

// headerRow is the literal first row of the sheet (XLSX.utils.sheet_to_json
// with { header: 1 }) — missing-column detection must read this, not the
// keys of the parsed data-row objects: sheet_to_json omits a key from a row
// object whenever that row's cell for it is empty, so a header-only file (no
// data rows yet, e.g. a freshly downloaded template) or a column that's
// blank on every single row would otherwise be falsely reported as an
// entirely missing column instead of what it actually is.
export function parseWorkbookRows(rawRows: Record<string, unknown>[], headerRow: unknown[] = []): ParseResult {
  const headers = new Set<string>(headerRow.map((h) => String(h ?? '').trim()));

  const missingColumns = (Object.keys(COLUMN_ALIASES) as RequiredField[])
    .filter((field) => !COLUMN_ALIASES[field].some((alias) => headers.has(alias)))
    .map((field) => FIELD_LABELS[field]);

  let skippedCount = 0;
  const items: UploadItemPayload[] = [];

  rawRows.forEach((row) => {
    const reference = String(pick(row, COLUMN_ALIASES.reference) ?? '').trim();
    const name = String(pick(row, COLUMN_ALIASES.name) ?? '').trim();

    if (!reference || !name) {
      skippedCount += 1;
      return;
    }

    const price = parseFloat(String(pick(row, COLUMN_ALIASES.price) ?? '0'));
    const quantity = parseInt(String(pick(row, COLUMN_ALIASES.quantity) ?? '0'), 10);
    const supplier = String(pick(row, COLUMN_ALIASES.supplier) ?? '').trim();
    const supplierAddress = String(pick(row, OPTIONAL_COLUMN_ALIASES.supplierAddress) ?? '').trim();
    const supplierPhone = String(pick(row, OPTIONAL_COLUMN_ALIASES.supplierPhone) ?? '').trim();

    // Preview-only — shown when present, but not validated (missing/invalid
    // service data is a server-side rejection, not something checked here).
    const wantsService = YES_VALUES.has(String(pick(row, OPTIONAL_COLUMN_ALIASES.service) ?? '').trim().toLowerCase());
    const serviceName = wantsService ? String(pick(row, OPTIONAL_COLUMN_ALIASES.serviceName) ?? '').trim() : '';
    const servicePriceRaw = wantsService ? pick(row, OPTIONAL_COLUMN_ALIASES.servicePrice) : undefined;
    const servicePrice = servicePriceRaw !== undefined ? parseFloat(String(servicePriceRaw)) : undefined;

    items.push({
      reference,
      name,
      price: Number.isNaN(price) ? 0 : price,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      supplier,
      ...(supplierAddress ? { supplierAddress } : {}),
      ...(supplierPhone ? { supplierPhone } : {}),
      ...(serviceName ? { serviceName } : {}),
      ...(servicePrice !== undefined && !Number.isNaN(servicePrice) ? { servicePrice } : {}),
    });
  });

  return { items, skippedCount, missingColumns };
}
