'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProduct, updateProduct, fetchProducts } from '@/store/inventory/inventorySlice';
import { Grid } from '@/components/Grid/Grid';
import type { GridColumn } from '@/components/Grid/types';
import { RowActionsMenu } from '@/components/RowActionsMenu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProductDetailModal } from './ProductDetailModal';
import { useLocale } from '@/lib/i18n/LocaleContext';
import type { Product } from './types';

/**
 * Renders the searchable products grid with row-level actions (view, edit,
 * activate/deactivate, delete) and the modals/confirm dialogs those actions open.
 */
export function ProductsGrid({
  showToast,
  onImportClick,
}: {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onImportClick: () => void;
}) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { products, status } = useAppSelector((state) => state.inventory);
  const [query, setQuery] = useState('');
  const [detailProduct, setDetailProduct] = useState<{ product: Product; editing: boolean } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  /**
   * Opens a confirm dialog that, when accepted, dispatches `updateProduct`
   * to mark the product inactive and refreshes the product list.
   */
  const handleDeactivate = (product: Product) => {
    setConfirmDialog({
      title: t('inventory.products.deactivateTitle', { name: product.name }),
      message: t('inventory.products.deactivateMessage'),
      confirmLabel: t('inventory.products.deactivateConfirm'),
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(updateProduct({ id: product.id, fields: { active: false } }));
        if (updateProduct.fulfilled.match(result)) {
          showToast(t('inventory.products.deactivateSuccess', { name: product.name }), 'success');
          dispatch(fetchProducts());
        } else {
          showToast(t('inventory.products.deactivateFailure'), 'error');
        }
      },
    });
  };

  /**
   * Dispatches `updateProduct` to mark the product active again and refreshes
   * the product list, showing a toast on success or failure.
   */
  const handleActivate = async (product: Product) => {
    const result = await dispatch(updateProduct({ id: product.id, fields: { active: true } }));
    if (updateProduct.fulfilled.match(result)) {
      showToast(t('inventory.products.activateSuccess', { name: product.name }), 'success');
      dispatch(fetchProducts());
    } else {
      showToast(t('inventory.products.activateFailure'), 'error');
    }
  };

  /**
   * Opens a confirm dialog that, when accepted, dispatches `deleteProduct`
   * to permanently remove the product and refreshes the product list.
   */
  const handleDelete = (product: Product) => {
    setConfirmDialog({
      title: t('inventory.products.deleteTitle', { name: product.name }),
      message: t('inventory.products.deleteMessage'),
      confirmLabel: t('inventory.products.deleteConfirm'),
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(deleteProduct(product.id));
        if (deleteProduct.fulfilled.match(result)) {
          showToast(t('inventory.products.deleteSuccess', { name: product.name }), 'success');
          dispatch(fetchProducts());
        } else {
          showToast((result.payload as string) || t('inventory.products.deleteFailure'), 'error');
        }
      },
    });
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      [product.reference, product.name].some((field) => field.toLowerCase().includes(normalizedQuery)),
    );
  }, [products, query]);

  const columns: GridColumn<Product>[] = [
    {
      key: 'name',
      header: t('inventory.products.columns.name'),
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
    },
    {
      key: 'supplier',
      header: t('inventory.products.columns.supplier'),
      sortable: true,
      sortValue: (row) => row.supplier ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.supplier || '—'}</span>,
    },
    {
      key: 'category',
      header: t('inventory.products.columns.category'),
      sortable: true,
      sortValue: (row) => row.category ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.category || '—'}</span>,
    },
    {
      key: 'subcategory',
      header: t('inventory.products.columns.subcategory'),
      sortable: true,
      sortValue: (row) => row.subcategory ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.subcategory || '—'}</span>,
    },
    {
      key: 'reference',
      header: t('inventory.products.columns.reference'),
      sortable: true,
      sortValue: (row) => row.reference,
      cell: (row) => <span className="font-mono text-sm font-semibold text-foreground">{row.reference}</span>,
    },
    {
      key: 'oem_reference',
      header: t('inventory.products.columns.oemReference'),
      cell: (row) => <span className="font-mono text-sm text-muted-foreground">{row.oem_reference || '—'}</span>,
    },
    {
      key: 'brand',
      header: t('inventory.products.columns.brand'),
      sortable: true,
      sortValue: (row) => row.brand ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.brand || '—'}</span>,
    },
    {
      key: 'price',
      header: t('inventory.products.columns.price'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.price)}</span>,
    },
    {
      key: 'quantity',
      header: t('inventory.products.columns.quantity'),
      sortable: true,
      align: 'right',
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-bold ${
            row.quantity === 0
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : row.quantity < 5
                ? 'border-warning/30 bg-warning/10 text-warning'
                : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'delivery_time',
      header: t('inventory.products.columns.deliveryTime'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.delivery_time || '—'}</span>,
    },
    {
      key: 'vehicle_make',
      header: t('inventory.products.columns.vehicleMake'),
      sortable: true,
      sortValue: (row) => row.vehicle_make ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.vehicle_make || '—'}</span>,
    },
    {
      key: 'vehicle_model',
      header: t('inventory.products.columns.vehicleModel'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.vehicle_model || '—'}</span>,
    },
    {
      key: 'year_start',
      header: t('inventory.products.columns.yearStart'),
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.year_start ?? '—'}</span>,
    },
    {
      key: 'year_end',
      header: t('inventory.products.columns.yearEnd'),
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.year_end ?? '—'}</span>,
    },
    {
      key: 'engine',
      header: t('inventory.products.columns.engine'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine || '—'}</span>,
    },
    {
      key: 'engine_number',
      header: t('inventory.products.columns.engineNumber'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine_number || '—'}</span>,
    },
    {
      key: 'viscosity',
      header: t('inventory.products.columns.viscosity'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.viscosity || '—'}</span>,
    },
    {
      key: 'engine_type',
      header: t('inventory.products.columns.engineType'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine_type || '—'}</span>,
    },
    {
      key: 'volume_liters',
      header: t('inventory.products.columns.volumeLiters'),
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.volume_liters ?? '—'}</span>,
    },
    {
      key: 'specification',
      header: t('inventory.products.columns.specification'),
      cell: (row) => <span className="text-sm text-muted-foreground">{row.specification || '—'}</span>,
    },
    {
      key: 'interval_km',
      header: t('inventory.products.columns.intervalKm'),
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.interval_km ?? '—'}</span>,
    },
    {
      key: 'description',
      header: t('inventory.products.columns.description'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.description || '—'}</span>,
    },
    {
      key: 'synonyms',
      header: t('inventory.products.columns.synonyms'),
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.synonyms || '—'}</span>,
    },
    {
      key: 'image_url',
      header: t('inventory.products.columns.imageUrl'),
      cell: (row) =>
        row.image_url ? (
          <a href={row.image_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary underline">
            {t('inventory.products.viewImage')}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: t('inventory.products.columns.status'),
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
      header: t('inventory.products.columns.actions'),
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: t('inventory.products.viewProduct'), icon: Eye, onClick: () => setDetailProduct({ product: row, editing: false }) },
              { label: t('inventory.products.editProduct'), icon: Pencil, onClick: () => setDetailProduct({ product: row, editing: true }) },
              ...(row.active === false
                ? [
                    { label: t('inventory.products.activateProduct'), icon: CheckCircle2, onClick: () => handleActivate(row) },
                    { label: t('inventory.products.deleteProduct'), icon: Trash2, destructive: true, onClick: () => handleDelete(row) },
                  ]
                : [{ label: t('inventory.products.deactivateProduct'), icon: Ban, destructive: true, onClick: () => handleDeactivate(row) }]),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-foreground">{t('inventory.products.title')}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('inventory.products.searchPlaceholder')}
              className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={onImportClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            {t('inventory.products.importButton')}
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
              {t('inventory.products.loading')}
            </span>
          ) : (
            t('inventory.products.empty')
          )
        }
      />

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct.product}
          initialEditing={detailProduct.editing}
          onClose={() => setDetailProduct(null)}
          onSaved={(message) => {
            showToast(message, 'success');
            dispatch(fetchProducts());
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
