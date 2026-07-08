import { formatKwanza } from '@/lib/format';
import type { Order } from './types';

export function OrderCard({
  order,
  onApprove,
  onReject,
}: {
  order: Order;
  onApprove: (number: string) => void;
  onReject: (number: string) => void;
}) {
  return (
    <div className="p-6 hover:bg-slate-50/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-sm font-bold text-slate-800 mr-2">{order.number}</span>
          <span className="text-xs font-semibold text-slate-500">at {order.time}</span>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-2xs font-bold ${
            order.has_proof
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {order.has_proof ? 'Proof Received' : 'Awaiting Payment'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs mb-4">
        <div>
          <p className="text-slate-400 font-medium">Part</p>
          <p className="font-bold text-slate-800 mt-0.5">{order.part}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">SKU Reference</p>
          <p className="font-bold text-slate-800 mt-0.5">{order.reference}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Supplier</p>
          <p className="font-bold text-slate-800 mt-0.5">{order.supplier}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Price</p>
          <p className="font-bold text-emerald-700 mt-0.5">{formatKwanza(order.price)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-400 font-medium">Customer (WhatsApp)</p>
          <p className="font-bold text-slate-800 mt-0.5">{order.customer}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onReject(order.number)}
          className="flex-1 py-2 px-4 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-all"
        >
          ❌ Reject Order
        </button>
        <button
          onClick={() => onApprove(order.number)}
          className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
        >
          ✅ Confirm Payment & Invoice
        </button>
      </div>
    </div>
  );
}
