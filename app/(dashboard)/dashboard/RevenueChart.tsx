'use client';

import { Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatKwanza } from '@/lib/format';
import type { AnalyticsPeriod, AnalyticsPoint } from '@/store/analytics/analyticsSlice';

const SUBTITLE: Record<AnalyticsPeriod, string> = {
  daily: 'Approved orders, last 24 hours by hour',
  monthly: 'Approved orders, last 30 days by day',
  yearly: 'Approved orders, last 12 months by month',
};

/**
 * Area chart of approved-order revenue over the selected analytics period.
 */
export function RevenueChart({
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
      <h3 className="text-sm font-bold text-foreground">Revenue</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{SUBTITLE[period]}</p>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading revenue…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No approved orders in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={72}
                tickFormatter={(value: number) => formatKwanza(value)}
              />
              <Tooltip
                formatter={(value) => [formatKwanza(Number(value ?? 0)), 'Revenue']}
                contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
