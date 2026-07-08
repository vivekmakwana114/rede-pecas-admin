'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Database, LogOut } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { OrderCard } from './order-card';
import { StatsPanel } from './stats-panel';
import { UploadPanel } from './upload-panel';
import type { ApprovedOrder, Order } from './types';

export function DashboardClient({
  initialPending,
  initialApproved,
}: {
  initialPending: Order[];
  initialApproved: ApprovedOrder[];
}) {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<Order[]>(initialPending);
  const [approvedOrders, setApprovedOrders] = useState<ApprovedOrder[]>(initialApproved);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    msg: '',
    type: 'info',
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 4000);
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setPendingOrders(data.pending || []);
      setApprovedOrders(data.approved || []);
    } catch (err) {
      console.error('Error loading dashboard orders', err);
      showToast('Failed to load order data.', 'error');
    }
  };

  useEffect(() => {
    const interval = setInterval(loadOrders, 15000); // refresh every 15s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleApprove = async (number: string) => {
    showToast('Issuing official invoice...', 'info');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(number)}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve');
      showToast(`Order #${number} approved successfully!`, 'success');
      loadOrders();
    } catch {
      showToast('Failed to approve the order.', 'error');
    }
  };

  const handleReject = async (number: string) => {
    if (!window.confirm(`Are you sure you want to reject order #${number}?`)) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(number)}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reject');
      showToast(`Order #${number} rejected. Customer notified.`, 'success');
      loadOrders();
    } catch {
      showToast('Failed to reject the order.', 'error');
    }
  };

  const totalBilledToday = approvedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header bar */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold tracking-tight">Rede Peças — Order Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('en-GB')}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Toast Notification banner */}
      {toast.show && (
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
      )}

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Stats and Excel uploader */}
        <div className="lg:col-span-1 space-y-8">
          <StatsPanel
            pendingCount={pendingOrders.length}
            approvedCount={approvedOrders.length}
            totalBilledToday={totalBilledToday}
          />
          <UploadPanel showToast={showToast} />
        </div>

        {/* Right Side: Orders tables lists */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/5 border-b border-slate-200/80">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">⏳ Orders Pending Approval</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No orders pending approval. ✅</div>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard key={order.number} order={order} onApprove={handleApprove} onReject={handleReject} />
                ))
              )}
            </div>
          </div>

          {/* Approved Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/5 border-b border-slate-200/80">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">✅ Approved Today</h2>
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {approvedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No orders approved yet today.</div>
              ) : (
                approvedOrders.map((order) => (
                  <div key={order.number} className="p-4 flex items-center justify-between hover:bg-slate-50/20">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.number}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {order.part} · {order.customer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{formatKwanza(order.price)}</p>
                      <p className="text-2xs font-semibold text-slate-400 mt-0.5">Approved at {order.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
