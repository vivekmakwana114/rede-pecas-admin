export type { OrderStatus, OrderItem } from '@/store/orders/ordersSlice';

import type { OrderStatus } from '@/store/orders/ordersSlice';

/**
 * Filter bar values. 'paymentProof' isn't a backend status bucket — it's a
 * cross-cutting filter (an order can have a proof in any status) — so it's
 * layered on top of OrderStatus rather than folded into it.
 */
export type FilterValue = OrderStatus | 'all' | 'paymentProof';

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
  time: string;
  /** Epoch ms used for chronological sorting — `time` is a display string
   *  ("HH:MM"), so sorting reconstructs today's epoch from it instead. */
  sortTime: number;
  status: OrderStatus;
  actionable: boolean;
  hasProof: boolean;
  proofMediaType?: 'image' | 'document' | null;
}
