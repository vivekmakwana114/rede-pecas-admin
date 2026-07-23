export type { OrderStatus, OrderItem } from '@/store/orders/ordersSlice';

import type { OrderStatus } from '@/store/orders/ordersSlice';

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
}
