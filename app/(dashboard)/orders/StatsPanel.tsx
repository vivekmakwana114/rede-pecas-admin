import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  valueClassName?: string;
}

export function StatsPanel({
  pendingCount,
  approvedCount,
  rejectedCount,
}: {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}) {
  const cards: StatCard[] = [
    {
      label: 'Pending',
      value: String(pendingCount),
      icon: AlertCircle,
      iconClassName: 'bg-warning/10 text-warning',
    },
    {
      label: 'Approved',
      value: String(approvedCount),
      icon: CheckCircle,
      iconClassName: 'bg-success/10 text-success',
    },
    {
      label: 'Rejected',
      value: String(rejectedCount),
      icon: XCircle,
      iconClassName: 'bg-destructive/10 text-destructive',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName, valueClassName }) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-5 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className={`mt-1 font-bold text-foreground ${valueClassName ?? 'text-2xl'}`}>{value}</p>
          </div>
          <div className={`rounded-lg p-3 ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
