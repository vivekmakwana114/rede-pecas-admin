'use client';

import type { LucideIcon } from 'lucide-react';
import { Boxes, CheckCircle2, DollarSign, ShoppingCart, Users, XCircle } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useLocale } from '@/lib/i18n/LocaleContext';

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  valueClassName?: string;
}

/**
 * Grid of summary stat cards (customers, products, orders, revenue) shown
 * at the top of the dashboard.
 */
export function StatsGrid({
  totalCustomers,
  totalProducts,
  totalOrders,
  approvedOrders,
  rejectedOrders,
  approvedRevenue,
}: {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  approvedRevenue: number;
}) {
  const { t } = useLocale();

  const cards: StatCard[] = [
    { label: t('dashboard.stats.totalCustomers'), value: String(totalCustomers), icon: Users, iconClassName: 'bg-info/10 text-info' },
    {
      label: t('dashboard.stats.totalProducts'),
      value: String(totalProducts),
      icon: Boxes,
      iconClassName: 'bg-secondary/10 text-secondary',
    },
    {
      label: t('dashboard.stats.totalOrders'),
      value: String(totalOrders),
      icon: ShoppingCart,
      iconClassName: 'bg-primary/10 text-primary',
    },
    {
      label: t('dashboard.stats.approvedOrders'),
      value: String(approvedOrders),
      icon: CheckCircle2,
      iconClassName: 'bg-success/10 text-success',
    },
    {
      label: t('dashboard.stats.rejectedOrders'),
      value: String(rejectedOrders),
      icon: XCircle,
      iconClassName: 'bg-destructive/10 text-destructive',
    },
    {
      label: t('dashboard.stats.revenueApproved'),
      value: formatKwanza(approvedRevenue),
      icon: DollarSign,
      iconClassName: 'bg-warning/10 text-warning',
      valueClassName: 'text-xl',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, iconClassName, valueClassName }) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-xl border border-border/80 bg-background p-5 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className={`mt-1 font-mono font-bold text-foreground ${valueClassName ?? 'text-2xl'}`}>{value}</p>
          </div>
          <div className={`rounded-lg p-3 ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
