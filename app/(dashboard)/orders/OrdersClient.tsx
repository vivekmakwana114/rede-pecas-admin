'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/auth/authSlice';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { OrderCard } from './OrderCard';
import { StatsPanel } from './StatsPanel';
import type { ApprovedOrder, Order } from './types';

export function OrdersClient({
  initialPending,
  initialApproved,
}: {
  initialPending: Order[];
  initialApproved: ApprovedOrder[];
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.tokens?.access?.token);
  const [pendingOrders, setPendingOrders] = useState<Order[]>(initialPending);
  const [approvedOrders, setApprovedOrders] = useState<ApprovedOrder[]>(initialApproved);
  const { toast, showToast } = useToast();

  const loadOrders = async (token: string) => {
    try {
      const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        dispatch(logout());
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
    if (!accessToken) return;

    // loadOrders sets state only after its internal `await fetch` resolves, not
    // synchronously during this effect — safe despite the lint rule's static check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders(accessToken);
    const interval = setInterval(() => loadOrders(accessToken), 15000); // refresh every 15s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleApprove = async (number: string) => {
    if (!accessToken) return;
    showToast('Issuing official invoice...', 'info');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(number)}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to approve');
      showToast(`Order #${number} approved successfully!`, 'success');
      loadOrders(accessToken);
    } catch {
      showToast('Failed to approve the order.', 'error');
    }
  };

  const handleReject = async (number: string) => {
    if (!accessToken) return;
    if (!window.confirm(`Are you sure you want to reject order #${number}?`)) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(number)}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to reject');
      showToast(`Order #${number} rejected. Customer notified.`, 'success');
      loadOrders(accessToken);
    } catch {
      showToast('Failed to reject the order.', 'error');
    }
  };

  const totalBilledToday = approvedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <>
      <Toast toast={toast} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatsPanel
            pendingCount={pendingOrders.length}
            approvedCount={approvedOrders.length}
            totalBilledToday={totalBilledToday}
          />
        </div>

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
      </div>
    </>
  );
}
