export type { OrderStatus, OrderItem, OrderItemLine } from '@/store/orders/ordersSlice';

import type { OrderItemLine, OrderStatus } from '@/store/orders/ordersSlice';

export type FilterValue = OrderStatus | 'all' | 'paymentProof';

export type StockStatus = 'pending' | 'unavailable' | 'confirmed';

export interface OrderRow {
  number: string;
  customer: string;
  price: number;
  quantity: number;
  part: string;
  service: { name: string; price: number | null } | null;
  time: string;
  sortTime: number;
  lastChangedTime: number;
  status: OrderStatus;
  stockStatus: StockStatus | null;
  actionable: boolean;
  verifying: boolean;
  hasProof: boolean;
  proofMediaType?: 'image' | 'document' | null;
  // Multi-product "basket" order line items — null/absent for a legacy
  // single-product order (the overwhelming majority), populated when the
  // customer requested several parts in one WhatsApp message.
  items: OrderItemLine[] | null;
}
