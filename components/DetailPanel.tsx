import type { ReactNode } from 'react';

/** Groups related fields under a small uppercase heading — shared by every right-side detail drawer (product, order) for a consistent look. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-2xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">{children}</div>
    </div>
  );
}

/** A read-only label/value pair inside a Section. */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
