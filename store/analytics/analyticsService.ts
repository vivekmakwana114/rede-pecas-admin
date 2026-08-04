import { api } from '@/lib/api';
import type { AnalyticsPeriod } from './analyticsSlice';

/**
 * Requests aggregated order analytics data points for the given period
 * (daily/monthly/yearly) from the admin API.
 */
export const getOrderAnalytics = (period: AnalyticsPeriod) => {
  return api.get('/admin/orders/analytics', { params: { period } });
};
