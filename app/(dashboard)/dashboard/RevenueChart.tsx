'use client';

import { Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatKwanza } from '@/lib/format';
import type { AnalyticsPeriod, AnalyticsPoint } from '@/store/analytics/analyticsSlice';

const SUBTITLE: Record<AnalyticsPeriod, string> = {
  daily: 'Approved orders, by hour today',
  monthly: 'Approved orders, by day this month',
  yearly: 'Approved orders, by month this year',
};

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
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">Revenue</h3>
      <p className="mt-0.5 text-xs text-slate-500">{SUBTITLE[period]}</p>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading revenue…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No approved orders in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={72}
                tickFormatter={(value: number) => formatKwanza(value)}
              />
              <Tooltip
                formatter={(value) => [formatKwanza(Number(value ?? 0)), 'Revenue']}
                contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0071e3" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
