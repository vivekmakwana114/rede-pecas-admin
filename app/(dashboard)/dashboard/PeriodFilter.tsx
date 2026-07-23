'use client';

import type { AnalyticsPeriod } from '@/store/analytics/analyticsSlice';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
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
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onPeriodChange(value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
            period === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
