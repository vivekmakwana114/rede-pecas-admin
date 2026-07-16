import type { OrderItem, OrderStatus } from '@/store/orders/ordersSlice';
import type { OrderRow } from './types';

// `time` on real records is a display string like "10:50" (no date), so
// chronological sorting reconstructs today's epoch from it — this is a sort
// key only, never shown to the user. Once the backend sends a full
// timestamp, `new Date(...)` parses it directly and this reconstruction is
// skipped.
function sortableTime(time: string): number {
  const direct = new Date(time);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  const date = new Date();
  if (match) date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.getTime();
}

export function toOrderRow(item: OrderItem, status: OrderStatus): OrderRow {
  return {
    number: item.number,
    customer: item.customer,
    price: item.price,
    part: item.part,
    service:
      item.service_offered && item.service_name
        ? { name: item.service_name, price: item.service_price ?? null }
        : null,
    time: item.time,
    sortTime: sortableTime(item.time),
    status,
    // No guessing when the backend hasn't sent it — the UI shows "—" rather
    // than a fabricated status derived from the order's bucket.
    stockStatus: item.stock_status ?? null,
    actionable: status === 'pending',
    hasProof: Boolean(item.has_proof),
    proofMediaType: item.payment_proof_media_type,
  };
}
