import type { UploadItemPayload } from '@/store/inventory/inventoryService';

type RequiredField = 'reference' | 'name' | 'price' | 'quantity' | 'supplier';
type OptionalField = 'service' | 'serviceName' | 'servicePrice';

// Supplier spreadsheets vary — Portuguese/English header aliases are kept.
const COLUMN_ALIASES: Record<RequiredField, string[]> = {
  reference: ['reference', 'Reference', 'referencia', 'Referencia', 'SKU', 'CodArtigo', 'codigo', 'Código'],
  name: ['name', 'Name', 'nome', 'Nome', 'Descricao', 'Descrição', 'artigo', 'Artigo'],
  price: ['price', 'Price', 'preco', 'Preco', 'Preço', 'PVP', 'PVP1'],
  quantity: ['quantity', 'Quantity', 'quantidade', 'Quantidade', 'stock', 'Stock', 'StkActual'],
  supplier: ['supplier', 'Supplier', 'fornecedor', 'Fornecedor'],
};

// Not required columns — a file with no service offering at all simply won't
// have these headers, so they're never checked against missingColumns.
const OPTIONAL_COLUMN_ALIASES: Record<OptionalField, string[]> = {
  service: ['service', 'Service', 'servico', 'Servico', 'Serviço'],
  serviceName: ['service_name', 'Service Name', 'nome_servico', 'Nome do Serviço', 'nome_serviço'],
  servicePrice: ['service_price', 'Service Price', 'preco_servico', 'Preço do Serviço', 'preco_serviço'],
};

const FIELD_LABELS: Record<RequiredField, string> = {
  reference: 'Reference / SKU',
  name: 'Name / Description',
  price: 'Price',
  quantity: 'Quantity / Stock',
  supplier: 'Supplier',
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

export function parseWorkbookRows(rawRows: Record<string, unknown>[]): ParseResult {
  const headers = new Set<string>();
  rawRows.forEach((row) => Object.keys(row).forEach((key) => headers.add(key)));

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
      ...(serviceName ? { serviceName } : {}),
      ...(servicePrice !== undefined && !Number.isNaN(servicePrice) ? { servicePrice } : {}),
    });
  });

  return { items, skippedCount, missingColumns };
}
