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
      iconClassName: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Approved',
      value: String(approvedCount),
      icon: CheckCircle,
      iconClassName: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Rejected',
      value: String(rejectedCount),
      icon: XCircle,
      iconClassName: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName, valueClassName }) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className={`mt-1 font-bold text-slate-800 ${valueClassName ?? 'text-2xl'}`}>{value}</p>
          </div>
          <div className={`rounded-lg p-3 ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
