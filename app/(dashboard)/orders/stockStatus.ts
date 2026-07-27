import type { StockStatus } from './types';

export const STOCK_STATUS_BADGE: Record<StockStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  confirmed: 'bg-success/10 text-success border-success/30',
  unavailable: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const STOCK_STATUS_LABEL_KEY: Record<StockStatus, string> = {
  pending: 'orders.stockStatus.pending',
  confirmed: 'orders.stockStatus.confirmed',
  unavailable: 'orders.stockStatus.unavailable',
};
