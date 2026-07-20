'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, TriangleAlert, X } from 'lucide-react';
import { getPaymentProof } from '@/store/orders/ordersService';

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
  /** Only pending orders can still be approved/rejected — everything else
   *  (already approved/rejected) is shown here purely for audit viewing. */
  reviewable: boolean;
  onClose: () => void;
  onApprove: (number: string) => void;
  onReject: (number: string) => void;
}) {
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
        if (!cancelled) setError('Could not load the payment proof.');
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [number]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Payment Proof — Order #{number}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
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
            <iframe src={objectUrl} title="Payment proof PDF" className="h-[65vh] w-full rounded-lg border border-border" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={objectUrl} alt="Payment proof" className="max-h-[65vh] w-full rounded-lg object-contain" />
          )}
        </div>

        {reviewable && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              onClick={() => onReject(number)}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => onApprove(number)}
              className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground shadow-sm transition-all hover:bg-success/90"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
