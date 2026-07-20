'use client';

import { useState, type FormEvent } from 'react';
import { Pencil, X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateProduct, type Product, type ProductUpdateFields } from '@/store/inventory/inventorySlice';

const inputClassName =
  'w-full rounded-lg border border-input px-3 py-2 text-sm text-slate-800 placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

/**
 * View/edit modal for a single product — mirrors CustomerDetailModal's
 * layout (header, dl rows, footer action) with an inline edit form swapped
 * in rather than a second modal. Supplier is shown but never editable here —
 * reassigning it would change the row's UNIQUE (supplier_id, reference)
 * identity in the backend, out of scope for a field edit.
 */
export function ProductDetailModal({
  product,
  initialEditing = false,
  onClose,
  onSaved,
}: {
  product: Product;
  initialEditing?: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: product.name,
    reference: product.reference,
    price: String(product.price),
    quantity: String(product.quantity),
    delivery_time: product.delivery_time ?? '',
    service_offered: product.service_offered ?? false,
    service_name: product.service_name ?? '',
    service_price: product.service_price != null ? String(product.service_price) : '',
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fields: ProductUpdateFields = {
      name: form.name,
      reference: form.reference,
      price: Number(form.price),
      quantity: Number(form.quantity),
      delivery_time: form.delivery_time || null,
      service_offered: form.service_offered,
      service_name: form.service_offered ? form.service_name || null : null,
      service_price: form.service_offered && form.service_price ? Number(form.service_price) : null,
    };

    const result = await dispatch(updateProduct({ id: product.id, fields }));
    setSaving(false);

    if (updateProduct.fulfilled.match(result)) {
      onSaved(`Product ${form.name || product.reference} updated.`);
      onClose();
    } else {
      setError((result.payload as string) || 'Failed to update the product.');
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Reference', value: product.reference },
    { label: 'Name', value: product.name },
    { label: 'Supplier', value: product.supplier || '—' },
    { label: 'Price', value: formatKwanza(product.price) },
    { label: 'Stock', value: String(product.quantity) },
    { label: 'Delivery Time', value: product.delivery_time || '—' },
    {
      label: 'Service',
      value: product.service_offered && product.service_name ? product.service_name : '—',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">{editing ? 'Edit Product' : product.name}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-3 px-5 py-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Name</label>
              <input
                className={inputClassName}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Reference</label>
              <input
                className={inputClassName}
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClassName}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={inputClassName}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Delivery Time</label>
              <input
                className={inputClassName}
                placeholder="e.g. Em stock, 2 dias, Sob encomenda"
                value={form.delivery_time}
                onChange={(e) => setForm({ ...form, delivery_time: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="service_offered"
                checked={form.service_offered}
                onChange={(e) => setForm({ ...form, service_offered: e.target.checked })}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <label htmlFor="service_offered" className="text-xs font-semibold text-slate-500">
                Service offered alongside this product
              </label>
            </div>

            {form.service_offered && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Service Name</label>
                  <input
                    className={inputClassName}
                    value={form.service_name}
                    onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Service Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClassName}
                    value={form.service_price}
                    onChange={(e) => setForm({ ...form, service_price: e.target.value })}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="space-y-3 px-5 py-4">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                  <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
