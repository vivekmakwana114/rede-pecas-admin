'use client';

import { Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatKwanza } from '@/lib/format';
import type { AnalyticsPeriod, AnalyticsPoint } from '@/store/analytics/analyticsSlice';
import { useLocale } from '@/lib/i18n/LocaleContext';

const SUBTITLE_KEY: Record<AnalyticsPeriod, string> = {
  daily: 'dashboard.revenue.subtitleDaily',
  monthly: 'dashboard.revenue.subtitleMonthly',
  yearly: 'dashboard.revenue.subtitleYearly',
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
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-border/80 bg-background p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground">{t('dashboard.revenue.title')}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t(SUBTITLE_KEY[period])}</p>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('dashboard.revenue.loading')}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t('dashboard.revenue.empty')}
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
                formatter={(value) => [formatKwanza(Number(value ?? 0)), t('dashboard.revenue.tooltipLabel')]}
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
