'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateService, type Service, type ServiceUpdateFields } from '@/store/services/servicesSlice';
import { Section, InfoRow } from '@/components/DetailPanel';

const baseInputClassName =
  'w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

function fieldInputClassName(hasError?: string) {
  return `${baseInputClassName} ${hasError ? 'border-destructive' : 'border-input'}`;
}

const labelClassName = 'mb-1 block text-xs font-semibold text-muted-foreground';

// Mirrors SERVICE_CATEGORIES in the backend's src/constants/serviceCategory.ts
// — the only 3 values the backend's Joi schema (serviceUpdate) accepts.
const SERVICE_CATEGORY_OPTIONS = ['maintenance', 'general_mechanics', 'diagnostics'];

type FormState = {
  serviceName: string;
  serviceCategory: string;
  serviceBasePrice: string;
  serviceDurationH: string;
  availableAtHome: boolean;
  baseTravelFee: string;
  logisticsFeeNotes: string;
  providerName: string;
  providerAddress: string;
  providerProvince: string;
  providerPhone: string;
};

/**
 * Mirrors ProductDetailModal's validate() — same required-field rules,
 * adapted to the service domain's own required fields.
 */
function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.serviceName.trim()) errors.serviceName = 'Required.';
  if (!form.serviceCategory.trim()) errors.serviceCategory = 'Required.';

  if (!form.serviceBasePrice.trim()) {
    errors.serviceBasePrice = 'Required.';
  } else if (Number.isNaN(Number(form.serviceBasePrice)) || Number(form.serviceBasePrice) < 0) {
    errors.serviceBasePrice = 'Must be 0 or more.';
  }

  if (!form.serviceDurationH.trim()) {
    errors.serviceDurationH = 'Required.';
  } else if (Number.isNaN(Number(form.serviceDurationH)) || Number(form.serviceDurationH) < 0) {
    errors.serviceDurationH = 'Must be 0 or more.';
  }

  if (!form.providerName.trim()) errors.providerName = 'Required.';

  return errors;
}

/** Inline error text under a field — absent entirely when there's nothing wrong with it. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-2xs font-normal text-destructive">{message}</p>;
}

/**
 * View/edit side panel for a single service — mirrors ProductDetailModal's
 * drawer layout (Service / Provider sections). Editing the provider's own
 * name/address/province/phone updates the shared service_providers row (so
 * every other service from the same provider reads the change too), not
 * this service's own (provider_id, service_name) identity — same rationale
 * as ProductDetailModal's supplier fields. There's no dedicated provider
 * management screen yet, so this panel doubles as it.
 */
export function ServiceDetailModal({
  service,
  initialEditing = false,
  onClose,
  onSaved,
}: {
  service: Service;
  initialEditing?: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const dispatch = useAppDispatch();
  // Fixed for this modal's lifetime — set once from which row action opened
  // it ("View service" vs "Edit service"). Cancel/Save both close the panel
  // (onClose) rather than switching back to a read-only view within the same
  // instance, so there's no in-modal transition that would need this to be
  // mutable state.
  const editing = initialEditing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    serviceName: service.service_name,
    serviceCategory: service.service_category,
    serviceBasePrice: String(service.service_base_price),
    serviceDurationH: String(service.service_duration_h),
    availableAtHome: service.available_at_home,
    baseTravelFee: service.base_travel_fee != null ? String(service.base_travel_fee) : '',
    logisticsFeeNotes: service.logistics_fee_notes ?? '',
    providerName: service.provider_name ?? '',
    providerAddress: service.provider_address ?? '',
    providerProvince: service.provider_province ?? '',
    providerPhone: service.provider_phone ?? '',
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    setError('');

    const fields: ServiceUpdateFields = {
      service_name: form.serviceName,
      service_category: form.serviceCategory,
      service_base_price: Number(form.serviceBasePrice),
      service_duration_h: Number(form.serviceDurationH),
      available_at_home: form.availableAtHome,
      base_travel_fee: form.baseTravelFee.trim() ? Number(form.baseTravelFee) : null,
      logistics_fee_notes: form.logisticsFeeNotes || null,
      providerName: form.providerName,
      providerAddress: form.providerAddress || null,
      providerProvince: form.providerProvince || null,
      providerPhone: form.providerPhone || null,
    };

    const result = await dispatch(updateService({ id: service.id, fields }));
    setSaving(false);

    if (updateService.fulfilled.match(result)) {
      onSaved(`Service ${form.serviceName || service.service_name} updated.`);
      onClose();
    } else {
      setError((result.payload as string) || 'Failed to update the service.');
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
              {editing ? 'Edit Service' : 'Service'}
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">{service.service_name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{service.service_category}</p>
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
              <Section title="Service">
                <div>
                  <label className={labelClassName}>Name</label>
                  <input
                    className={fieldInputClassName(fieldErrors.serviceName)}
                    value={form.serviceName}
                    onChange={(e) => updateField('serviceName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.serviceName} />
                </div>
                <div>
                  <label className={labelClassName}>Category</label>
                  <select
                    className={fieldInputClassName(fieldErrors.serviceCategory)}
                    value={form.serviceCategory}
                    onChange={(e) => updateField('serviceCategory', e.target.value)}
                  >
                    {SERVICE_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.serviceCategory} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Base Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldInputClassName(fieldErrors.serviceBasePrice)}
                      value={form.serviceBasePrice}
                      onChange={(e) => updateField('serviceBasePrice', e.target.value)}
                    />
                    <FieldError message={fieldErrors.serviceBasePrice} />
                  </div>
                  <div>
                    <label className={labelClassName}>Duration (h)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className={fieldInputClassName(fieldErrors.serviceDurationH)}
                      value={form.serviceDurationH}
                      onChange={(e) => updateField('serviceDurationH', e.target.value)}
                    />
                    <FieldError message={fieldErrors.serviceDurationH} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="availableAtHome"
                    checked={form.availableAtHome}
                    onChange={(e) => updateField('availableAtHome', e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="availableAtHome" className="text-xs font-semibold text-muted-foreground">
                    Available at home
                  </label>
                </div>
                <div>
                  <label className={labelClassName}>Base Travel Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldInputClassName()}
                    value={form.baseTravelFee}
                    onChange={(e) => updateField('baseTravelFee', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Logistics Fee Notes</label>
                  <textarea
                    rows={2}
                    className={fieldInputClassName()}
                    value={form.logisticsFeeNotes}
                    onChange={(e) => updateField('logisticsFeeNotes', e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Provider">
                <div>
                  <label className={labelClassName}>Name</label>
                  <input
                    className={fieldInputClassName(fieldErrors.providerName)}
                    value={form.providerName}
                    onChange={(e) => updateField('providerName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.providerName} />
                </div>
                <div>
                  <label className={labelClassName}>Address</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.providerAddress}
                    onChange={(e) => updateField('providerAddress', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Province</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.providerProvince}
                    onChange={(e) => updateField('providerProvince', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Phone</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. 244 923 456 789"
                    value={form.providerPhone}
                    onChange={(e) => updateField('providerPhone', e.target.value)}
                  />
                </div>
              </Section>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
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
              <Section title="Service">
                <InfoRow label="Category" value={service.service_category} />
                <InfoRow label="Base Price" value={formatKwanza(service.service_base_price)} />
                <InfoRow label="Duration" value={`${service.service_duration_h} h`} />
                <InfoRow label="Available at Home" value={service.available_at_home ? 'Yes' : 'No'} />
                <InfoRow
                  label="Base Travel Fee"
                  value={service.base_travel_fee != null ? formatKwanza(service.base_travel_fee) : '—'}
                />
                <InfoRow label="Logistics Fee Notes" value={service.logistics_fee_notes || '—'} />
                <InfoRow label="Status" value={service.active === false ? 'Inactive' : 'Active'} />
              </Section>

              <Section title="Provider">
                <InfoRow label="Name" value={service.provider_name || '—'} />
                <InfoRow label="Address" value={service.provider_address || '—'} />
                <InfoRow label="Province" value={service.provider_province || '—'} />
                <InfoRow label="Phone" value={service.provider_phone || '—'} />
                <InfoRow label="Specialties" value={service.provider_specialties || '—'} />
                <InfoRow label="Rating" value={service.provider_rating != null ? String(service.provider_rating) : '—'} />
                <InfoRow label="Response Time" value={service.provider_response_time || '—'} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
