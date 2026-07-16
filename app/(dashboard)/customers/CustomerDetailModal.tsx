'use client';

import { useState, type FormEvent } from 'react';
import { Pencil, X } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { updateCustomer, type Customer, type CustomerUpdateFields } from '@/store/customers/customersSlice';

function formatJoinedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

const inputClassName =
  'w-full rounded-lg border border-input px-3 py-2 text-sm text-slate-800 placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

/**
 * View/edit modal for a single customer — mirrors OrderDetailModal's layout
 * (header, dl rows, footer action) with an inline edit form swapped in on
 * "Edit" rather than a second modal, since there's only ever one row's worth
 * of fields to change. Phone is never editable — it's the backend's primary
 * key (customers.phone), not just a display field.
 */
export function CustomerDetailModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: customer.name,
    nif: customer.nif ?? '',
    address: customer.address ?? '',
    email: customer.email ?? '',
  });

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fields: CustomerUpdateFields = {
      name: form.name,
      nif: form.nif || null,
      address: form.address || null,
      email: form.email || null,
    };

    const result = await dispatch(updateCustomer({ phone: customer.phone, fields }));
    setSaving(false);

    if (updateCustomer.fulfilled.match(result)) {
      onSaved(`Customer ${form.name || customer.phone} updated.`);
      onClose();
    } else {
      setError((result.payload as string) || 'Failed to update the customer.');
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: customer.name },
    { label: 'Phone', value: customer.phone },
    { label: 'NIF', value: customer.nif || '—' },
    { label: 'Address', value: customer.address || '—' },
    { label: 'Email', value: customer.email || '—' },
    { label: 'Joined', value: formatJoinedDate(customer.createdAt) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-md flex-col rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">{editing ? 'Edit Customer' : customer.name}</h2>
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
              <label className="mb-1 block text-xs font-semibold text-slate-500">NIF</label>
              <input
                className={inputClassName}
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Address</label>
              <input
                className={inputClassName}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
              <input
                type="email"
                className={inputClassName}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

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
