import { api } from '@/lib/api';

/**
 * Fetches orders grouped by status (pending/approved/rejected/stockConfirmation),
 * optionally scoped to today's orders only.
 */
export const getOrders = (range: 'today' | 'all' = 'all') => {
  return api.get('/admin/orders', { params: { range } });
};

/**
 * Fetches aggregate order stats (totals, revenue) for the dashboard.
 */
export const getOrderStats = () => {
  return api.get('/admin/orders/stats');
};

/**
 * Fetches a single order's full detail by its order number.
 */
export const getOrderDetail = (number: string) => {
  return api.get(`/admin/orders/${encodeURIComponent(number)}`);
};

/**
 * Approves or rejects an order by its order number.
 */
export const reviewOrder = (number: string, approved: boolean) => {
  return api.post(`/admin/orders/${encodeURIComponent(number)}/review`, { approved });
};

/**
 * Confirms whether stock is available for an order awaiting stock confirmation.
 */
export const confirmOrderStock = (number: string, available: boolean) => {
  return api.post(`/admin/orders/${encodeURIComponent(number)}/confirm/stock`, { available });
};

/**
 * Downloads the customer's uploaded payment-proof file for an order as a blob.
 */
export const getPaymentProof = (number: string) => {
  return api.get(`/admin/orders/${encodeURIComponent(number)}/payment/proof`, { responseType: 'blob' });
};

/**
 * Cancels an order by its order number.
 */
export const cancelOrder = (number: string) => {
  return api.delete(`/admin/orders/${encodeURIComponent(number)}`);
};
