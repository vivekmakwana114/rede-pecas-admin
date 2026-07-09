'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
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
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">{admin?.name ?? 'Admin'}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-500 cursor-not-allowed">
            <UserRound className="h-4 w-4" />
            Profile
          </button>
          <button className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-500 cursor-not-allowed">
            <Settings className="h-4 w-4" />
            Account settings
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
