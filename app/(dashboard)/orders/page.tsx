'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, PackageX, Trash2, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cancelOrder, confirmOrderStock, fetchOrders, reviewOrder } from '@/store/orders/ordersSlice';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatsPanel } from './StatsPanel';
import { OrderFilter } from './OrderFilter';
import { PaymentProofModal } from './PaymentProofModal';
import { OrderDetailModal } from './OrderDetailModal';
import { toOrderRow } from './adapters';
import { STOCK_STATUS_STYLES } from './stockStatus';
import type { FilterValue, OrderRow, OrderStatus } from './types';

const ROW_TINT: Record<OrderStatus, string> = {
  pending: 'bg-muted hover:bg-accent/80',
  approved: 'bg-success/10 hover:bg-success/15',
  rejected: 'bg-destructive/10 hover:bg-destructive/15',
  stockConfirmation: 'bg-info/10 hover:bg-info/15',
};

type PaymentStatus = 'pending' | 'approved' | 'rejected';

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-warning/10 text-warning border-warning/30' },
  approved: { label: 'Approved', badge: 'bg-success/10 text-success border-success/30' },
  rejected: { label: 'Rejected', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
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
  const { pending, approved, rejected, stockConfirmation } = useAppSelector((state) => state.orders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [range, setRange] = useState<'today' | 'all'>('all');
  const { toast, showToast } = useToast();

  useEffect(() => {
    dispatch(fetchOrders(range));
    const interval = setInterval(() => dispatch(fetchOrders(range)), 5000);
    return () => clearInterval(interval);
  }, [dispatch, range]);

  const [proofOrder, setProofOrder] = useState<OrderRow | null>(null);
  const [viewOrderNumber, setViewOrderNumber] = useState<string | null>(null);
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
    showToast('Issuing official invoice...', 'info');
    const result = await dispatch(reviewOrder({ number, approved: true }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(`Order #${number} approved successfully!`, 'success');
      dispatch(fetchOrders(range));
    } else {
      showToast('Failed to approve the order.', 'error');
    }
  };

  /**
   * Opens a confirm dialog warning that the invoice will be issued
   * immediately, calling `handleApprove` once the user confirms.
   */
  const handleApproveClick = (number: string) => {
    setConfirmDialog({
      title: `Approve order #${number}?`,
      message: 'The official invoice will be issued and sent to the customer immediately.',
      confirmLabel: 'Approve',
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
    const result = await dispatch(reviewOrder({ number, approved: false }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(`Order #${number} rejected. Customer notified.`, 'success');
      dispatch(fetchOrders(range));
    } else {
      showToast('Failed to reject the order.', 'error');
    }
  };

  /**
   * Opens a confirm dialog warning that the customer will be notified
   * immediately, calling `rejectOrder` once the user confirms.
   */
  const handleReject = (number: string) => {
    setConfirmDialog({
      title: `Reject order #${number}?`,
      message: 'The customer will be notified immediately. This cannot be undone.',
      confirmLabel: 'Reject',
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
    const result = await dispatch(confirmOrderStock({ number, available }));
    if (confirmOrderStock.fulfilled.match(result)) {
      showToast(
        available ? `Stock confirmed for order #${number}.` : `Order #${number} marked stock-unavailable.`,
        'success',
      );
      dispatch(fetchOrders(range));
    } else {
      showToast(available ? 'Failed to confirm stock.' : 'Failed to mark stock unavailable.', 'error');
    }
  };

  /**
   * Opens the appropriate confirm dialog for confirming stock or marking it
   * unavailable, calling `confirmStock` once the user confirms.
   */
  const handleConfirmStock = (number: string, available: boolean) => {
    if (available) {
      setConfirmDialog({
        title: `Confirm stock for order #${number}?`,
        message: 'The proforma and payment-method options will be sent to the customer immediately.',
        confirmLabel: 'Confirm Stock',
        destructive: false,
        onConfirm: () => {
          setConfirmDialog(null);
          confirmStock(number, true);
        },
      });
      return;
    }
    setConfirmDialog({
      title: `Mark order #${number} as stock-unavailable?`,
      message: 'The customer will be notified immediately. This cannot be undone.',
      confirmLabel: 'Mark Unavailable',
      destructive: true,
      onConfirm: () => {
        setConfirmDialog(null);
        confirmStock(number, false);
      },
    });
  };

  /**
   * Dispatches `cancelOrder` to hide the order from the admin grid, showing a
   * result toast and refreshing the orders list on success.
   */
  const cancelOrderAction = async (number: string) => {
    const result = await dispatch(cancelOrder(number));
    if (cancelOrder.fulfilled.match(result)) {
      showToast(`Order #${number} removed from the grid.`, 'success');
      dispatch(fetchOrders(range));
    } else {
      showToast('Failed to remove the order.', 'error');
    }
  };

  /**
   * Opens a confirm dialog warning this only hides the order from the admin
   * view, calling `cancelOrderAction` once the user confirms.
   */
  const handleCancel = (number: string) => {
    setConfirmDialog({
      title: `Remove order #${number} from the grid?`,
      message: "This only hides it from your admin view — it doesn't change the order itself or notify the customer, and can't be undone from here.",
      confirmLabel: 'Remove',
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
      header: 'Order',
      sortable: true,
      sortValue: (row) => row.number,
      cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.customer,
      cell: (row) => <span className="font-mono text-xs text-foreground">{row.customer}</span>,
    },
    {
      key: 'part',
      header: 'Part',
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
      header: 'Price',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.price)}</span>,
    },
    {
      key: 'stockConfirmation',
      header: 'Stock',
      align: 'center',
      cell: (row) => {
        if (row.status !== 'stockConfirmation') {
          return <span className="text-xs text-muted-foreground">Qty: {row.quantity}</span>;
        }
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xs text-muted-foreground">Qty: {row.quantity}</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleConfirmStock(row.number, false)}
                aria-label={`Mark order ${row.number} stock-unavailable`}
                title="Mark Unavailable"
                className="rounded-lg border border-destructive/30 p-1.5 text-destructive transition-all hover:bg-destructive/10"
              >
                <PackageX className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleConfirmStock(row.number, true)}
                aria-label={`Confirm stock for order ${row.number}`}
                title="Confirm Stock"
                className="rounded-lg bg-success p-1.5 text-success-foreground shadow-sm transition-all hover:bg-success/90"
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
      header: 'Stock Status',
      sortable: true,
      align: 'center',
      sortValue: (row) => row.stockStatus ?? '',
      cell: (row) =>
        row.stockStatus ? (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-2xs font-bold ${STOCK_STATUS_STYLES[row.stockStatus].badge}`}
          >
            {STOCK_STATUS_STYLES[row.stockStatus].label}
          </span>
        ) : (
          <span className="text-2xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'paymentProof',
      header: 'Payment Proof',
      align: 'center',
      cell: (row) => {
        if (!row.hasProof && !row.actionable && !row.verifying) {
          return <span className="text-2xs text-muted-foreground">—</span>;
        }
        if (row.verifying) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-1 text-2xs font-bold text-info">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
              Verifying…
            </span>
          );
        }
        return (
          <div className="flex items-center justify-center gap-1.5">
            {row.hasProof && (
              <button
                onClick={() => setProofOrder(row)}
                aria-label={`View payment proof for order ${row.number}`}
                title="View Proof"
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-all hover:bg-accent"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            {row.actionable && (
              <>
                <button
                  onClick={() => handleReject(row.number)}
                  aria-label={`Reject order ${row.number}`}
                  title="Reject"
                  className="rounded-lg border border-destructive/30 p-1 text-destructive transition-all hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleApproveClick(row.number)}
                  aria-label={`Approve order ${row.number}`}
                  title="Approve"
                  className="rounded-lg bg-success p-1 text-success-foreground shadow-sm transition-all hover:bg-success/90"
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
      header: 'Payment Status',
      sortable: true,
      align: 'center',
      sortValue: (row) => paymentStatusOf(row.status),
      cell: (row) => {
        const paymentStatus = paymentStatusOf(row.status);
        return (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-2xs font-bold ${PAYMENT_STATUS_STYLES[paymentStatus].badge}`}
          >
            {PAYMENT_STATUS_STYLES[paymentStatus].label}
          </span>
        );
      },
    },
    {
      key: 'time',
      header: 'Date & Time',
      sortable: true,
      sortValue: (row) => row.sortTime,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.time}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => {
        const removableFromGrid = row.status === 'approved';
        return (
          <div className="flex justify-end">
            <RowActionsMenu
              actions={[
                { label: 'View order', icon: Eye, onClick: () => setViewOrderNumber(row.number) },
                ...(removableFromGrid
                  ? [{ label: 'Remove from grid', icon: Trash2, onClick: () => handleCancel(row.number), destructive: true }]
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
        emptyMessage="No orders match your search or filter."
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
