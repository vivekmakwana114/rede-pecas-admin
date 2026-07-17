import type { OrderItem, OrderStatus } from '@/store/orders/ordersSlice';
import type { OrderRow } from './types';

// `time` on real records is a "DD/MM/YYYY HH:MM" display string built by
// order.model.ts's `to_char(..., 'DD/MM/YYYY HH24:MI')` — not ISO, so
// `new Date(...)` can't parse it directly (returns Invalid Date). Parsed
// explicitly here; an ISO string (e.g. a raw `updated_at`) still falls
// through to the direct-parse branch.
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
    // For the pending bucket, `time`/sortTime is frozen at order creation —
    // a payment method choice or proof submission doesn't move it, even
    // though that's exactly the kind of change that should surface the
    // order first. `updated_at` (raw ISO, pending bucket only) tracks the
    // real last-touch instant; other buckets' displayed time already is
    // their last-relevant-change instant (approved_at/updated_at/created_at
    // per bucket — see order.model.ts), so sortTime is accurate there.
    lastChangedTime: item.updated_at ? sortableTime(item.updated_at) : sortTime,
    status,
    // No guessing when the backend hasn't sent it — the UI shows "—" rather
    // than a fabricated status derived from the order's bucket.
    stockStatus: item.stock_status ?? null,
    // Driven by the backend's `reviewable` flag (payment_proof_received /
    // awaiting_agent_confirmation only) — NOT bucket membership. A pending
    // order that hasn't submitted/had its proof verified yet must not be
    // approvable/rejectable.
    actionable: Boolean(item.reviewable),
    verifying: Boolean(item.verifying),
    hasProof: Boolean(item.has_proof),
    proofMediaType: item.payment_proof_media_type,
  };
}
