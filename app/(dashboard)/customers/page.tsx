'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Pencil, Search, UserCheck, UserX } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomers, toggleCustomerStatus } from '@/store/customers/customersSlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { VehiclePlate } from './VehiclePlate';
import { CustomerDetailModal } from './CustomerDetailModal';
import { useLocale } from '@/lib/i18n/LocaleContext';
import type { Customer } from './types';

/**
 * Customers list page: a searchable, sortable grid of customers with their
 * vehicles and order stats, plus actions to view, edit or delete a customer.
 */
export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { customers, status } = useAppSelector((state) => state.customers);
  const [query, setQuery] = useState('');
  const { toast, showToast } = useToast();
  const [detailCustomer, setDetailCustomer] = useState<{ customer: Customer; editing: boolean } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleToggleStatus = (customer: Customer, nextActive: boolean) => {
    setConfirmDialog({
      title: nextActive
        ? t('customers.activateTitle', { name: customer.name })
        : t('customers.deactivateTitle', { name: customer.name }),
      message: nextActive ? t('customers.activateMessage') : t('customers.deactivateMessage'),
      confirmLabel: nextActive ? t('customers.activateConfirm') : t('customers.deactivateConfirm'),
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(toggleCustomerStatus({ phone: customer.phone, active: nextActive }));
        if (toggleCustomerStatus.fulfilled.match(result)) {
          showToast(
            nextActive
              ? t('customers.activateSuccess', { name: customer.name })
              : t('customers.deactivateSuccess', { name: customer.name }),
            'success',
          );
          dispatch(fetchCustomers());
        } else {
          showToast(nextActive ? t('customers.activateFailure') : t('customers.deactivateFailure'), 'error');
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
      header: t('customers.columns.customer'),
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'active',
      header: t('customers.columns.status'),
      sortable: true,
      align: 'center',
      sortValue: (row) => (row.active ? 1 : 0),
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
          }`}
        >
          {row.active ? t('customers.statusActive') : t('customers.statusInactive')}
        </span>
      ),
    },
    {
      key: 'nif',
      header: t('customers.columns.nif'),
      sortable: true,
      sortValue: (row) => row.nif ?? '',
      cell: (row) => <span className="font-mono text-xs text-foreground">{row.nif || '—'}</span>,
    },
    {
      key: 'address',
      header: t('customers.columns.address'),
      cell: (row) => <span className="text-xs text-foreground">{row.address || '—'}</span>,
    },
    {
      key: 'vehicle',
      header: t('customers.columns.vehicles'),
      sortable: true,
      sortValue: (row) => row.vehicles[0]?.plate ?? '',
      cell: (row) => {
        return (
          <div className="flex flex-col gap-1.5">
            {row.vehicles.map((vehicle, index) => (
              <VehiclePlate key={`${vehicle.plate} ${index}`} vehicle={vehicle} />
            ))}
          </div>
        );
      },
    },
    {
      key: 'ordersCount',
      header: t('customers.columns.orders'),
      sortable: true,
      align: 'center',
      sortValue: (row) => row.ordersCount,
      cell: (row) => <span className="font-semibold text-foreground">{row.ordersCount}</span>,
    },
    {
      key: 'totalSpent',
      header: t('customers.columns.totalSpent'),
      sortable: true,
      align: 'center',
      sortValue: (row) => row.totalSpent,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.totalSpent)}</span>,
    },
    {
      key: 'createdAt',
      header: t('customers.columns.joined'),
      sortable: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.createdAt}</span>,
    },
    {
      key: 'actions',
      header: t('customers.columns.actions'),
      align: 'center',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: t('customers.viewCustomer'), icon: Eye, onClick: () => setDetailCustomer({ customer: row, editing: false }) },
              { label: t('customers.editCustomer'), icon: Pencil, onClick: () => setDetailCustomer({ customer: row, editing: true }) },
              row.active
                ? { label: t('customers.deactivateCustomer'), icon: UserX, onClick: () => handleToggleStatus(row, false), destructive: true }
                : { label: t('customers.activateCustomer'), icon: UserCheck, onClick: () => handleToggleStatus(row, true) },
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
        <h2 className="text-lg font-bold text-foreground">{t('customers.title')}</h2>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('customers.searchPlaceholder')}
            className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <Grid
        columns={columns}
        rows={filteredRows}
        getRowId={(row) => String(row.id)}
        emptyMessage={
          status === 'loading' ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('customers.loading')}
            </span>
          ) : (
            t('customers.empty')
          )
        }
      />

      {detailCustomer && (
        <CustomerDetailModal
          customer={detailCustomer.customer}
          initialEditing={detailCustomer.editing}
          onClose={() => setDetailCustomer(null)}
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
