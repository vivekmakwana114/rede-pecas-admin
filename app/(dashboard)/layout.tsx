'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAppSelector } from '@/store/hooks';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.tokens?.access?.token);
  // Auth state is rehydrated from localStorage, which only exists client-side —
  // branching render on accessToken directly would make the server-rendered HTML
  // (no token) mismatch the client's first paint (token already read from storage).
  // Waiting for mount keeps the first paint identical on both sides.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !accessToken) {
      router.replace('/login');
    }
  }, [mounted, accessToken, router]);

  if (!mounted || !accessToken) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
