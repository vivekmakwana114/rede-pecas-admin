import { api } from '@/lib/api';
import type { AnalyticsPeriod } from './analyticsSlice';

export const getOrderAnalytics = (period: AnalyticsPeriod) => {
  return api.get('/admin/orders/analytics', { params: { period } });
};
