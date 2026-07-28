'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useLocale } from '@/lib/i18n/LocaleContext';
import type { OrderRow } from './types';

/**
 * Modal for confirming stock on a multi-product "basket" order: one
 * checkbox per line item (name, attached service, quantity, price),
 * defaulting to checked/available. Submitting posts each item's
 * availability in one call — the backend then finalizes the order itself
 * (proforma for the available items, customer notified of what's available
 * vs. not, an alternative-search conversation kicked off for anything left
 * unchecked), so this component only needs to collect and submit the
 * selection.
 */
export function StockConfirmationModal({
  order,
  onClose,
  onSubmit,
}: {
  order: OrderRow;
  onClose: () => void;
  onSubmit: (number: string, items: { itemId: number; available: boolean }[]) => void;
}) {
  const { t } = useLocale();
  const items = order.items ?? [];
  const [availability, setAvailability] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.itemId, true]))
  );

  const toggle = (itemId: number) => {
    setAvailability((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmit = () => {
    onSubmit(
      order.number,
      items.map((item) => ({ itemId: item.itemId, available: availability[item.itemId] ?? true }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">
            {t('orders.stockConfirmationModal.title', { number: order.number })}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('orders.stockConfirmationModal.close')}
            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <p className="mb-3 text-xs text-muted-foreground">{t('orders.stockConfirmationModal.instructions')}</p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.itemId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input
                  type="checkbox"
                  checked={availability[item.itemId] ?? true}
                  onChange={() => toggle(item.itemId)}
                  aria-label={t('orders.stockConfirmationModal.itemAria', { name: item.productName })}
                  className="h-4 w-4 shrink-0 rounded border-border accent-success"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{item.productName}</div>
                  {item.serviceName && (
                    <div className="truncate text-2xs text-muted-foreground">+ {item.serviceName}</div>
                  )}
                  <div className="text-2xs text-muted-foreground">{t('orders.qty', { qty: item.quantity })}</div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatKwanza(item.unitPrice + (item.servicePrice ?? 0))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground shadow-sm transition-all hover:bg-success/90"
          >
            <Check className="h-4 w-4" />
            {t('orders.stockConfirmationModal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
