'use client';

import { Search } from 'lucide-react';
import type { FilterValue } from './types';
import { useLocale } from '@/lib/i18n/LocaleContext';

const FILTERS: { value: FilterValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'orders.filters.all' },
  { value: 'pending', labelKey: 'orders.filters.pending' },
  { value: 'approved', labelKey: 'orders.filters.approved' },
  { value: 'rejected', labelKey: 'orders.filters.rejected' },
  { value: 'stockConfirmation', labelKey: 'orders.filters.stockConfirmation' },
  { value: 'paymentProof', labelKey: 'orders.filters.paymentProof' },
];

const RANGES: { value: 'today' | 'all'; labelKey: string }[] = [
  { value: 'today', labelKey: 'orders.ranges.today' },
  { value: 'all', labelKey: 'orders.ranges.allTime' },
];

/**
 * Renders the orders search box plus the status and date-range filter
 * button groups, showing count badges where provided, above the orders grid.
 */
export function OrderFilter({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  rangeFilter,
  onRangeFilterChange,
  badgeCounts,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: FilterValue;
  onStatusFilterChange: (value: FilterValue) => void;
  rangeFilter: 'today' | 'all';
  onRangeFilterChange: (value: 'today' | 'all') => void;
  badgeCounts?: Partial<Record<FilterValue, number>>;
}) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          {RANGES.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => onRangeFilterChange(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                rangeFilter === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted p-1">
          {FILTERS.map(({ value, labelKey }) => {
            const count = badgeCounts?.[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusFilterChange(value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(labelKey)}
                {Boolean(count) && (
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-2xs font-bold text-secondary-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
