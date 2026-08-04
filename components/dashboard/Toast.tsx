import type { ToastState } from './useToast';

/**
 * Fixed-position toast notification, styled by type (success/error/info).
 * Renders nothing while the given toast state is hidden.
 */
export function Toast({ toast }: { toast: ToastState }) {
  if (!toast.show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border text-sm font-semibold text-white flex items-center gap-3 transition-all ${
        toast.type === 'success'
          ? 'bg-success border-success/80'
          : toast.type === 'error'
            ? 'bg-destructive border-destructive/80'
            : 'bg-foreground border-foreground/80'
      }`}
    >
      <span>{toast.msg}</span>
    </div>
  );
}
