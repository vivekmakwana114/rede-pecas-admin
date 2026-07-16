'use client';

import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { STOCK_STATUS_STYLES } from './stockStatus';
import type { OrderRow, OrderStatus } from './types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  stockConfirmation: 'Awaiting Stock Confirmation',
};

export function OrderDetailModal({
  order,
  onClose,
  onViewProof,
}: {
  order: OrderRow;
  onClose: () => void;
  onViewProof: () => void;
}) {
  const rows: { label: string; value: string }[] = [
    { label: 'Order', value: order.number },
    { label: 'Customer', value: order.customer },
    { label: 'Part', value: order.part },
    ...(order.service
      ? [
          {
            label: 'Service',
            value: order.service.price != null ? `${order.service.name} · ${formatKwanza(order.service.price)}` : order.service.name,
          },
        ]
      : []),
    { label: 'Price', value: formatKwanza(order.price) },
    { label: 'Status', value: STATUS_LABELS[order.status] },
    { label: 'Stock Status', value: order.stockStatus ? STOCK_STATUS_STYLES[order.stockStatus].label : '—' },
    { label: 'Date & Time', value: order.time },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">Order #{order.number}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="space-y-3 px-5 py-4">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>

        {order.hasProof && (
          <div className="flex justify-end border-t border-slate-200 px-5 py-4">
            <button
              onClick={onViewProof}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              View Payment Proof
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
