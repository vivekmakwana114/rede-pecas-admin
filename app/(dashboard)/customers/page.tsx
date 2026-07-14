'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers } from '@/store/customers/customersSlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { VehiclePlate } from './VehiclePlate';
import type { Customer } from './types';

function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const { customers, status } = useAppSelector((state) => state.customers);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, ...customer.vehicles.map((v) => v.plate)].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [customers, query]);

  const columns: GridColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      sortable: true,
      sortValue: (row) => row.vehicles[0]?.plate ?? '',
      cell: (row) => {
        const [primary, ...rest] = row.vehicles;
        if (!primary) return <span className="text-xs text-slate-300">—</span>;
        return (
          <div className="flex items-center gap-2">
            <VehiclePlate vehicle={primary} />
            {rest.length > 0 && (
              <span
                title={rest.map((v) => `${v.plate} · ${v.make} ${v.model} (${v.year})`).join('\n')}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500"
              >
                +{rest.length}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'ordersCount',
      header: 'Orders',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.ordersCount,
      cell: (row) => <span className="font-semibold text-slate-800">{row.ordersCount}</span>,
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.totalSpent,
      cell: (row) => <span className="font-semibold text-slate-800">{formatKwanza(row.totalSpent)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => <span className="text-xs text-slate-500">{formatJoinedDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900">Customers</h2>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or plate…"
            className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Grid
        columns={columns}
        rows={filteredRows}
        getRowId={(row) => String(row.id)}
        emptyMessage={
          status === 'loading' ? (
            <span className="inline-flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading customers…
            </span>
          ) : (
            'No customers yet — they show up here once they place an order.'
          )
        }
      />
    </div>
  );
}
