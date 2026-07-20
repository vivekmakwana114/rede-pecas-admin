'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, ShoppingCart, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/orders/ordersSlice';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/customers', label: 'Customers', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { pending, stockConfirmation } = useAppSelector((state) => state.orders);

  useEffect(() => {
    // OrdersPage owns the poll while it's mounted; this is just a one-off
    // fetch so the badge below has data on other dashboard pages. 'all' since
    // the badge counts every outstanding order, not just today's.
    dispatch(fetchOrders('all'));
  }, [dispatch]);

  // Same "still awaiting a decision" definition OrdersPage uses for its
  // filter-bar badges: every stockConfirmation-bucket order plus every
  // still-pending order that has a proof to review.
  const ordersBadgeCount = stockConfirmation.length + pending.filter((o) => o.has_proof).length;

  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border bg-background lg:flex lg:flex-col">
      <nav className="flex-1 space-y-1 px-3 py-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const badgeCount = href === '/orders' ? ordersBadgeCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className="rounded-full bg-info px-1.5 py-0.5 text-2xs font-bold text-info-foreground">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
