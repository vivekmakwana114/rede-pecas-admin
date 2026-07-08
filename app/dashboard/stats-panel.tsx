import { AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { formatKwanza } from '@/lib/format';

export function StatsPanel({
  pendingCount,
  approvedCount,
  totalBilledToday,
}: {
  pendingCount: number;
  approvedCount: number;
  totalBilledToday: number;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Metrics</h2>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending Orders</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Approved Today</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{approvedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Daily Revenue</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{formatKwanza(totalBilledToday)}</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
