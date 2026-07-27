'use client';

import { useEffect, useState } from 'react';
import { Loader2, TriangleAlert, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { getOrderDetail } from '@/store/orders/ordersService';
import { Section, InfoRow } from '@/components/DetailPanel';
import { getRawStatusLabel } from './orderStatusLabels';
import { useLocale } from '@/lib/i18n/LocaleContext';

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

/**
 * Converts a snake_case status/method value into a human-readable, title-cased
 * label, or an em dash when the value is null.
 */
function formatLabel(value: string | null): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Slide-over panel showing the full detail of a single order (customer,
 * part, service, vehicle, timeline), fetched on mount, with a shortcut to
 * open the payment proof viewer when a proof exists.
 */
export function OrderDetailModal({
  orderNumber,
  onClose,
  onViewProof,
}: {
  orderNumber: string;
  onClose: () => void;
  onViewProof: () => void;
}) {
  const { t } = useLocale();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getOrderDetail(orderNumber)
      .then((res) => {
        if (!cancelled) setDetail(res.data.data as OrderDetail);
      })
      .catch(() => {
        if (!cancelled) setError(t('orders.detail.loadError'));
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber, t]);

  const total = detail ? Number(detail.unit_price) + Number(detail.service_price || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/60" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">{t('orders.detail.orderLabel')}</p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">#{orderNumber}</h2>
            {detail && (
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{getRawStatusLabel(t, detail.status)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('orders.detail.close')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-destructive">
              <TriangleAlert className="h-8 w-8" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <Section title={t('orders.detail.sectionOrder')}>
                <InfoRow label={t('orders.detail.customer')} value={detail.customer_phone} />
                <InfoRow label={t('orders.detail.paymentMethod')} value={formatLabel(detail.payment_method)} />
              </Section>

              <Section title={t('orders.detail.sectionPart')}>
                <InfoRow label={t('orders.detail.part')} value={detail.product_name} />
                <InfoRow label={t('orders.detail.reference')} value={detail.reference || '—'} />
                <InfoRow label={t('orders.detail.supplier')} value={detail.supplier_name || '—'} />
                <InfoRow label={t('orders.detail.quantity')} value={String(detail.quantity)} />
                <InfoRow label={t('orders.detail.partPrice')} value={formatKwanza(Number(detail.unit_price))} />
                {detail.service_name && (
                  <InfoRow
                    label={t('orders.detail.service')}
                    value={
                      detail.service_price != null
                        ? `${detail.service_name} · ${formatKwanza(Number(detail.service_price))}`
                        : detail.service_name
                    }
                  />
                )}
                <InfoRow label={t('orders.detail.total')} value={formatKwanza(total)} />
              </Section>

              <Section title={t('orders.detail.sectionVehicle')}>
                <InfoRow label={t('orders.detail.engineNumber')} value={detail.customer_engine_number || '—'} />
              </Section>

              <Section title={t('orders.detail.sectionTimeline')}>
                <InfoRow label={t('orders.detail.created')} value={detail.created_at} />
                <InfoRow label={t('orders.detail.approved')} value={detail.approved_at ?? '—'} />
                <InfoRow label={t('orders.detail.lastUpdated')} value={detail.updated_at} />
              </Section>
            </div>
          )}
        </div>

        {detail?.payment_proof_media_id && (
          <div className="flex justify-end border-t border-border px-6 py-4">
            <button
              onClick={onViewProof}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
            >
              {t('orders.detail.viewPaymentProof')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
