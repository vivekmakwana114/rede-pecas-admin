'use client';

import { useEffect, useState } from 'react';
import { Loader2, TriangleAlert, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { getOrderDetail } from '@/store/orders/ordersService';
import { RAW_STATUS_LABELS } from './orderStatusLabels';

// Full order row as returned by GET /admin/orders/:number (order.model.ts's
// getOrderByNumber: `SELECT o.*, p.name AS product_name, p.reference,
// s.name AS supplier_name`) — a superset of the trimmed list-row shape.
interface OrderDetail {
  number: string;
  customer_phone: string;
  product_name: string;
  reference: string;
  supplier_name: string;
  quantity: number;
  unit_price: string | number;
  status: string;
  payment_method: string | null;
  customer_engine_number: string | null;
  service_name: string | null;
  service_price: string | number | null;
  payment_proof_media_id: string | null;
  created_at: string;
  approved_at: string | null;
  updated_at: string;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLabel(value: string | null): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrderDetailModal({
  orderNumber,
  onClose,
  onViewProof,
}: {
  orderNumber: string;
  onClose: () => void;
  onViewProof: () => void;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getOrderDetail(orderNumber)
      .then((res) => {
        if (!cancelled) setDetail(res.data.data as OrderDetail);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load order details.');
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const rows: { label: string; value: string }[] = detail
    ? [
        { label: 'Order', value: detail.number },
        { label: 'Customer', value: detail.customer_phone },
        { label: 'Part', value: detail.product_name },
        { label: 'Reference', value: detail.reference || '—' },
        { label: 'Supplier', value: detail.supplier_name || '—' },
        { label: 'Quantity', value: String(detail.quantity) },
        ...(detail.service_name
          ? [
              {
                label: 'Service',
                value:
                  detail.service_price != null
                    ? `${detail.service_name} · ${formatKwanza(Number(detail.service_price))}`
                    : detail.service_name,
              },
            ]
          : []),
        { label: 'Part Price', value: formatKwanza(Number(detail.unit_price)) },
        {
          label: 'Total',
          value: formatKwanza(Number(detail.unit_price) + Number(detail.service_price || 0)),
        },
        { label: 'Status', value: RAW_STATUS_LABELS[detail.status] ?? detail.status },
        { label: 'Payment Method', value: formatLabel(detail.payment_method) },
        { label: 'Engine Number', value: detail.customer_engine_number || '—' },
        { label: 'Created', value: formatDateTime(detail.created_at) },
        { label: 'Approved', value: formatDateTime(detail.approved_at) },
        { label: 'Last Updated', value: formatDateTime(detail.updated_at) },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">Order #{orderNumber}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-red-600">
            <TriangleAlert className="h-8 w-8" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : !detail ? (
          <div className="flex flex-1 items-center justify-center px-5 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <dl className="space-y-3 overflow-y-auto px-5 py-4">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                  <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>

            {detail.payment_proof_media_id && (
              <div className="flex justify-end border-t border-slate-200 px-5 py-4">
                <button
                  onClick={onViewProof}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
                >
                  View Payment Proof
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
