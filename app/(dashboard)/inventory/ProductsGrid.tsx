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
import type { Product } from './types';

export function ProductsGrid({
  showToast,
  onImportClick,
}: {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onImportClick: () => void;
}) {
  const dispatch = useAppDispatch();
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

  // Reversible — flips active to false via PATCH (updateProduct). The
  // product stays out of customer search but stays listed here (see
  // getProductsHandler on the backend), and is only reachable to permanently
  // delete once it's in this state — see handleDelete below.
  const handleDeactivate = (product: Product) => {
    setConfirmDialog({
      title: `Deactivate product ${product.name}?`,
      message: 'It will stop showing up in customer search results until reactivated. You can turn it back on any time from this same menu.',
      confirmLabel: 'Deactivate',
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(updateProduct({ id: product.id, fields: { active: false } }));
        if (updateProduct.fulfilled.match(result)) {
          showToast(`Product ${product.name} deactivated.`, 'success');
          dispatch(fetchProducts());
        } else {
          showToast('Failed to deactivate the product.', 'error');
        }
      },
    });
  };

  // Reverse of deactivate — only reachable once a product is already
  // inactive. No confirmation needed: re-activating isn't destructive.
  const handleActivate = async (product: Product) => {
    const result = await dispatch(updateProduct({ id: product.id, fields: { active: true } }));
    if (updateProduct.fulfilled.match(result)) {
      showToast(`Product ${product.name} activated.`, 'success');
      dispatch(fetchProducts());
    } else {
      showToast('Failed to activate the product.', 'error');
    }
  };

  // Permanent — only enabled once a product is already inactive (the
  // backend rejects DELETE /admin/products/:id with a 409 otherwise, see
  // hardDeleteProduct), so this action only ever shows up on inactive rows.
  // A product still referenced by an existing order/waitlist entry can't be
  // deleted at all — the backend turns that into a 409 too, shown via the
  // toast's error message instead of a generic failure.
  const handleDelete = (product: Product) => {
    setConfirmDialog({
      title: `Permanently delete product ${product.name}?`,
      message: 'This removes it from the database entirely and cannot be undone.',
      confirmLabel: 'Delete permanently',
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(deleteProduct(product.id));
        if (deleteProduct.fulfilled.match(result)) {
          showToast(`Product ${product.name} permanently deleted.`, 'success');
          dispatch(fetchProducts());
        } else {
          showToast((result.payload as string) || 'Failed to delete the product.', 'error');
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

  // One column per column in produtos_rede_pecas_via_pecas_v3_EN.csv, in file
  // order (name;supplier;category;subcategory;reference;oem_reference;
  // part_brand;price;quantity;delivery_time;vehicle_make;vehicle_model;
  // year_start;year_end;engine;engine_number;viscosity;engine_type;
  // volume_liters;specification;interval_km;description;synonyms;image_url)
  // — no combining fields into a single cell, so what's in the grid matches
  // what's in the file 1:1. `active` gets its own Status column at the end
  // instead of following the file's column position, since it's shown as a
  // badge tied to the row actions rather than plain imported data.
  const columns: GridColumn<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortable: true,
      sortValue: (row) => row.supplier ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.supplier || '—'}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (row) => row.category ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.category || '—'}</span>,
    },
    {
      key: 'subcategory',
      header: 'Subcategory',
      sortable: true,
      sortValue: (row) => row.subcategory ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.subcategory || '—'}</span>,
    },
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      sortValue: (row) => row.reference,
      cell: (row) => <span className="font-mono text-sm font-semibold text-foreground">{row.reference}</span>,
    },
    {
      key: 'oem_reference',
      header: 'OEM Reference',
      cell: (row) => <span className="font-mono text-sm text-muted-foreground">{row.oem_reference || '—'}</span>,
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      sortValue: (row) => row.brand ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.brand || '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-foreground">{formatKwanza(row.price)}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
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
      header: 'Delivery Time',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.delivery_time || '—'}</span>,
    },
    {
      key: 'vehicle_make',
      header: 'Vehicle Make',
      sortable: true,
      sortValue: (row) => row.vehicle_make ?? '',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.vehicle_make || '—'}</span>,
    },
    {
      key: 'vehicle_model',
      header: 'Vehicle Model',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.vehicle_model || '—'}</span>,
    },
    {
      key: 'year_start',
      header: 'Year Start',
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.year_start ?? '—'}</span>,
    },
    {
      key: 'year_end',
      header: 'Year End',
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.year_end ?? '—'}</span>,
    },
    {
      key: 'engine',
      header: 'Engine',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine || '—'}</span>,
    },
    {
      key: 'engine_number',
      header: 'Engine Number',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine_number || '—'}</span>,
    },
    {
      key: 'viscosity',
      header: 'Viscosity',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.viscosity || '—'}</span>,
    },
    {
      key: 'engine_type',
      header: 'Engine Type',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.engine_type || '—'}</span>,
    },
    {
      key: 'volume_liters',
      header: 'Volume Liters',
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.volume_liters ?? '—'}</span>,
    },
    {
      key: 'specification',
      header: 'Specification',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.specification || '—'}</span>,
    },
    {
      key: 'interval_km',
      header: 'Interval Km',
      align: 'right',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.interval_km ?? '—'}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.description || '—'}</span>,
    },
    {
      key: 'synonyms',
      header: 'Synonyms',
      cellClassName: 'max-w-xs',
      cell: (row) => <span className="line-clamp-2 text-sm text-muted-foreground">{row.synonyms || '—'}</span>,
    },
    {
      key: 'image_url',
      header: 'Image Url',
      cell: (row) =>
        row.image_url ? (
          <a href={row.image_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary underline">
            View
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-bold ${
            row.active === false
              ? 'border-border bg-muted text-muted-foreground'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {row.active === false ? 'Inactive' : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: 'View product', icon: Eye, onClick: () => setDetailProduct({ product: row, editing: false }) },
              { label: 'Edit product', icon: Pencil, onClick: () => setDetailProduct({ product: row, editing: true }) },
              ...(row.active === false
                ? [
                    { label: 'Activate product', icon: CheckCircle2, onClick: () => handleActivate(row) },
                    { label: 'Delete product', icon: Trash2, destructive: true, onClick: () => handleDelete(row) },
                  ]
                : [{ label: 'Deactivate product', icon: Ban, destructive: true, onClick: () => handleDeactivate(row) }]),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-foreground">Products</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU or product name…"
              className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={onImportClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Import Inventory
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
              Loading products…
            </span>
          ) : (
            'No products yet — import a stock file to get started.'
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
