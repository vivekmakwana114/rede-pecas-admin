'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { GridColumn, SortDirection } from './types';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Presentational, domain-agnostic table: sortable columns, client-side
 * pagination, empty state. Callers own filtering/search and pass in the
 * already-narrowed `rows` — this component only sorts and paginates.
 */
export function Grid<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = 'No records found.',
  rowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: ReactNode;
  /** Extra classes for a row's <tr> — e.g. a status-based background tint. */
  rowClassName?: (row: T) => string | undefined;
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [prevRows, setPrevRows] = useState(rows);

  // Reset to page 1 whenever the underlying set narrows (search/filter), so a
  // stricter query never leaves the user stranded on a now-empty page. Adjusted
  // during render (React's recommended pattern for this) rather than an effect,
  // so it doesn't cost an extra render pass. Callers are responsible for keeping
  // `rows` referentially stable across renders that don't actually change data
  // (e.g. polling) — otherwise this fires on every tick.
  if (rows !== prevRows) {
    setPrevRows(rows);
    setPage(1);
  }

  const sortedRows = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const sortValue = column.sortValue;
    return [...rows].sort((a, b) => {
      const av = sortValue(a);
      const bv = sortValue(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (column: GridColumn<T>) => {
    if (!column.sortable) return;
    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDir('asc');
      return;
    }
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-900/[0.03]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-2xs font-bold uppercase tracking-wider text-slate-900 ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.headerClassName ?? ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="flex w-full items-center justify-between gap-3 transition-colors hover:text-slate-600"
                    >
                      <span>{column.header}</span>
                      {sortKey === column.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 shrink-0 text-slate-300" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={getRowId(row)} className={`transition-colors ${rowClassName?.(row) ?? 'hover:bg-slate-50/60'}`}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3.5 align-middle ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                      } ${column.cellClassName ?? ''}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-600">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
