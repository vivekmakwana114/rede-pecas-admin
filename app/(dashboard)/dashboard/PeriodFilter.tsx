'use client';

import type { AnalyticsPeriod } from '@/store/analytics/analyticsSlice';
import { useLocale } from '@/lib/i18n/LocaleContext';

const PERIODS: { value: AnalyticsPeriod; labelKey: string }[] = [
  { value: 'daily', labelKey: 'dashboard.periods.daily' },
  { value: 'monthly', labelKey: 'dashboard.periods.monthly' },
  { value: 'yearly', labelKey: 'dashboard.periods.yearly' },
];

/**
 * Segmented control for switching the dashboard analytics period between
 * daily, monthly and yearly views.
 */
export function PeriodFilter({
  period,
  onPeriodChange,
}: {
  period: AnalyticsPeriod;
  onPeriodChange: (value: AnalyticsPeriod) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {PERIODS.map(({ value, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => onPeriodChange(value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
            period === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
