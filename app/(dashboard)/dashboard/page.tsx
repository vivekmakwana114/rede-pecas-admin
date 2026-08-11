'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, fetchOrderStats } from '@/store/orders/ordersSlice';
import { fetchProducts } from '@/store/inventory/inventorySlice';
import { fetchCustomers } from '@/store/customers/customersSlice';
import { fetchOrderAnalytics, setPeriod } from '@/store/analytics/analyticsSlice';
import type { AnalyticsPeriod } from '@/store/analytics/analyticsSlice';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { StatsGrid } from './StatsGrid';
import { RevenueChart } from './RevenueChart';
import { OrdersChart } from './OrdersChart';
import { PeriodFilter } from './PeriodFilter';

/**
 * Dashboard home page: loads orders, products, customers and analytics on
 * mount, polls order data every 15s, and renders the stats grid and charts.
 */
export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { stats } = useAppSelector((state) => state.orders);
  const { products } = useAppSelector((state) => state.inventory);
  const { customers } = useAppSelector((state) => state.customers);
  const { period, points, status: analyticsStatus } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchOrders('all'));
    dispatch(fetchOrderStats());
    dispatch(fetchProducts());
    dispatch(fetchCustomers());
    dispatch(fetchOrderAnalytics(period));
    const interval = setInterval(() => {
      dispatch(fetchOrders('all'));
      dispatch(fetchOrderStats());
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  /**
   * Updates the selected analytics period and re-fetches order analytics
   * for that period.
   */
  const handlePeriodChange = (next: AnalyticsPeriod) => {
    dispatch(setPeriod(next));
    dispatch(fetchOrderAnalytics(next));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        {/* <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          {t('dashboard.live')}
        </div> */}
      </div>

      <StatsGrid
        totalCustomers={customers.length}
        totalProducts={products.length}
        totalOrders={stats.totalOrders}
        approvedOrders={stats.approvedOrders}
        rejectedOrders={stats.rejectedOrders}
        approvedRevenue={stats.approvedRevenue}
      />

      <div className="flex items-center justify-end">
        <PeriodFilter period={period} onPeriodChange={handlePeriodChange} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={points} period={period} loading={analyticsStatus === 'loading'} />
        <OrdersChart data={points} period={period} loading={analyticsStatus === 'loading'} />
      </div>
    </div>
  );
}
