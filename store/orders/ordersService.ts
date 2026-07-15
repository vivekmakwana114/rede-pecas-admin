import { api } from '@/lib/api';

export const getOrders = () => {
  return api.get('/admin/orders');
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
