import { backendFetch } from '@/lib/backend';
import { getSessionToken } from '@/lib/session';
import { DashboardClient } from './dashboard-client';
import type { ApprovedOrder, Order } from './types';

async function loadInitialOrders(): Promise<{ pending: Order[]; approved: ApprovedOrder[] }> {
  const token = await getSessionToken();
  if (!token) {
    return { pending: [], approved: [] };
  }

  const res = await backendFetch('/admin/orders', { token });
  if (!res.ok) {
    return { pending: [], approved: [] };
  }

  const data = await res.json().catch(() => ({}));
  return { pending: data.pending ?? [], approved: data.approved ?? [] };
}

export default async function DashboardPage() {
  const { pending, approved } = await loadInitialOrders();

  return <DashboardClient initialPending={pending} initialApproved={approved} />;
}
