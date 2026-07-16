'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Search, Trash2 } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteCustomer, fetchCustomers } from '@/store/customers/customersSlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { VehiclePlate } from './VehiclePlate';
import { CustomerDetailModal } from './CustomerDetailModal';
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
  const { toast, showToast } = useToast();
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleDelete = (customer: Customer) => {
    setConfirmDialog({
      title: `Delete customer ${customer.name}?`,
      message: 'This removes them from the customer list. This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(deleteCustomer(customer.phone));
        if (deleteCustomer.fulfilled.match(result)) {
          showToast(`Customer ${customer.name} deleted.`, 'success');
          dispatch(fetchCustomers());
        } else {
          showToast('Failed to delete the customer.', 'error');
        }
      },
    });
  };

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
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: 'View customer', icon: Eye, onClick: () => setViewCustomer(row) },
              { label: 'Delete customer', icon: Trash2, onClick: () => handleDelete(row), destructive: true },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

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

      {viewCustomer && (
        <CustomerDetailModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          onSaved={(message) => {
            showToast(message, 'success');
            dispatch(fetchCustomers());
          }}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          destructive
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
