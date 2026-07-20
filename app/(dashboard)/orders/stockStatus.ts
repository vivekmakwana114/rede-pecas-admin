import type { StockStatus } from './types';

export const STOCK_STATUS_STYLES: Record<StockStatus, { label: string; badge: string }> = {
  pending: { label: 'Awaiting', badge: 'bg-warning/10 text-warning border-warning/30' },
  confirmed: { label: 'Confirmed', badge: 'bg-success/10 text-success border-success/30' },
  unavailable: { label: 'Unavailable', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
};
