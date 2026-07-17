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

// Soft-deletes the order (backend moves it to a 'cancelled' status rather
// than a hard delete — see order.controller.ts). Only valid for a
// non-terminal order (not yet approved/rejected/cancelled).
export const cancelOrder = (number: string) => {
  return api.delete(`/admin/orders/${encodeURIComponent(number)}`);
};
