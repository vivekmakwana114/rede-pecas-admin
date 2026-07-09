import { redirect } from 'next/navigation';

// Auth now lives client-side (Redux + localStorage/sessionStorage), so this
// server component can't tell who's logged in — it always points at
// /dashboard, and DashboardClient bounces unauthenticated visitors to /login.
export default function RootPage() {
  redirect('/dashboard');
}
