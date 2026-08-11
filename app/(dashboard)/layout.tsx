'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAppSelector } from '@/store/hooks';

/**
 * Guards the dashboard route group: redirects to /login once mounted if
 * there's no access token, otherwise renders children inside the shared shell.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((state) => state.auth.tokens?.access?.token);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
