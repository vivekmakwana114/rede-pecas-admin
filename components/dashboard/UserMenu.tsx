'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/auth/authSlice';

export function UserMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const admin = useAppSelector((state) => state.auth.admin);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    // Not awaited — the user is logging out either way, so the redirect
    // shouldn't block on the backend revoke call (see authSlice.ts's logout
    // thunk, which fires it and always resolves regardless of outcome).
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-accent"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-secondary ring-offset-2 ring-offset-background">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{admin?.name ?? 'Admin'}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
