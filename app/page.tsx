import { redirect } from 'next/navigation';

/**
 * Root route entry — immediately redirects visitors to /dashboard.
 */
export default function RootPage() {
  redirect('/dashboard');
}
