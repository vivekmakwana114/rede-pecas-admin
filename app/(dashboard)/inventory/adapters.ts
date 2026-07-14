import type { UploadItemPayload } from '@/store/inventory/inventoryService';

type RequiredField = 'reference' | 'name' | 'price' | 'quantity' | 'supplier';

// Supplier spreadsheets vary — Portuguese/English header aliases are kept.
const COLUMN_ALIASES: Record<RequiredField, string[]> = {
  reference: ['reference', 'Reference', 'referencia', 'Referencia', 'SKU', 'CodArtigo', 'codigo', 'Código'],
  name: ['name', 'Name', 'nome', 'Nome', 'Descricao', 'Descrição', 'artigo', 'Artigo'],
  price: ['price', 'Price', 'preco', 'Preco', 'Preço', 'PVP', 'PVP1'],
  quantity: ['quantity', 'Quantity', 'quantidade', 'Quantidade', 'stock', 'Stock', 'StkActual'],
  supplier: ['supplier', 'Supplier', 'fornecedor', 'Fornecedor'],
};

const FIELD_LABELS: Record<RequiredField, string> = {
  reference: 'Reference / SKU',
  name: 'Name / Description',
  price: 'Price',
  quantity: 'Quantity / Stock',
  supplier: 'Supplier',
};

export interface ParseResult {
  items: UploadItemPayload[];
  /** Rows dropped because they lacked a reference or name value. */
  skippedCount: number;
  /** Required fields that had no matching header anywhere in the sheet. */
  missingColumns: string[];
}

function pick(row: Record<string, unknown>, field: RequiredField): unknown {
  for (const alias of COLUMN_ALIASES[field]) {
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
    const reference = String(pick(row, 'reference') ?? '').trim();
    const name = String(pick(row, 'name') ?? '').trim();

    if (!reference || !name) {
      skippedCount += 1;
      return;
    }

    const price = parseFloat(String(pick(row, 'price') ?? '0'));
    const quantity = parseInt(String(pick(row, 'quantity') ?? '0'), 10);
    const supplier = String(pick(row, 'supplier') ?? '').trim();

    items.push({
      reference,
      name,
      price: Number.isNaN(price) ? 0 : price,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      supplier,
    });
  });

  return { items, skippedCount, missingColumns };
}
