'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateCustomer, type Customer, type CustomerUpdateFields } from '@/store/customers/customersSlice';
import { Section, InfoRow } from '@/components/DetailPanel';
import { VehiclePlate } from './VehiclePlate';

const baseInputClassName =
  'w-full rounded-lg border border-input px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

const labelClassName = 'mb-1 block text-xs font-semibold text-muted-foreground';

/**
 * View/edit side panel for a single customer — slides in from the right,
 * matching ProductDetailModal/OrderDetailModal's drawer (same header shape,
 * Section/InfoRow grouping) instead of the centered dl-based dialog this used
 * to be. Phone is never editable — it's the backend's primary key
 * (customers.phone), not just a display field, so it stays in the header
 * subtitle rather than an edit field.
 */
export function CustomerDetailModal({
  customer,
  initialEditing = false,
  onClose,
  onSaved,
}: {
  customer: Customer;
  initialEditing?: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(initialEditing);
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/60" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              {editing ? 'Edit Customer' : 'Customer'}
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">{customer.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{customer.phone}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <Section title="Profile">
                <div>
                  <label className={labelClassName}>Name</label>
                  <input
                    className={baseInputClassName}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>NIF</label>
                  <input
                    className={baseInputClassName}
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Address</label>
                  <input
                    className={baseInputClassName}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Email</label>
                  <input
                    type="email"
                    className={baseInputClassName}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </Section>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
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
            <div className="space-y-6">
              <Section title="Profile">
                <InfoRow label="NIF" value={customer.nif || '—'} />
                <InfoRow label="Address" value={customer.address || '—'} />
                <InfoRow label="Email" value={customer.email || '—'} />
                <InfoRow label="Joined" value={customer.createdAt} />
              </Section>

              <Section title="Vehicles">
                {customer.vehicles.length > 0 ? (
                  <div className="space-y-2">
                    {customer.vehicles.map((vehicle, index) => (
                      <VehiclePlate key={`${vehicle.plate}-${index}`} vehicle={vehicle} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No vehicles on file.</p>
                )}
              </Section>

              <Section title="Activity">
                <InfoRow label="Orders" value={String(customer.ordersCount)} />
                <InfoRow label="Total Spent" value={formatKwanza(customer.totalSpent)} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
