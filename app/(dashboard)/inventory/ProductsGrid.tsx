'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProduct, fetchProducts } from '@/store/inventory/inventorySlice';
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

  const handleDelete = (product: Product) => {
    setConfirmDialog({
      title: `Delete product ${product.name}?`,
      message: 'This removes it from the inventory list. This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(null);
        const result = await dispatch(deleteProduct(product.id));
        if (deleteProduct.fulfilled.match(result)) {
          showToast(`Product ${product.name} deleted.`, 'success');
          dispatch(fetchProducts());
        } else {
          showToast('Failed to delete the product.', 'error');
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
      key: 'reference',
      header: 'SKU',
      sortable: true,
      sortValue: (row) => row.reference,
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.reference}</span>,
    },
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortable: true,
      sortValue: (row) => row.supplier ?? '',
      cell: (row) => <span className="text-xs text-slate-500">{row.supplier || '—'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.price,
      cell: (row) => <span className="font-semibold text-slate-800">{formatKwanza(row.price)}</span>,
    },
    {
      key: 'quantity',
      header: 'Stock',
      sortable: true,
      align: 'right',
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
            row.quantity === 0
              ? 'border-red-200 bg-red-50 text-red-700'
              : row.quantity < 5
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      cell: (row) =>
        row.service_offered && row.service_name ? (
          <span className="text-xs text-slate-500">
            {row.service_name}
            {row.service_price != null && <span className="text-slate-400"> · {formatKwanza(row.service_price)}</span>}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
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
              {
                label: 'Delete product',
                icon: Trash2,
                destructive: true,
                onClick: () => handleDelete(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900">Products</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU or product name…"
              className="w-full rounded-lg border border-input py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={onImportClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
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
            <span className="inline-flex items-center gap-2 text-slate-400">
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
