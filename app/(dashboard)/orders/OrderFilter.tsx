'use client';

import { Search } from 'lucide-react';
import type { FilterValue } from './types';

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'stockConfirmation', label: 'Stock Confirmation' },
  { value: 'paymentProof', label: 'Payment Proof' },
];

const RANGES: { value: 'today' | 'all'; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'all', label: 'All Time' },
];

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
  /** New/not-yet-reviewed count shown as a pill next to a filter's label —
   *  e.g. how many stock-confirmation orders or payment proofs are still
   *  awaiting a decision. Omitted or 0 renders no pill. */
  badgeCounts?: Partial<Record<FilterValue, number>>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onRangeFilterChange(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                rangeFilter === value ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search order, customer, part…"
            className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {FILTERS.map(({ value, label }) => {
            const count = badgeCounts?.[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusFilterChange(value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === value ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
                {Boolean(count) && (
                  <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-2xs font-bold text-white">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
