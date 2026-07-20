'use client';

import { Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsPeriod, AnalyticsPoint } from '@/store/analytics/analyticsSlice';

const SUBTITLE: Record<AnalyticsPeriod, string> = {
  daily: 'Last 24 hours by hour, by status',
  monthly: 'Last 30 days by day, by status',
  yearly: 'Last 12 months by month, by status',
};

const STATUS_BARS: { key: 'approved' | 'pending' | 'stockConfirmation' | 'rejected'; label: string; color: string }[] = [
  { key: 'approved', label: 'Approved', color: 'var(--success)' },
  { key: 'pending', label: 'Pending', color: 'var(--warning)' },
  { key: 'stockConfirmation', label: 'Stock Confirmation', color: 'var(--info)' },
  { key: 'rejected', label: 'Rejected', color: 'var(--destructive)' },
];

export function OrdersChart({
  data,
  period,
  loading,
}: {
  data: AnalyticsPoint[];
  period: AnalyticsPeriod;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground">Orders</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{SUBTITLE[period]}</p>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading orders…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No orders in this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {STATUS_BARS.map(({ key, label, color }) => (
                <Bar key={key} dataKey={key} name={label} stackId="orders" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
