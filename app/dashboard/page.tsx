import { DashboardClient } from './dashboard-client';

// Auth tokens live client-side only (Redux + localStorage/sessionStorage), so
// this server component can no longer prefetch with a token. DashboardClient
// loads orders itself on mount once it has the token from the store.
export default function DashboardPage() {
  return <DashboardClient initialPending={[]} initialApproved={[]} />;
}
