import type { UploadItemPayload } from '@/store/inventory/inventoryService';

type RequiredField = 'reference' | 'name' | 'price' | 'quantity' | 'supplier';
type OptionalStringField =
  | 'supplierAddress'
  | 'supplierPhone'
  | 'category'
  | 'subcategory'
  | 'productType'
  | 'oemReference'
  | 'deliveryTime'
  | 'vehicleMake'
  | 'vehicleModel'
  | 'engine'
  | 'engineNumber'
  | 'viscosity'
  | 'engineType'
  | 'specification'
  | 'description'
  | 'synonyms'
  | 'imageUrl'
  | 'brand';
type OptionalNumberField = 'yearStart' | 'yearEnd' | 'volumeLiters' | 'intervalKm';
type OptionalField = OptionalStringField | OptionalNumberField;

const COLUMN_ALIASES: Record<RequiredField, string[]> = {
  reference: ['SKU', 'sku', 'reference', 'Reference', 'referencia', 'Referencia', 'CodArtigo', 'codigo', 'Código'],
  name: ['Product', 'product', 'name', 'Name', 'nome', 'Nome', 'artigo', 'Artigo'],
  price: ['price', 'Price', 'preco', 'Preco', 'Preço', 'PVP', 'PVP1'],
  quantity: ['quantity', 'Quantity', 'quantidade', 'Quantidade', 'stock', 'Stock', 'StkActual'],
  supplier: ['Supplier Name', 'supplier_name', 'supplier', 'Supplier', 'fornecedor', 'Fornecedor'],
};

const OPTIONAL_COLUMN_ALIASES: Record<OptionalField, string[]> = {
  supplierAddress: ['Supplier Address', 'supplier_address', 'supplier_province', 'endereco_fornecedor'],
  supplierPhone: ['Supplier Phone', 'supplier_phone', 'telefone_fornecedor'],
  category: ['Category', 'category', 'categoria'],
  subcategory: ['Subcategory', 'subcategory', 'subcategoria'],
  productType: ['Part Type', 'part_type', 'product_type', 'tipo_peca'],
  oemReference: ['OEM Reference', 'oem_reference', 'referencia_oem'],
  deliveryTime: ['Delivery Time', 'delivery_time', 'prazo_entrega'],
  vehicleMake: ['Vehicle Make', 'vehicle_make', 'marca_veiculo'],
  vehicleModel: ['Vehicle Model', 'vehicle_model', 'modelo_veiculo'],
  yearStart: ['Year Start', 'year_start', 'ano_inicio'],
  yearEnd: ['Year End', 'year_end', 'ano_fim'],
  engine: ['Engine', 'engine', 'motor'],
  engineNumber: ['Engine Number', 'engine_number', 'numero_motor'],
  viscosity: ['Viscosity', 'viscosity', 'viscosidade'],
  engineType: ['Engine Type', 'engine_type', 'tipo_motor'],
  volumeLiters: ['Volume Liters', 'volume_liters', 'volume_litros'],
  specification: ['Specification', 'specification', 'especificacao'],
  intervalKm: ['Interval Km', 'interval_km', 'intervalo_km'],
  description: ['Description', 'description', 'descricao', 'descrição'],
  synonyms: ['Synonyms', 'synonyms', 'sinonimos'],
  imageUrl: ['Image Url', 'image_url', 'url_imagem'],
  brand: ['Brand', 'brand', 'part_brand', 'marca'],
};

const FIELD_LABELS: Record<RequiredField, string> = {
  reference: 'SKU',
  name: 'Product',
  price: 'Price',
  quantity: 'Quantity / Stock',
  supplier: 'Supplier Name',
};

export interface ParseResult {
  items: UploadItemPayload[];
  skippedCount: number;
  missingColumns: string[];
}

/**
 * Returns the first non-empty value found in `row` for any of the given
 * column-name aliases, letting the parser accept differently-named spreadsheet headers.
 */
function pick(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') return row[alias];
  }
  return undefined;
}

/**
 * Reads an optional string field from a row via its column aliases,
 * coercing a missing value to an empty, trimmed string.
 */
function pickStr(row: Record<string, unknown>, field: OptionalStringField): string {
  return String(pick(row, OPTIONAL_COLUMN_ALIASES[field]) ?? '').trim();
}

/**
 * Reads an optional numeric field from a row via its column aliases,
 * returning `undefined` when the value is missing or not a valid number.
 */
function pickNum(row: Record<string, unknown>, field: OptionalNumberField): number | undefined {
  const raw = pick(row, OPTIONAL_COLUMN_ALIASES[field]);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Transforms raw spreadsheet rows into `UploadItemPayload` objects the import
 * API expects, reporting any required columns missing from the header and
 * skipping rows that lack a reference or name.
 */
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

    const supplierAddress = pickStr(row, 'supplierAddress');
    const supplierPhone = pickStr(row, 'supplierPhone');
    const category = pickStr(row, 'category');
    const subcategory = pickStr(row, 'subcategory');
    const productType = pickStr(row, 'productType');
    const oemReference = pickStr(row, 'oemReference');
    const deliveryTime = pickStr(row, 'deliveryTime');
    const vehicleMake = pickStr(row, 'vehicleMake');
    const vehicleModel = pickStr(row, 'vehicleModel');
    const engine = pickStr(row, 'engine');
    const engineNumber = pickStr(row, 'engineNumber');
    const viscosity = pickStr(row, 'viscosity');
    const engineType = pickStr(row, 'engineType');
    const specification = pickStr(row, 'specification');
    const description = pickStr(row, 'description');
    const synonyms = pickStr(row, 'synonyms');
    const imageUrl = pickStr(row, 'imageUrl');
    const brand = pickStr(row, 'brand');

    const yearStart = pickNum(row, 'yearStart');
    const yearEnd = pickNum(row, 'yearEnd');
    const volumeLiters = pickNum(row, 'volumeLiters');
    const intervalKm = pickNum(row, 'intervalKm');

    items.push({
      reference,
      name,
      price: Number.isNaN(price) ? 0 : price,
      quantity: Number.isNaN(quantity) ? 0 : quantity,
      supplier,
      ...(supplierAddress ? { supplierAddress } : {}),
      ...(supplierPhone ? { supplierPhone } : {}),
      ...(category ? { category } : {}),
      ...(subcategory ? { subcategory } : {}),
      ...(productType ? { productType } : {}),
      ...(oemReference ? { oemReference } : {}),
      ...(deliveryTime ? { deliveryTime } : {}),
      ...(vehicleMake ? { vehicleMake } : {}),
      ...(vehicleModel ? { vehicleModel } : {}),
      ...(yearStart !== undefined ? { yearStart } : {}),
      ...(yearEnd !== undefined ? { yearEnd } : {}),
      ...(engine ? { engine } : {}),
      ...(engineNumber ? { engineNumber } : {}),
      ...(viscosity ? { viscosity } : {}),
      ...(engineType ? { engineType } : {}),
      ...(volumeLiters !== undefined ? { volumeLiters } : {}),
      ...(specification ? { specification } : {}),
      ...(intervalKm !== undefined ? { intervalKm } : {}),
      ...(description ? { description } : {}),
      ...(synonyms ? { synonyms } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(brand ? { brand } : {}),
    });
  });

  return { items, skippedCount, missingColumns };
}
