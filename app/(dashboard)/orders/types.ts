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
export type StockStatus = 'pending' | 'unavailable' | 'available' | 'confirmed';

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
  part: string;
  service: { name: string; price: number | null } | null;
  /** Raw display string from the backend, as-is — no client-side reformatting. */
  time: string;
  /** Epoch ms used only for chronological sorting, never displayed. */
  sortTime: number;
  status: OrderStatus;
  /** null when the backend hasn't sent `stock_status` yet — never guessed. */
  stockStatus: StockStatus | null;
  actionable: boolean;
  hasProof: boolean;
  proofMediaType?: 'image' | 'document' | null;
}
