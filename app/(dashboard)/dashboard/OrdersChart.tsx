'use client';

import { Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsPeriod, AnalyticsPoint } from '@/store/analytics/analyticsSlice';
import { useLocale } from '@/lib/i18n/LocaleContext';

const SUBTITLE_KEY: Record<AnalyticsPeriod, string> = {
  daily: 'dashboard.orders.subtitleDaily',
  monthly: 'dashboard.orders.subtitleMonthly',
  yearly: 'dashboard.orders.subtitleYearly',
};

const STATUS_BARS: { key: 'approved' | 'pending' | 'stockConfirmation' | 'rejected'; labelKey: string; color: string }[] = [
  { key: 'approved', labelKey: 'dashboard.orders.statusApproved', color: 'var(--success)' },
  { key: 'pending', labelKey: 'dashboard.orders.statusPending', color: 'var(--warning)' },
  { key: 'stockConfirmation', labelKey: 'dashboard.orders.statusStockConfirmation', color: 'var(--info)' },
  { key: 'rejected', labelKey: 'dashboard.orders.statusRejected', color: 'var(--destructive)' },
];

/**
 * Stacked bar chart of order counts by status (approved/pending/stock
 * confirmation/rejected) over the selected analytics period.
 */
export function OrdersChart({
  data,
  period,
  loading,
}: {
  data: AnalyticsPoint[];
  period: AnalyticsPeriod;
  loading: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground">{t('dashboard.orders.title')}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t(SUBTITLE_KEY[period])}</p>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('dashboard.orders.loading')}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">{t('dashboard.orders.empty')}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {STATUS_BARS.map(({ key, labelKey, color }) => (
                <Bar key={key} dataKey={key} name={t(labelKey)} stackId="orders" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
