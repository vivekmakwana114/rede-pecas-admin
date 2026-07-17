export type { OrderStatus, OrderItem } from '@/store/orders/ordersSlice';

import type { OrderStatus } from '@/store/orders/ordersSlice';

/**
 * Filter bar values. 'paymentProof' isn't a backend status bucket — it's a
 * cross-cutting filter (an order can have a proof in any status) — so it's
 * layered on top of OrderStatus rather than folded into it.
 */
export type FilterValue = OrderStatus | 'all' | 'paymentProof';

/** Distinct from `OrderStatus` — this is the stock decision specifically,
 *  as sent by the backend's `stock_status` field, not the order's overall
 *  bucket. */
export type StockStatus = 'pending' | 'unavailable' | 'confirmed';

/**
 * Unified shape the orders grid renders. All four backend buckets
 * (pending/approved/rejected/stockConfirmation) share the same lean
 * OrderItem shape — this just tags one with its bucket and whether it's
 * actionable (only pending orders can be approved/rejected).
 */
export interface OrderRow {
  number: string;
  customer: string;
  price: number;
  quantity: number;
  part: string;
  service: { name: string; price: number | null } | null;
  /** Raw display string from the backend, as-is — no client-side reformatting. */
  time: string;
  /** Epoch ms used only for chronological sorting, never displayed. */
  sortTime: number;
  /** Epoch ms of the order's true last-changed instant (payment method
   *  chosen, proof submitted/verified, stock decided, approved/rejected) —
   *  distinct from sortTime for the pending bucket, whose displayed `time`
   *  stays frozen at creation. Drives the grid's default row order, so a
   *  just-changed order surfaces first regardless of which bucket it's in. */
  lastChangedTime: number;
  status: OrderStatus;
  /** null when the backend hasn't sent `stock_status` yet — never guessed. */
  stockStatus: StockStatus | null;
  /** True only once the order has actually reached a reviewable payment
   *  state (payment_proof_received or awaiting_agent_confirmation) — driven
   *  by the backend's `reviewable` field, not by bucket membership alone. */
  actionable: boolean;
  /** True while Claude Vision is validating a just-submitted proof — order
   *  is visible but not yet actionable. */
  verifying: boolean;
  hasProof: boolean;
  proofMediaType?: 'image' | 'document' | null;
}
