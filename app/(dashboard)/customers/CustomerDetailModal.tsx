'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateCustomer, type Customer, type CustomerUpdateFields } from '@/store/customers/customersSlice';
import { Section, InfoRow } from '@/components/DetailPanel';
import { VehiclePlate } from './VehiclePlate';
import { useLocale } from '@/lib/i18n/LocaleContext';

const baseInputClassName =
  'w-full rounded-lg border border-input px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

const labelClassName = 'mb-1 block text-xs font-semibold text-muted-foreground';

/**
 * Slide-in panel showing a single customer's profile, vehicles and order
 * activity, with an inline edit mode for updating their profile fields.
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
  const { t } = useLocale();
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: customer.name,
    nif: customer.nif ?? '',
    address: customer.address ?? '',
    email: customer.email ?? '',
  });

  /**
   * Submits the edited profile fields to the API and, on success, notifies
   * the parent and closes the modal; otherwise surfaces the error inline.
   */
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
      onSaved(t('customers.detail.updateSuccess', { name: form.name || customer.phone }));
      onClose();
    } else {
      setError((result.payload as string) || t('customers.detail.updateFailure'));
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
              {editing ? t('customers.detail.editTitle') : t('customers.detail.viewTitle')}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-foreground">{customer.name}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                  customer.active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                }`}
              >
                {customer.active ? t('customers.statusActive') : t('customers.statusInactive')}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{customer.phone}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('customers.detail.close')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <Section title={t('customers.detail.sectionProfile')}>
                <div>
                  <label className={labelClassName}>{t('customers.detail.name')}</label>
                  <input
                    className={baseInputClassName}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('customers.detail.nif')}</label>
                  <input
                    className={baseInputClassName}
                    value={form.nif}
                    onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('customers.detail.address')}</label>
                  <input
                    className={baseInputClassName}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('customers.detail.email')}</label>
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
                  {t('customers.detail.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? t('customers.detail.saving') : t('customers.detail.save')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <Section title={t('customers.detail.sectionProfile')}>
                <InfoRow
                  label={t('customers.detail.customerType')}
                  value={
                    customer.customerType === 'company'
                      ? t('customers.detail.customerTypeCompany')
                      : customer.customerType === 'individual'
                        ? t('customers.detail.customerTypeIndividual')
                        : '—'
                  }
                />
                <InfoRow label={t('customers.detail.nif')} value={customer.nif || '—'} />
                <InfoRow label={t('customers.detail.address')} value={customer.address || '—'} />
                <InfoRow label={t('customers.detail.email')} value={customer.email || '—'} />
                <InfoRow label={t('customers.detail.joined')} value={customer.createdAt} />
              </Section>

              <Section title={t('customers.detail.sectionVehicles')}>
                {customer.vehicles.length > 0 ? (
                  <div className="space-y-2">
                    {customer.vehicles.map((vehicle, index) => (
                      <VehiclePlate key={`${vehicle.plate}-${index}`} vehicle={vehicle} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('customers.detail.noVehicles')}</p>
                )}
              </Section>

              <Section title={t('customers.detail.sectionActivity')}>
                <InfoRow label={t('customers.detail.orders')} value={String(customer.ordersCount)} />
                <InfoRow label={t('customers.detail.totalSpent')} value={formatKwanza(customer.totalSpent)} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
