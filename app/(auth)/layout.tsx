import type { ReactNode } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';

/**
 * Layout wrapper for all (auth) routes — wraps its children in the shared AuthShell.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
