'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, TriangleAlert, X } from 'lucide-react';
import { getPaymentProof } from '@/store/orders/ordersService';
import { useLocale } from '@/lib/i18n/LocaleContext';

/**
 * Modal that fetches and displays an order's uploaded payment proof (image or
 * PDF) as a blob URL, with Approve/Reject actions shown when the order is
 * still reviewable.
 */
export function PaymentProofModal({
  number,
  mediaType,
  reviewable,
  onClose,
  onApprove,
  onReject,
}: {
  number: string;
  mediaType?: 'image' | 'document' | null;
  reviewable: boolean;
  onClose: () => void;
  onApprove: (number: string) => void;
  onReject: (number: string) => void;
}) {
  const { t } = useLocale();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    getPaymentProof(number)
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setObjectUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(t('orders.proof.loadError'));
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [number, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">{t('orders.proof.title', { number })}</h2>
          <button
            onClick={onClose}
            aria-label={t('orders.proof.close')}
            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto p-5">
          {error ? (
            <div className="flex flex-col items-center gap-2 text-destructive">
              <TriangleAlert className="h-8 w-8" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : !objectUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : mediaType === 'document' ? (
            <iframe src={objectUrl} title={t('orders.proof.pdfTitle')} className="h-[65vh] w-full rounded-lg border border-border" />
          ) : (
            <img src={objectUrl} alt={t('orders.proof.imageAlt')} className="max-h-[65vh] w-full rounded-lg object-contain" />
          )}
        </div>

        {reviewable && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              onClick={() => onReject(number)}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              {t('orders.proof.reject')}
            </button>
            <button
              onClick={() => onApprove(number)}
              className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground shadow-sm transition-all hover:bg-success/90"
            >
              <Check className="h-4 w-4" />
              {t('orders.proof.approve')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
