'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, ListChecks, PackageX, Trash2, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cancelOrder, confirmOrderStock, confirmOrderStockItems, fetchOrders, reviewOrder } from '@/store/orders/ordersSlice';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { StatsPanel } from './StatsPanel';
import { OrderFilter } from './OrderFilter';
import { PaymentProofModal } from './PaymentProofModal';
import { OrderDetailModal } from './OrderDetailModal';
import { StockConfirmationModal } from './StockConfirmationModal';
import { toOrderRow } from './adapters';
import { STOCK_STATUS_BADGE, STOCK_STATUS_LABEL_KEY } from './stockStatus';
import type { FilterValue, OrderRow, OrderStatus } from './types';

const ROW_TINT: Record<OrderStatus, string> = {
  pending: 'bg-muted hover:bg-accent/80',
  approved: 'bg-success/10 hover:bg-success/15',
  rejected: 'bg-destructive/10 hover:bg-destructive/15',
  stockConfirmation: 'bg-info/10 hover:bg-info/15',
};

type PaymentStatus = 'pending' | 'approved' | 'rejected';

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  approved: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
};

/**
 * Collapses the full set of order statuses down to the three-way payment
 * status (pending/approved/rejected) used for the payment status badge.
 */
function paymentStatusOf(status: OrderStatus): PaymentStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

/**
 * Top-level Orders page: renders the stats panel, filter bar, and the orders
 * grid, wiring up stock confirmation, payment review, and cancellation
 * actions plus their confirm dialogs and detail/proof modals. Polls for fresh
 * order data every 5 seconds.
 */
export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { pending, approved, rejected, stockConfirmation } = useAppSelector((state) => state.orders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [range, setRange] = useState<'today' | 'all'>('all');
  const { toast, showToast } = useToast();

  // Orders with a review/confirm action currently in flight — there's no
  // optimistic update, so without this the action buttons stay fully
  // clickable (and visually unchanged) until the post-success `fetchOrders`
  // resolves, inviting a double-submit on a slow connection.
  const [submittingOrders, setSubmittingOrders] = useState<Set<string>>(new Set());
  const setSubmitting = (number: string, value: boolean) => {
    setSubmittingOrders((prev) => {
      const next = new Set(prev);
      if (value) next.add(number);
      else next.delete(number);
      return next;
    });
  };

  useEffect(() => {
    dispatch(fetchOrders(range));
    const interval = setInterval(() => dispatch(fetchOrders(range)), 5000);
    return () => clearInterval(interval);
  }, [dispatch, range]);

  const [proofOrder, setProofOrder] = useState<OrderRow | null>(null);
  const [viewOrderNumber, setViewOrderNumber] = useState<string | null>(null);
  const [stockConfirmationOrder, setStockConfirmationOrder] = useState<OrderRow | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive: boolean;
    onConfirm: () => void;
  } | null>(null);

  /**
   * Dispatches `reviewOrder` with `approved: true`, showing progress and
   * result toasts, and refreshes the orders list on success.
   */
  const handleApprove = async (number: string) => {
    setSubmitting(number, true);
    showToast(t('orders.toasts.issuingInvoice'), 'info');
    const result = await dispatch(reviewOrder({ number, approved: true }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(t('orders.toasts.approveSuccess', { number }), 'success');
      await dispatch(fetchOrders(range));
    } else {
      showToast(t('orders.toasts.approveFailure'), 'error');
    }
    setSubmitting(number, false);
  };

  /**
   * Opens a confirm dialog warning that the invoice will be issued
   * immediately, calling `handleApprove` once the user confirms.
   */
  const handleApproveClick = (number: string) => {
    setConfirmDialog({
      title: t('orders.confirmDialogs.approveTitle', { number }),
      message: t('orders.confirmDialogs.approveMessage'),
      confirmLabel: t('orders.confirmDialogs.approveConfirm'),
      destructive: false,
      onConfirm: () => {
        setConfirmDialog(null);
        handleApprove(number);
      },
    });
  };

  /**
   * Dispatches `reviewOrder` with `approved: false`, showing a result toast
   * and refreshing the orders list on success.
   */
  const rejectOrder = async (number: string) => {
    setSubmitting(number, true);
    const result = await dispatch(reviewOrder({ number, approved: false }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(t('orders.toasts.rejectSuccess', { number }), 'success');
      await dispatch(fetchOrders(range));
    } else {
      showToast(t('orders.toasts.rejectFailure'), 'error');
    }
    setSubmitting(number, false);
  };

  /**
   * Opens a confirm dialog warning that the customer will be notified
   * immediately, calling `rejectOrder` once the user confirms.
   */
  const handleReject = (number: string) => {
    setConfirmDialog({
      title: t('orders.confirmDialogs.rejectTitle', { number }),
      message: t('orders.confirmDialogs.rejectMessage'),
      confirmLabel: t('orders.confirmDialogs.rejectConfirm'),
      destructive: true,
      onConfirm: () => {
        setConfirmDialog(null);
        rejectOrder(number);
      },
    });
  };

  /**
   * Dispatches `confirmOrderStock` with the given availability, showing a
   * result toast and refreshing the orders list on success.
   */
  const confirmStock = async (number: string, available: boolean) => {
    setSubmitting(number, true);
    const result = await dispatch(confirmOrderStock({ number, available }));
    if (confirmOrderStock.fulfilled.match(result)) {
      showToast(
        available
          ? t('orders.toasts.stockConfirmedSuccess', { number })
          : t('orders.toasts.stockUnavailableSuccess', { number }),
        'success',
      );
      await dispatch(fetchOrders(range));
    } else {
      showToast(
        available ? t('orders.toasts.stockConfirmFailure') : t('orders.toasts.stockUnavailableFailure'),
        'error',
      );
    }
    setSubmitting(number, false);
  };

  /**
   * Opens the appropriate confirm dialog for confirming stock or marking it
   * unavailable, calling `confirmStock` once the user confirms.
   */
  const handleConfirmStock = (number: string, available: boolean) => {
    if (available) {
      setConfirmDialog({
        title: t('orders.confirmDialogs.confirmStockTitle', { number }),
        message: t('orders.confirmDialogs.confirmStockMessage'),
        confirmLabel: t('orders.confirmDialogs.confirmStockConfirm'),
        destructive: false,
        onConfirm: () => {
          setConfirmDialog(null);
          confirmStock(number, true);
        },
      });
      return;
    }
    setConfirmDialog({
      title: t('orders.confirmDialogs.markUnavailableTitle', { number }),
      message: t('orders.confirmDialogs.markUnavailableMessage'),
      confirmLabel: t('orders.confirmDialogs.markUnavailableConfirm'),
      destructive: true,
      onConfirm: () => {
        setConfirmDialog(null);
        confirmStock(number, false);
      },
    });
  };

  /**
   * Dispatches `confirmOrderStockItems` with each line item's availability
   * for a multi-product "basket" order, showing a result toast and
   * refreshing the orders list on success. The backend does the rest —
   * proforma for the available items, customer notified of what's
   * available/not, alternative-search kicked off for unchecked items.
   */
  const confirmStockItems = async (number: string, items: { itemId: number; available: boolean }[]) => {
    setSubmitting(number, true);
    const result = await dispatch(confirmOrderStockItems({ number, items }));
    if (confirmOrderStockItems.fulfilled.match(result)) {
      showToast(t('orders.toasts.stockConfirmedSuccess', { number }), 'success');
      await dispatch(fetchOrders(range));
    } else {
      showToast(t('orders.toasts.stockConfirmFailure'), 'error');
    }
    setSubmitting(number, false);
  };

  /**
   * Dispatches `cancelOrder` to hide the order from the admin grid, showing a
   * result toast and refreshing the orders list on success.
   */
  const cancelOrderAction = async (number: string) => {
    const result = await dispatch(cancelOrder(number));
    if (cancelOrder.fulfilled.match(result)) {
      showToast(t('orders.toasts.removeSuccess', { number }), 'success');
      dispatch(fetchOrders(range));
    } else {
      showToast(t('orders.toasts.removeFailure'), 'error');
    }
  };

  /**
   * Opens a confirm dialog warning this only hides the order from the admin
   * view, calling `cancelOrderAction` once the user confirms.
   */
  const handleCancel = (number: string) => {
    setConfirmDialog({
      title: t('orders.confirmDialogs.removeTitle', { number }),
      message: t('orders.confirmDialogs.removeMessage'),
      confirmLabel: t('orders.confirmDialogs.removeConfirm'),
      destructive: true,
      onConfirm: () => {
        setConfirmDialog(null);
        cancelOrderAction(number);
      },
    });
  };

  const allRows = useMemo<OrderRow[]>(
    () =>
      [
        ...pending.map((item) => toOrderRow(item, 'pending')),
        ...approved.map((item) => toOrderRow(item, 'approved')),
        ...rejected.map((item) => toOrderRow(item, 'rejected')),
        ...stockConfirmation.map((item) => toOrderRow(item, 'stockConfirmation')),
      ].sort((a, b) => b.lastChangedTime - a.lastChangedTime),
    [pending, approved, rejected, stockConfirmation],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (statusFilter === 'paymentProof') {
        if (!row.hasProof) return false;
      } else if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [row.number, row.customer, row.part].some((field) => field.toLowerCase().includes(normalizedQuery));
    });
  }, [allRows, query, statusFilter]);

  const badgeCounts: Partial<Record<FilterValue, number>> = {
    stockConfirmation: stockConfirmation.length,
    paymentProof: pending.filter((o) => o.has_proof).length,
  };

  const columns: GridColumn<OrderRow>[] = [
    {
      key: 'number',
      header: t('orders.columns.order'),
      sortable: true,
      sortValue: (row) => row.number,
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.number}</span>,
    },
    {
      key: 'customer',
      header: t('orders.columns.customer'),
      sortable: true,
      sortValue: (row) => row.customer,
      cell: (row) => <span className="font-mono text-xs text-foreground">{row.customer}</span>,
    },
    {
      key: 'part',
      header: t('orders.columns.part'),
      sortable: true,
      sortValue: (row) => row.part,
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground">{row.part}</span>
          {row.service && (
            <div className="text-2xs text-muted-foreground">
              + {row.service.name}
              {row.service.price != null && <> · {formatKwanza(row.service.price)}</>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      header: t('orders.columns.price'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.price)}</span>,
    },
    {
      key: 'stockConfirmation',
      header: t('orders.columns.stock'),
      align: 'center',
      cell: (row) => {
        if (row.status !== 'stockConfirmation') {
          return <span className="text-xs text-muted-foreground">{t('orders.qty', { qty: row.quantity })}</span>;
        }
        const isSubmitting = submittingOrders.has(row.number);
        const isBasketOrder = (row.items?.length ?? 0) > 0;
        if (isBasketOrder) {
          const pendingItemsCount = row.items!.filter((item) => item.availabilityStatus === 'pending').length;
          if (pendingItemsCount > 0) {
            return (
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xs text-muted-foreground">
                  {t('orders.itemsCount', { count: pendingItemsCount })}
                </span>
                <button
                  onClick={() => setStockConfirmationOrder(row)}
                  disabled={isSubmitting}
                  aria-label={t('orders.reviewItemsAria', { number: row.number })}
                  title={t('orders.reviewItems')}
                  className="flex items-center gap-1 rounded-lg border border-info/30 px-2 py-1 text-2xs font-semibold text-info transition-all hover:bg-info/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {t('orders.reviewItems')}
                </button>
              </div>
            );
          }
          // Every item this admin currently knows about already has a
          // decision (some available, some unavailable) but the order is
          // still in this bucket — it's paused waiting on the customer to
          // pick a substitute for whatever was unavailable
          // (awaiting_alternative_resolution on the backend). There is
          // nothing for an admin to action right now, so this must NOT fall
          // through to the legacy single-product Approve/Reject buttons
          // below — those post a whole-order `{available}` body that's
          // meaningless for a basket order.
          return (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xs text-muted-foreground">{t('orders.waitingOnCustomer')}</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xs text-muted-foreground">{t('orders.qty', { qty: row.quantity })}</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleConfirmStock(row.number, false)}
                disabled={isSubmitting}
                aria-label={t('orders.markUnavailableAria', { number: row.number })}
                title={t('orders.markUnavailable')}
                className="rounded-lg border border-destructive/30 p-1.5 text-destructive transition-all hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PackageX className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleConfirmStock(row.number, true)}
                disabled={isSubmitting}
                aria-label={t('orders.confirmStockAria', { number: row.number })}
                title={t('orders.confirmStock')}
                className="rounded-lg bg-success p-1.5 text-success-foreground shadow-sm transition-all hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      },
    },
    {
      key: 'stockStatus',
      header: t('orders.columns.stockStatus'),
      sortable: true,
      align: 'center',
      sortValue: (row) => row.stockStatus ?? '',
      cell: (row) =>
        row.stockStatus ? (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-2xs font-bold ${STOCK_STATUS_BADGE[row.stockStatus]}`}
          >
            {t(STOCK_STATUS_LABEL_KEY[row.stockStatus])}
          </span>
        ) : (
          <span className="text-2xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'paymentProof',
      header: t('orders.columns.paymentProof'),
      align: 'center',
      cell: (row) => {
        if (!row.hasProof && !row.actionable && !row.verifying) {
          return <span className="text-2xs text-muted-foreground">—</span>;
        }
        if (row.verifying) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-1 text-2xs font-bold text-info">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
              {t('orders.verifying')}
            </span>
          );
        }
        return (
          <div className="flex items-center justify-center gap-1.5">
            {row.hasProof && (
              <button
                onClick={() => setProofOrder(row)}
                aria-label={t('orders.viewProofAria', { number: row.number })}
                title={t('orders.viewProof')}
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-all hover:bg-accent"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {row.actionable && (
              <>
                <button
                  onClick={() => handleReject(row.number)}
                  disabled={submittingOrders.has(row.number)}
                  aria-label={t('orders.rejectAria', { number: row.number })}
                  title={t('orders.reject')}
                  className="rounded-lg border border-destructive/30 p-1 text-destructive transition-all hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleApproveClick(row.number)}
                  disabled={submittingOrders.has(row.number)}
                  aria-label={t('orders.approveAria', { number: row.number })}
                  title={t('orders.approve')}
                  className="rounded-lg bg-success p-1 text-success-foreground shadow-sm transition-all hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'paymentStatus',
      header: t('orders.columns.paymentStatus'),
      sortable: true,
      align: 'center',
      sortValue: (row) => paymentStatusOf(row.status),
      cell: (row) => {
        const paymentStatus = paymentStatusOf(row.status);
        return (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-2xs font-bold ${PAYMENT_STATUS_BADGE[paymentStatus]}`}
          >
            {t(`orders.paymentStatus.${paymentStatus}`)}
          </span>
        );
      },
    },
    {
      key: 'time',
      header: t('orders.columns.dateTime'),
      sortable: true,
      sortValue: (row) => row.sortTime,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.time}</span>,
    },
    {
      key: 'actions',
      header: t('orders.columns.actions'),
      align: 'right',
      cell: (row) => {
        const removableFromGrid = row.status === 'approved';
        return (
          <div className="flex justify-end">
            <RowActionsMenu
              actions={[
                { label: t('orders.viewOrder'), icon: Eye, onClick: () => setViewOrderNumber(row.number) },
                ...(removableFromGrid
                  ? [{ label: t('orders.removeFromGrid'), icon: Trash2, onClick: () => handleCancel(row.number), destructive: true }]
                  : []),
              ]}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <StatsPanel pendingCount={pending.length} approvedCount={approved.length} rejectedCount={rejected.length} />

      <OrderFilter
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        rangeFilter={range}
        onRangeFilterChange={setRange}
        badgeCounts={badgeCounts}
      />

      <Grid
        columns={columns}
        rows={filteredRows}
        getRowId={(row) => row.number}
        emptyMessage={t('orders.emptyGrid')}
        rowClassName={(row) => ROW_TINT[row.status]}
      />

      {proofOrder && (
        <PaymentProofModal
          number={proofOrder.number}
          mediaType={proofOrder.proofMediaType}
          reviewable={proofOrder.actionable}
          onClose={() => setProofOrder(null)}
          onApprove={(number) => {
            setProofOrder(null);
            handleApproveClick(number);
          }}
          onReject={(number) => {
            setProofOrder(null);
            handleReject(number);
          }}
        />
      )}

      {viewOrderNumber && (
        <OrderDetailModal
          orderNumber={viewOrderNumber}
          onClose={() => setViewOrderNumber(null)}
          onViewProof={() => {
            const row = allRows.find((r) => r.number === viewOrderNumber);
            if (row) setProofOrder(row);
            setViewOrderNumber(null);
          }}
        />
      )}

      {stockConfirmationOrder && (
        <StockConfirmationModal
          order={stockConfirmationOrder}
          onClose={() => setStockConfirmationOrder(null)}
          onSubmit={(number, items) => {
            setStockConfirmationOrder(null);
            confirmStockItems(number, items);
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          destructive={confirmDialog.destructive}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
