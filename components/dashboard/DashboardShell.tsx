import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * Top-level layout for authenticated pages — renders the header and sidebar
 * around a scrollable main content area that wraps the given children.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
