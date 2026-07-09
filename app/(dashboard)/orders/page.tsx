import { OrdersClient } from './OrdersClient';

// Auth tokens live client-side only (Redux + localStorage/sessionStorage), so
// this server component can no longer prefetch with a token. OrdersClient
// loads orders itself on mount once it has the token from the store.
export default function OrdersPage() {
  return <OrdersClient initialPending={[]} initialApproved={[]} />;
}
