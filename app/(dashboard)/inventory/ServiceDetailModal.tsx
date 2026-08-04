'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateService, type Service, type ServiceUpdateFields } from '@/store/services/servicesSlice';
import { Section, InfoRow } from '@/components/DetailPanel';
import { useLocale } from '@/lib/i18n/LocaleContext';

const baseInputClassName =
  'w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

/**
 * Builds the Tailwind classes for a form input, swapping in a destructive
 * border color when a validation error message is present for that field.
 */
function fieldInputClassName(hasError?: string) {
  return `${baseInputClassName} ${hasError ? 'border-destructive' : 'border-input'}`;
}

const labelClassName = 'mb-1 block text-xs font-semibold text-muted-foreground';

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
 * Validates the service edit form, returning a map of field name to error
 * message for any required or malformed fields (name, category, price, duration, provider name).
 */
function validate(form: FormState, t: (path: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  const required = t('inventory.common.requiredError');
  const nonNegative = t('inventory.common.nonNegativeError');

  if (!form.serviceName.trim()) errors.serviceName = required;
  if (!form.serviceCategory.trim()) errors.serviceCategory = required;

  if (!form.serviceBasePrice.trim()) {
    errors.serviceBasePrice = required;
  } else if (Number.isNaN(Number(form.serviceBasePrice)) || Number(form.serviceBasePrice) < 0) {
    errors.serviceBasePrice = nonNegative;
  }

  if (!form.serviceDurationH.trim()) {
    errors.serviceDurationH = required;
  } else if (Number.isNaN(Number(form.serviceDurationH)) || Number(form.serviceDurationH) < 0) {
    errors.serviceDurationH = nonNegative;
  }

  if (!form.providerName.trim()) errors.providerName = required;

  return errors;
}

/**
 * Renders a small destructive-colored error line below a form field, or
 * nothing when no message is passed.
 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-2xs font-normal text-destructive">{message}</p>;
}

/**
 * Slide-over panel showing a single service's full detail, either as a
 * read-only summary or (when `initialEditing` is true) an editable form that
 * saves changes back to the services store.
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
  const { t } = useLocale();
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

  /**
   * Updates a single field in the form state and clears any existing
   * validation error for that field.
   */
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  }

  /**
   * Validates the form, and if it passes, dispatches `updateService` with the
   * edited fields, then notifies the caller and closes the modal on success.
   */
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    const errors = validate(form, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(t('inventory.common.fixFieldsError'));
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
      onSaved(t('inventory.serviceDetail.updateSuccess', { name: form.serviceName || service.service_name }));
      onClose();
    } else {
      setError((result.payload as string) || t('inventory.serviceDetail.updateFailure'));
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
              {editing ? t('inventory.serviceDetail.editTitle') : t('inventory.serviceDetail.viewTitle')}
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">{service.service_name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{service.service_category}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('inventory.common.close')}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <Section title={t('inventory.serviceDetail.sectionService')}>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.name')}</label>
                  <input
                    className={fieldInputClassName(fieldErrors.serviceName)}
                    value={form.serviceName}
                    onChange={(e) => updateField('serviceName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.serviceName} />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.category')}</label>
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
                    <label className={labelClassName}>{t('inventory.serviceDetail.basePrice')}</label>
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
                    <label className={labelClassName}>{t('inventory.serviceDetail.durationH')}</label>
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
                    {t('inventory.serviceDetail.availableAtHome')}
                  </label>
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.baseTravelFee')}</label>
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
                  <label className={labelClassName}>{t('inventory.serviceDetail.logisticsFeeNotes')}</label>
                  <textarea
                    rows={2}
                    className={fieldInputClassName()}
                    value={form.logisticsFeeNotes}
                    onChange={(e) => updateField('logisticsFeeNotes', e.target.value)}
                  />
                </div>
              </Section>

              <Section title={t('inventory.serviceDetail.sectionProvider')}>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.name')}</label>
                  <input
                    className={fieldInputClassName(fieldErrors.providerName)}
                    value={form.providerName}
                    onChange={(e) => updateField('providerName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.providerName} />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.address')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.providerAddress}
                    onChange={(e) => updateField('providerAddress', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.province')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.providerProvince}
                    onChange={(e) => updateField('providerProvince', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.serviceDetail.phone')}</label>
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
                  {t('inventory.common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? t('inventory.common.saving') : t('inventory.common.save')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <Section title={t('inventory.serviceDetail.sectionService')}>
                <InfoRow label={t('inventory.serviceDetail.category')} value={service.service_category} />
                <InfoRow label={t('inventory.serviceDetail.basePrice')} value={formatKwanza(service.service_base_price)} />
                <InfoRow label={t('inventory.serviceDetail.duration')} value={`${service.service_duration_h} h`} />
                <InfoRow
                  label={t('inventory.serviceDetail.availableAtHomeLabel')}
                  value={service.available_at_home ? t('inventory.common.yes') : t('inventory.common.no')}
                />
                <InfoRow
                  label={t('inventory.serviceDetail.baseTravelFee')}
                  value={service.base_travel_fee != null ? formatKwanza(service.base_travel_fee) : '—'}
                />
                <InfoRow label={t('inventory.serviceDetail.logisticsFeeNotes')} value={service.logistics_fee_notes || '—'} />
                <InfoRow
                  label={t('inventory.common.status')}
                  value={service.active === false ? t('inventory.common.inactive') : t('inventory.common.active')}
                />
              </Section>

              <Section title={t('inventory.serviceDetail.sectionProvider')}>
                <InfoRow label={t('inventory.serviceDetail.name')} value={service.provider_name || '—'} />
                <InfoRow label={t('inventory.serviceDetail.address')} value={service.provider_address || '—'} />
                <InfoRow label={t('inventory.serviceDetail.province')} value={service.provider_province || '—'} />
                <InfoRow label={t('inventory.serviceDetail.phone')} value={service.provider_phone || '—'} />
                <InfoRow label={t('inventory.serviceDetail.specialties')} value={service.provider_specialties || '—'} />
                <InfoRow
                  label={t('inventory.serviceDetail.rating')}
                  value={service.provider_rating != null ? String(service.provider_rating) : '—'}
                />
                <InfoRow label={t('inventory.serviceDetail.responseTime')} value={service.provider_response_time || '—'} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
