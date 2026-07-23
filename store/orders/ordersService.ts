import { api } from '@/lib/api';

export const getOrders = (range: 'today' | 'all' = 'all') => {
  return api.get('/admin/orders', { params: { range } });
};

export const getOrderStats = () => {
  return api.get('/admin/orders/stats');
};

export const getOrderDetail = (number: string) => {
  return api.get(`/admin/orders/${encodeURIComponent(number)}`);
};

export const reviewOrder = (number: string, approved: boolean) => {
  return api.post(`/admin/orders/${encodeURIComponent(number)}/review`, { approved });
};

export const confirmOrderStock = (number: string, available: boolean) => {
  return api.post(`/admin/orders/${encodeURIComponent(number)}/confirm/stock`, { available });
};

export const getPaymentProof = (number: string) => {
  return api.get(`/admin/orders/${encodeURIComponent(number)}/payment/proof`, { responseType: 'blob' });
};

// Hides the order from the admin grid only (backend sets admin_hidden) —
// never touches the order's real status, never notifies the customer. Only
// valid once the order is already 'approved' (409 otherwise) — see
// order.controller.ts's deleteOrderHandler/hideApprovedOrder.
export const cancelOrder = (number: string) => {
  return api.delete(`/admin/orders/${encodeURIComponent(number)}`);
};
