import type { ToastState } from './useToast';

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast.show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border text-sm font-semibold text-white flex items-center gap-3 transition-all ${
        toast.type === 'success'
          ? 'bg-emerald-600 border-emerald-500'
          : toast.type === 'error'
            ? 'bg-red-600 border-red-500'
            : 'bg-slate-800 border-slate-700'
      }`}
    >
      <span>{toast.msg}</span>
    </div>
  );
}
