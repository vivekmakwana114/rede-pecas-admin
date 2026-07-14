'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/orders/ordersSlice';
import { fetchProducts } from '@/store/inventory/inventorySlice';
import { fetchCustomers } from '@/store/customers/customersSlice';
import { fetchOrderAnalytics, setPeriod } from '@/store/analytics/analyticsSlice';
import type { AnalyticsPeriod } from '@/store/analytics/analyticsSlice';
import { StatsGrid } from './StatsGrid';
import { RevenueChart } from './RevenueChart';
import { OrdersChart } from './OrdersChart';
import { PeriodFilter } from './PeriodFilter';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { pending, approved, rejected, stockConfirmation } = useAppSelector((state) => state.orders);
  const { products } = useAppSelector((state) => state.inventory);
  const { customers } = useAppSelector((state) => state.customers);
  const { period, points, status: analyticsStatus } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchProducts());
    dispatch(fetchCustomers());
    dispatch(fetchOrderAnalytics(period));
    const interval = setInterval(() => dispatch(fetchOrders()), 15000);
    return () => clearInterval(interval);
    // Only ever fires the initial analytics fetch with whatever `period` was
    // on mount — subsequent period changes go through handlePeriodChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handlePeriodChange = (next: AnalyticsPeriod) => {
    dispatch(setPeriod(next));
    dispatch(fetchOrderAnalytics(next));
  };

  const totalOrders = pending.length + approved.length + rejected.length + stockConfirmation.length;
  const approvedRevenue = approved.reduce((sum, order) => sum + order.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Today&apos;s pulse across customers, inventory and orders.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>

      <StatsGrid
        totalCustomers={customers.length}
        totalProducts={products.length}
        totalOrders={totalOrders}
        approvedOrders={approved.length}
        rejectedOrders={rejected.length}
        approvedRevenue={approvedRevenue}
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
