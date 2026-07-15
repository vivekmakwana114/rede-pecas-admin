import type { OrderItem, OrderStatus } from '@/store/orders/ordersSlice';
import type { OrderRow } from './types';

// `time` on real records is a display string like "10:50" (no date), so
// chronological sorting reconstructs today's epoch from it.
function parseTimeOfDay(time: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return Date.now();
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.getTime();
}

export function toOrderRow(item: OrderItem, status: OrderStatus): OrderRow {
  return {
    number: item.number,
    customer: item.customer,
    price: item.price,
    part: item.part,
    time: item.time,
    sortTime: parseTimeOfDay(item.time),
    status,
    actionable: status === 'pending',
    hasProof: Boolean(item.has_proof),
    proofMediaType: item.payment_proof_media_type,
  };
}
