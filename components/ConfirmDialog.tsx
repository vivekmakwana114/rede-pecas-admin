'use client';

import { TriangleAlert } from 'lucide-react';

/** Generic yes/no confirmation modal — swap-in replacement for
 *  `window.confirm` so destructive actions get a styled dialog instead of
 *  the browser's native alert. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${destructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
