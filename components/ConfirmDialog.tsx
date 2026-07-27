'use client';

import { TriangleAlert } from 'lucide-react';
import { useLocale } from '@/lib/i18n/LocaleContext';

/**
 * Modal confirmation prompt with a title, message, and confirm/cancel buttons.
 * Styles the confirm button as destructive when the action is irreversible.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl bg-background p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${destructive ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
              destructive
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
