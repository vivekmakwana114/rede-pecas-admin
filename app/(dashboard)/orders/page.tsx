'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, PackageX, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { confirmOrderStock, fetchOrders, reviewOrder } from '@/store/orders/ordersSlice';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { StatsPanel } from './StatsPanel';
import { OrderFilter } from './OrderFilter';
import { PaymentProofModal } from './PaymentProofModal';
import { toOrderRow } from './adapters';
import type { FilterValue, OrderRow, OrderStatus } from './types';

// Row tinting still keys off the underlying bucket (pending/approved/rejected/
// stockConfirmation) — only the visible "Payment Status" column's label
// changed to reflect the payment decision specifically (see paymentStatusOf below).
const ROW_TINT: Record<OrderStatus, string> = {
  pending: 'bg-slate-50 hover:bg-slate-100/80',
  approved: 'bg-emerald-50 hover:bg-emerald-100/70',
  rejected: 'bg-red-50 hover:bg-red-100/70',
  stockConfirmation: 'bg-sky-50 hover:bg-sky-100/70',
};

type PaymentStatus = 'pending' | 'approved' | 'rejected';

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { label: string; badge: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700 border-red-200' },
};

// Nothing's been decided yet for a still-pending order, whether it's waiting
// on stock confirmation or already at proof review — both read as "Pending".
function paymentStatusOf(status: OrderStatus): PaymentStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { pending, approved, rejected, stockConfirmation } = useAppSelector((state) => state.orders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const { toast, showToast } = useToast();

  useEffect(() => {
    // Auth is handled globally by the axios interceptor in lib/api.ts (attaches
    // the token, redirects to /login on 401), so this just needs to poll.
    dispatch(fetchOrders());
    const interval = setInterval(() => dispatch(fetchOrders()), 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleApprove = async (number: string) => {
    showToast('Issuing official invoice...', 'info');
    const result = await dispatch(reviewOrder({ number, approved: true }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(`Order #${number} approved successfully!`, 'success');
      dispatch(fetchOrders());
    } else {
      showToast('Failed to approve the order.', 'error');
    }
  };

  const handleReject = async (number: string) => {
    if (!window.confirm(`Are you sure you want to reject order #${number}?`)) return;
    const result = await dispatch(reviewOrder({ number, approved: false }));
    if (reviewOrder.fulfilled.match(result)) {
      showToast(`Order #${number} rejected. Customer notified.`, 'success');
      dispatch(fetchOrders());
    } else {
      showToast('Failed to reject the order.', 'error');
    }
  };

  const handleConfirmStock = async (number: string, available: boolean) => {
    if (!available && !window.confirm(`Mark order #${number} as stock-unavailable? The customer will be notified.`)) return;
    const result = await dispatch(confirmOrderStock({ number, available }));
    if (confirmOrderStock.fulfilled.match(result)) {
      showToast(
        available ? `Stock confirmed for order #${number}.` : `Order #${number} marked stock-unavailable.`,
        'success',
      );
      dispatch(fetchOrders());
    } else {
      showToast(available ? 'Failed to confirm stock.' : 'Failed to mark stock unavailable.', 'error');
    }
  };

  const [proofOrder, setProofOrder] = useState<OrderRow | null>(null);

  const allRows = useMemo<OrderRow[]>(
    () => [
      ...pending.map((item) => toOrderRow(item, 'pending')),
      ...approved.map((item) => toOrderRow(item, 'approved')),
      ...rejected.map((item) => toOrderRow(item, 'rejected')),
      ...stockConfirmation.map((item) => toOrderRow(item, 'stockConfirmation')),
    ],
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

  // Badges on the filter bar flag what's new/not-yet-reviewed — every
  // stockConfirmation-bucket order is by definition still awaiting a
  // confirm/unavailable decision, and a proof only needs attention while
  // its order is still pending (an approved/rejected order's proof is just
  // there for audit, viewable via the Payment Proof column either way).
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
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.customer,
      cell: (row) => <span className="font-mono text-xs text-slate-700">{row.customer}</span>,
    },
    {
      key: 'part',
      header: 'Part',
      sortable: true,
      sortValue: (row) => row.part,
      cell: (row) => <span className="font-semibold text-slate-800">{row.part}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-slate-800">{formatKwanza(row.price)}</span>,
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
      key: 'stockConfirmation',
      header: 'Stock Confirmation',
      align: 'center',
      cell: (row) => {
        if (row.status !== 'stockConfirmation') return <span className="text-2xs text-slate-300">—</span>;
        return (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleConfirmStock(row.number, false)}
              aria-label={`Mark order ${row.number} stock-unavailable`}
              title="Mark Unavailable"
              className="rounded-lg border border-red-200 p-1.5 text-red-600 transition-all hover:bg-red-50"
            >
              <PackageX className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleConfirmStock(row.number, true)}
              aria-label={`Confirm stock for order ${row.number}`}
              title="Confirm Stock"
              className="rounded-lg bg-emerald-600 p-1.5 text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'paymentProof',
      header: 'Payment Proof',
      align: 'center',
      cell: (row) => {
        if (!row.hasProof) return <span className="text-2xs text-slate-300">—</span>;
        return (
          <button
            onClick={() => setProofOrder(row)}
            aria-label={`View payment proof for order ${row.number}`}
            title="View Proof"
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-all hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
          </button>
        );
      },
    },
    {
      key: 'time',
      header: 'Time',
      sortable: true,
      sortValue: (row) => row.sortTime,
      cell: (row) => <span className="text-xs text-slate-500">{row.time}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => {
        if (!row.actionable) return <span className="text-2xs text-slate-300">—</span>;
        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleReject(row.number)}
              aria-label={`Reject order ${row.number}`}
              title="Reject"
              className="rounded-lg border border-red-200 p-1.5 text-red-600 transition-all hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleApprove(row.number)}
              aria-label={`Approve order ${row.number}`}
              title="Approve"
              className="rounded-lg bg-emerald-600 p-1.5 text-white shadow-sm transition-all hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
            </button>
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
            handleApprove(number);
          }}
          onReject={(number) => {
            setProofOrder(null);
            handleReject(number);
          }}
        />
      )}
    </div>
  );
}
