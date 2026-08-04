import type { ServiceUploadItemPayload } from '@/store/services/servicesService';

type RequiredField = 'providerName' | 'serviceName' | 'serviceCategory' | 'serviceBasePrice' | 'serviceDurationH';
type OptionalField =
  | 'providerAddress'
  | 'providerProvince'
  | 'providerPhone'
  | 'specialties'
  | 'rating'
  | 'responseTime'
  | 'availableAtHome'
  | 'baseTravelFee'
  | 'logisticsFeeNotes';

const COLUMN_ALIASES: Record<RequiredField, string[]> = {
  providerName: ['Provider Name', 'provider_name', 'fornecedor_servico'],
  serviceName: ['Service Name', 'service_name', 'nome_servico'],
  serviceCategory: ['Service Category', 'service_category', 'categoria_servico'],
  serviceBasePrice: ['Service Base Price', 'service_base_price', 'preco_base_servico'],
  serviceDurationH: ['Service Duration H', 'service_duration_h', 'duracao_servico_h'],
};

const OPTIONAL_COLUMN_ALIASES: Record<OptionalField, string[]> = {
  providerAddress: ['Address', 'address', 'endereco'],
  providerProvince: ['Province', 'province', 'provincia'],
  providerPhone: ['Phone', 'phone', 'telefone'],
  specialties: ['Specialties', 'specialties', 'especialidades'],
  rating: ['Rating', 'rating', 'avaliacao'],
  responseTime: ['Response Time', 'response_time', 'tempo_resposta'],
  availableAtHome: ['Available At Home', 'available_at_home', 'disponivel_domicilio'],
  baseTravelFee: ['Base Travel Fee', 'base_travel_fee', 'taxa_deslocacao'],
  logisticsFeeNotes: ['Logistics Fee Notes', 'logistics_fee_notes', 'notas_taxa_logistica'],
};

const FIELD_LABELS: Record<RequiredField, string> = {
  providerName: 'Provider Name',
  serviceName: 'Service Name',
  serviceCategory: 'Service Category',
  serviceBasePrice: 'Service Base Price',
  serviceDurationH: 'Service Duration H',
};

const YES_VALUES = new Set(['yes', 'sim', 'true', '1']);

export interface ServiceParseResult {
  items: ServiceUploadItemPayload[];
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
 * Transforms raw spreadsheet rows into `ServiceUploadItemPayload` objects the
 * import API expects, reporting any required columns missing from the header
 * and skipping rows that lack a provider name, service name, or category.
 */
export function parseServiceWorkbookRows(rawRows: Record<string, unknown>[], headerRow: unknown[] = []): ServiceParseResult {
  const headers = new Set<string>(headerRow.map((h) => String(h ?? '').trim()));

  const missingColumns = (Object.keys(COLUMN_ALIASES) as RequiredField[])
    .filter((field) => !COLUMN_ALIASES[field].some((alias) => headers.has(alias)))
    .map((field) => FIELD_LABELS[field]);

  let skippedCount = 0;
  const items: ServiceUploadItemPayload[] = [];

  rawRows.forEach((row) => {
    const providerName = String(pick(row, COLUMN_ALIASES.providerName) ?? '').trim();
    const serviceName = String(pick(row, COLUMN_ALIASES.serviceName) ?? '').trim();
    const serviceCategory = String(pick(row, COLUMN_ALIASES.serviceCategory) ?? '').trim();

    if (!providerName || !serviceName || !serviceCategory) {
      skippedCount += 1;
      return;
    }

    const serviceBasePrice = parseFloat(String(pick(row, COLUMN_ALIASES.serviceBasePrice) ?? '0'));
    const serviceDurationH = parseFloat(String(pick(row, COLUMN_ALIASES.serviceDurationH) ?? '0'));
    const providerAddress = String(pick(row, OPTIONAL_COLUMN_ALIASES.providerAddress) ?? '').trim();
    const providerProvince = String(pick(row, OPTIONAL_COLUMN_ALIASES.providerProvince) ?? '').trim();
    const providerPhone = String(pick(row, OPTIONAL_COLUMN_ALIASES.providerPhone) ?? '').trim();
    const specialties = String(pick(row, OPTIONAL_COLUMN_ALIASES.specialties) ?? '').trim();
    const ratingRaw = pick(row, OPTIONAL_COLUMN_ALIASES.rating);
    const responseTime = String(pick(row, OPTIONAL_COLUMN_ALIASES.responseTime) ?? '').trim();
    const availableAtHome = YES_VALUES.has(String(pick(row, OPTIONAL_COLUMN_ALIASES.availableAtHome) ?? '').trim().toLowerCase());
    const baseTravelFeeRaw = pick(row, OPTIONAL_COLUMN_ALIASES.baseTravelFee);
    const logisticsFeeNotes = String(pick(row, OPTIONAL_COLUMN_ALIASES.logisticsFeeNotes) ?? '').trim();

    items.push({
      providerName,
      serviceName,
      serviceCategory,
      serviceBasePrice: Number.isNaN(serviceBasePrice) ? 0 : serviceBasePrice,
      serviceDurationH: Number.isNaN(serviceDurationH) ? 0 : serviceDurationH,
      availableAtHome,
      ...(providerAddress ? { providerAddress } : {}),
      ...(providerProvince ? { providerProvince } : {}),
      ...(providerPhone ? { providerPhone } : {}),
      ...(specialties ? { specialties } : {}),
      ...(ratingRaw !== undefined && !Number.isNaN(Number(ratingRaw)) ? { rating: Number(ratingRaw) } : {}),
      ...(responseTime ? { responseTime } : {}),
      ...(baseTravelFeeRaw !== undefined && !Number.isNaN(Number(baseTravelFeeRaw)) ? { baseTravelFee: Number(baseTravelFeeRaw) } : {}),
      ...(logisticsFeeNotes ? { logisticsFeeNotes } : {}),
    });
  });

  return { items, skippedCount, missingColumns };
}
