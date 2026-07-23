import type { OrderItem, OrderStatus } from '@/store/orders/ordersSlice';
import type { OrderRow } from './types';

/**
 * Converts a displayed order timestamp (either "DD/MM/YYYY, HH:mm" or an
 * ISO-parseable string) into a numeric epoch value for sorting, falling back
 * to the current time if it can't be parsed.
 */
function sortableTime(time: string): number {
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[, ]+(\d{1,2}):(\d{2})/.exec(time);
  if (dmy) {
    const [, day, month, year, hour, minute] = dmy;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
  }

  const direct = new Date(time);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  return Date.now();
}

/**
 * Adapts a raw `OrderItem` from the store into the flattened `OrderRow` shape
 * the orders grid renders, computing sortable timestamps and normalizing
 * optional service/proof fields.
 */
export function toOrderRow(item: OrderItem, status: OrderStatus): OrderRow {
  const sortTime = sortableTime(item.time);
  return {
    number: item.number,
    customer: item.customer,
    price: item.price,
    quantity: item.quantity,
    part: item.part,
    service:
      item.service_offered && item.service_name
        ? { name: item.service_name, price: item.service_price ?? null }
        : null,
    time: item.time,
    sortTime,
    lastChangedTime: item.updated_at ? sortableTime(item.updated_at) : sortTime,
    status,
    stockStatus: item.stock_status ?? null,
    actionable: Boolean(item.reviewable),
    verifying: Boolean(item.verifying),
    hasProof: Boolean(item.has_proof),
    proofMediaType: item.payment_proof_media_type,
  };
}
