'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteService, updateService, fetchServices } from '@/store/services/servicesSlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ServiceDetailModal } from './ServiceDetailModal';
import { useLocale } from '@/lib/i18n/LocaleContext';
import type { Service } from './types';

/**
 * Renders the searchable services grid with row-level actions (view, edit,
 * activate/deactivate, delete) and the modals/confirm dialogs those actions open.
 */
export function ServicesGrid({
  showToast,
  onImportClick,
}: {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onImportClick: () => void;
}) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { services, status } = useAppSelector((state) => state.services);
  const [query, setQuery] = useState('');
  const [detailService, setDetailService] = useState<{ service: Service; editing: boolean } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  /**
   * Opens a confirm dialog that, when accepted, dispatches `updateService`
   * to mark the service inactive and refreshes the service list.
   */
  const handleDeactivate = (service: Service) => {
    setConfirmDialog({
      title: t('inventory.services.deactivateTitle', { name: service.service_name }),
      message: t('inventory.services.deactivateMessage'),
      confirmLabel: t('inventory.services.deactivateConfirm'),
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(updateService({ id: service.id, fields: { active: false } }));
        if (updateService.fulfilled.match(result)) {
          showToast(t('inventory.services.deactivateSuccess', { name: service.service_name }), 'success');
          dispatch(fetchServices());
        } else {
          showToast(t('inventory.services.deactivateFailure'), 'error');
        }
      },
    });
  };

  /**
   * Dispatches `updateService` to mark the service active again and refreshes
   * the service list, showing a toast on success or failure.
   */
  const handleActivate = async (service: Service) => {
    const result = await dispatch(updateService({ id: service.id, fields: { active: true } }));
    if (updateService.fulfilled.match(result)) {
      showToast(t('inventory.services.activateSuccess', { name: service.service_name }), 'success');
      dispatch(fetchServices());
    } else {
      showToast(t('inventory.services.activateFailure'), 'error');
    }
  };

  /**
   * Opens a confirm dialog that, when accepted, dispatches `deleteService`
   * to permanently remove the service and refreshes the service list.
   */
  const handleDelete = (service: Service) => {
    setConfirmDialog({
      title: t('inventory.services.deleteTitle', { name: service.service_name }),
      message: t('inventory.services.deleteMessage'),
      confirmLabel: t('inventory.services.deleteConfirm'),
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(deleteService(service.id));
        if (deleteService.fulfilled.match(result)) {
          showToast(t('inventory.services.deleteSuccess', { name: service.service_name }), 'success');
          dispatch(fetchServices());
        } else {
          showToast((result.payload as string) || t('inventory.services.deleteFailure'), 'error');
        }
      },
    });
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return services;
    return services.filter((service) =>
      [service.service_name, service.provider_name, service.service_category].some((field) =>
        (field ?? '').toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [services, query]);

  const columns: GridColumn<Service>[] = [
    {
      key: 'provider_name',
      header: t('inventory.services.columns.providerName'),
      sortable: true,
      sortValue: (row) => row.provider_name ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_name || '—'}</span>,
    },
    {
      key: 'provider_address',
      header: t('inventory.services.columns.address'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_address || '—'}</span>,
    },
    {
      key: 'provider_province',
      header: t('inventory.services.columns.province'),
      sortable: true,
      sortValue: (row) => row.provider_province ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_province || '—'}</span>,
    },
    {
      key: 'provider_phone',
      header: t('inventory.services.columns.phone'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_phone || '—'}</span>,
    },
    {
      key: 'provider_specialties',
      header: t('inventory.services.columns.specialties'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.provider_specialties || '—'}</span>,
    },
    {
      key: 'provider_rating',
      header: t('inventory.services.columns.rating'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.provider_rating ?? 0,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_rating != null ? row.provider_rating : '—'}</span>,
    },
    {
      key: 'provider_response_time',
      header: t('inventory.services.columns.responseTime'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.provider_response_time || '—'}</span>,
    },
    {
      key: 'service_name',
      header: t('inventory.services.columns.serviceName'),
      sortable: true,
      sortValue: (row) => row.service_name,
      cell: (row) => <span className="font-semibold text-foreground">{row.service_name}</span>,
    },
    {
      key: 'service_category',
      header: t('inventory.services.columns.serviceCategory'),
      sortable: true,
      sortValue: (row) => row.service_category,
      cell: (row) => (
        <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-sm font-bold text-muted-foreground">
          {row.service_category}
        </span>
      ),
    },
    {
      key: 'service_base_price',
      header: t('inventory.services.columns.serviceBasePrice'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.service_base_price,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.service_base_price)}</span>,
    },
    {
      key: 'service_duration_h',
      header: t('inventory.services.columns.serviceDurationH'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.service_duration_h,
      cell: (row) => <span className="text-foreground">{row.service_duration_h}</span>,
    },
    {
      key: 'available_at_home',
      header: t('inventory.services.columns.availableAtHome'),
      align: 'center',
      cell: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-bold ${
            row.available_at_home
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {row.available_at_home ? t('inventory.common.yes') : t('inventory.common.no')}
        </span>
      ),
    },
    {
      key: 'base_travel_fee',
      header: t('inventory.services.columns.baseTravelFee'),
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.base_travel_fee != null ? formatKwanza(row.base_travel_fee) : '—'}</span>,
    },
    {
      key: 'logistics_fee_notes',
      header: t('inventory.services.columns.logisticsFeeNotes'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.logistics_fee_notes || '—'}</span>,
    },
    {
      key: 'status',
      header: t('inventory.services.columns.status'),
      align: 'center',
      cell: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-bold ${
            row.active === false
              ? 'border-border bg-muted text-muted-foreground'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {row.active === false ? t('inventory.common.inactive') : t('inventory.common.active')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('inventory.services.columns.actions'),
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: t('inventory.services.viewService'), icon: Eye, onClick: () => setDetailService({ service: row, editing: false }) },
              { label: t('inventory.services.editService'), icon: Pencil, onClick: () => setDetailService({ service: row, editing: true }) },
              ...(row.active === false
                ? [
                    { label: t('inventory.services.activateService'), icon: CheckCircle2, onClick: () => handleActivate(row) },
                    { label: t('inventory.services.deleteService'), icon: Trash2, destructive: true, onClick: () => handleDelete(row) },
                  ]
                : [{ label: t('inventory.services.deactivateService'), icon: Ban, destructive: true, onClick: () => handleDeactivate(row) }]),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-foreground">{t('inventory.services.title')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('inventory.services.searchPlaceholder')}
              className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={onImportClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            {t('inventory.services.importButton')}
          </button>
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
              {t('inventory.services.loading')}
            </span>
          ) : (
            t('inventory.services.empty')
          )
        }
      />

      {detailService && (
        <ServiceDetailModal
          service={detailService.service}
          initialEditing={detailService.editing}
          onClose={() => setDetailService(null)}
          onSaved={(message) => {
            showToast(message, 'success');
            dispatch(fetchServices());
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
