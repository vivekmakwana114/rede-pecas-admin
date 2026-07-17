import type { StockStatus } from './types';

export const STOCK_STATUS_STYLES: Record<StockStatus, { label: string; badge: string }> = {
  pending: { label: 'Awaiting', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unavailable: { label: 'Unavailable', badge: 'bg-red-50 text-red-700 border-red-200' },
};
