'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { GridColumn, SortDirection } from './types';
import { useLocale } from '@/lib/i18n/LocaleContext';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Generic paginated, sortable data table. Renders the given columns/rows,
 * handles client-side sorting and page navigation, and shows an empty-state
 * message when there are no rows.
 */
export function Grid<T>({
  columns,
  rows,
  getRowId,
  emptyMessage,
  rowClassName,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
  pageSize?: number;
}) {
  const { t } = useLocale();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [prevRows, setPrevRows] = useState(rows);

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

  /**
   * Updates sort state when a sortable column header is clicked — switches
   * to the clicked column ascending, or flips direction if already sorted by it.
   */
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
    <div className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-foreground/[0.03]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-2xs font-bold tracking-wider text-foreground ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.headerClassName ?? ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="flex w-full items-center justify-between gap-3 transition-colors hover:text-muted-foreground"
                    >
                      <span>{column.header}</span>
                      {sortKey === column.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage ?? t('grid.noRecords')}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={getRowId(row)} className={`transition-colors ${rowClassName?.(row) ?? 'hover:bg-accent/60'}`}>
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
        <div className="flex items-center justify-between border-t border-border/80 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {t('grid.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, sortedRows.length),
              total: sortedRows.length,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label={t('grid.previousPage')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-muted-foreground">
              {t('grid.page', { current: currentPage, total: pageCount })}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label={t('grid.nextPage')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
