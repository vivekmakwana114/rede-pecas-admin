'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateProduct, type Product, type ProductUpdateFields } from '@/store/inventory/inventorySlice';
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

const SUBCATEGORY_OPTIONS = [
  'Engine Oil',
  'Filtration',
  'Brakes',
  'Suspension',
  'Steering',
  'Transmission',
  'Mechanical',
  'Engine',
];

const PART_TYPE_OPTIONS = ['OEM', 'Aftermarket', 'New', 'Second Hand'];

type FormState = {
  name: string;
  reference: string;
  price: string;
  quantity: string;
  supplierName: string;
  supplierAddress: string;
  supplierPhone: string;
  category: string;
  subcategory: string;
  productType: string;
  vehicleMake: string;
  vehicleModel: string;
  yearStart: string;
  yearEnd: string;
  engine: string;
  deliveryTime: string;
  brand: string;
  oemReference: string;
  engineNumber: string;
  viscosity: string;
  engineType: string;
  volumeLiters: string;
  specification: string;
  intervalKm: string;
  imageUrl: string;
  synonyms: string;
  description: string;
};

/**
 * Validates the product edit form, returning a map of field name to error
 * message for any required or malformed fields (name, reference, price, quantity, supplier).
 */
function validate(form: FormState, t: (path: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  const required = t('inventory.common.requiredError');

  if (!form.name.trim()) errors.name = required;
  if (!form.reference.trim()) errors.reference = required;

  if (!form.price.trim()) {
    errors.price = required;
  } else if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.price = t('inventory.common.nonNegativeError');
  }

  if (!form.quantity.trim()) {
    errors.quantity = required;
  } else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
    errors.quantity = t('inventory.common.wholeNumberError');
  }

  if (!form.supplierName.trim()) errors.supplierName = required;

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
 * Slide-over panel showing a single product's full detail, either as a
 * read-only summary or (when `initialEditing` is true) an editable form that
 * saves changes back to the inventory store.
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
  const { t } = useLocale();
  const editing = initialEditing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    name: product.name,
    reference: product.reference,
    price: String(product.price),
    quantity: String(product.quantity),
    supplierName: product.supplier ?? '',
    supplierAddress: product.supplier_address ?? '',
    supplierPhone: product.supplier_phone ?? '',
    category: product.category ?? 'part',
    subcategory: product.subcategory ?? '',
    productType: product.product_type ?? '',
    vehicleMake: product.vehicle_make ?? '',
    vehicleModel: product.vehicle_model ?? '',
    yearStart: product.year_start != null ? String(product.year_start) : '',
    yearEnd: product.year_end != null ? String(product.year_end) : '',
    engine: product.engine ?? '',
    deliveryTime: product.delivery_time ?? '',
    brand: product.brand ?? '',
    oemReference: product.oem_reference ?? '',
    engineNumber: product.engine_number ?? '',
    viscosity: product.viscosity ?? '',
    engineType: product.engine_type ?? '',
    volumeLiters: product.volume_liters != null ? String(product.volume_liters) : '',
    specification: product.specification ?? '',
    intervalKm: product.interval_km != null ? String(product.interval_km) : '',
    imageUrl: product.image_url ?? '',
    synonyms: product.synonyms ?? '',
    description: product.description ?? '',
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
   * Validates the form, and if it passes, dispatches `updateProduct` with the
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

    const fields: ProductUpdateFields = {
      name: form.name,
      reference: form.reference,
      price: Number(form.price),
      quantity: Number(form.quantity),
      supplierName: form.supplierName,
      supplierAddress: form.supplierAddress || null,
      supplierPhone: form.supplierPhone || null,
      category: form.category || undefined,
      subcategory: form.subcategory || undefined,
      product_type: form.productType || null,
      vehicle_make: form.vehicleMake || undefined,
      vehicle_model: form.vehicleModel || null,
      year_start: form.yearStart.trim() ? Number(form.yearStart) : null,
      year_end: form.yearEnd.trim() ? Number(form.yearEnd) : null,
      engine: form.engine || null,
      delivery_time: form.deliveryTime || undefined,
      brand: form.brand || null,
      oem_reference: form.oemReference || null,
      engine_number: form.engineNumber || null,
      viscosity: form.viscosity || null,
      engine_type: form.engineType || null,
      volume_liters: form.volumeLiters.trim() ? Number(form.volumeLiters) : null,
      specification: form.specification || null,
      interval_km: form.intervalKm.trim() ? Number(form.intervalKm) : null,
      image_url: form.imageUrl || null,
      synonyms: form.synonyms || undefined,
      description: form.description || undefined,
    };

    const result = await dispatch(updateProduct({ id: product.id, fields }));
    setSaving(false);

    if (updateProduct.fulfilled.match(result)) {
      onSaved(t('inventory.productDetail.updateSuccess', { name: form.name || product.reference }));
      onClose();
    } else {
      setError((result.payload as string) || t('inventory.productDetail.updateFailure'));
    }
  };

  const isLubricant = product.category === 'lubricant' || !!(product.viscosity || product.engine_type || product.volume_liters);
  const vehicleFit = [product.vehicle_make, product.vehicle_model].filter(Boolean).join(' ');
  const yearRange = [product.year_start, product.year_end].filter((y) => y != null).join('–');
  // vehicle_fits[0] is the same fit already shown above (it's what the
  // flat vehicle_make/model/... fields and the edit form reflect) — only
  // list the rest here, and only in the read view.
  const otherFits = !editing ? (product.vehicle_fits ?? []).slice(1) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/60" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              {editing ? t('inventory.productDetail.editTitle') : t('inventory.productDetail.viewTitle')}
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">{product.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.reference}</p>
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
              <Section title={t('inventory.productDetail.sectionProduct')}>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.name')}</label>
                  <input
                    className={fieldInputClassName(fieldErrors.name)}
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.skuReference')}</label>
                  <input
                    className={fieldInputClassName(fieldErrors.reference)}
                    value={form.reference}
                    onChange={(e) => updateField('reference', e.target.value)}
                  />
                  <FieldError message={fieldErrors.reference} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.price')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldInputClassName(fieldErrors.price)}
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                    />
                    <FieldError message={fieldErrors.price} />
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.quantity')}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={fieldInputClassName(fieldErrors.quantity)}
                      value={form.quantity}
                      onChange={(e) => updateField('quantity', e.target.value)}
                    />
                    <FieldError message={fieldErrors.quantity} />
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.description')}</label>
                  <textarea
                    rows={2}
                    className={fieldInputClassName()}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.synonymsLabel')}</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. oil filter, filtro de óleo"
                    value={form.synonyms}
                    onChange={(e) => updateField('synonyms', e.target.value)}
                  />
                </div>
              </Section>

              <Section title={t('inventory.productDetail.sectionClassification')}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.category')}</label>
                    <select
                      className={fieldInputClassName()}
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                    >
                      <option value="part">{t('inventory.productDetail.categoryPart')}</option>
                      <option value="lubricant">{t('inventory.productDetail.categoryLubricant')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.subcategory')}</label>
                    <select
                      className={fieldInputClassName()}
                      value={form.subcategory}
                      onChange={(e) => updateField('subcategory', e.target.value)}
                    >
                      <option value="" disabled>
                        {t('inventory.common.selectPlaceholder')}
                      </option>
                      {SUBCATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.partType')}</label>
                  <select
                    className={fieldInputClassName()}
                    value={form.productType}
                    onChange={(e) => updateField('productType', e.target.value)}
                  >
                    <option value="">{t('inventory.common.selectPlaceholder')}</option>
                    {PART_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.brand')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.oemReference')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.oemReference}
                    onChange={(e) => updateField('oemReference', e.target.value)}
                  />
                </div>
              </Section>

              <Section title={t('inventory.productDetail.sectionVehicleFit')}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.vehicleMake')}</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.vehicleMake}
                      onChange={(e) => updateField('vehicleMake', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.vehicleModel')}</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.vehicleModel}
                      onChange={(e) => updateField('vehicleModel', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.yearStart')}</label>
                    <input
                      type="number"
                      className={fieldInputClassName()}
                      value={form.yearStart}
                      onChange={(e) => updateField('yearStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.yearEnd')}</label>
                    <input
                      type="number"
                      className={fieldInputClassName()}
                      value={form.yearEnd}
                      onChange={(e) => updateField('yearEnd', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.engine')}</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engine}
                      onChange={(e) => updateField('engine', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.engineNumber')}</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engineNumber}
                      onChange={(e) => updateField('engineNumber', e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              <Section title={t('inventory.productDetail.sectionLubricantSpecs')}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.viscosity')}</label>
                    <input
                      className={fieldInputClassName()}
                      placeholder="e.g. 15W40"
                      value={form.viscosity}
                      onChange={(e) => updateField('viscosity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>{t('inventory.productDetail.engineType')}</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engineType}
                      onChange={(e) => updateField('engineType', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.volumeLiters')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className={fieldInputClassName()}
                    value={form.volumeLiters}
                    onChange={(e) => updateField('volumeLiters', e.target.value)}
                  />
                </div>
              </Section>

              <Section title={t('inventory.productDetail.sectionCatalogInfo')}>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.deliveryTime')}</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. Today"
                    value={form.deliveryTime}
                    onChange={(e) => updateField('deliveryTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.specification')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.specification}
                    onChange={(e) => updateField('specification', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.intervalKm')}</label>
                  <input
                    type="number"
                    className={fieldInputClassName()}
                    value={form.intervalKm}
                    onChange={(e) => updateField('intervalKm', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.imageUrl')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.imageUrl}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                  />
                </div>
              </Section>

              <Section title={t('inventory.productDetail.sectionSupplier')}>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.supplierName')}</label>
                  <input
                    className={fieldInputClassName(fieldErrors.supplierName)}
                    value={form.supplierName}
                    onChange={(e) => updateField('supplierName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.supplierName} />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.supplierAddress')}</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.supplierAddress}
                    onChange={(e) => updateField('supplierAddress', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>{t('inventory.productDetail.supplierPhone')}</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. 244 923 456 789"
                    value={form.supplierPhone}
                    onChange={(e) => updateField('supplierPhone', e.target.value)}
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
              {product.description && (
                <Section title={t('inventory.productDetail.sectionDescription')}>
                  <p className="text-sm text-foreground">{product.description}</p>
                </Section>
              )}

              <Section title={t('inventory.productDetail.sectionClassification')}>
                <InfoRow label={t('inventory.productDetail.category')} value={product.category || '—'} />
                <InfoRow label={t('inventory.productDetail.subcategory')} value={product.subcategory || '—'} />
                <InfoRow label={t('inventory.productDetail.serviceCategory')} value={product.service_category || '—'} />
                <InfoRow label={t('inventory.productDetail.partType')} value={product.product_type || '—'} />
                <InfoRow label={t('inventory.productDetail.brand')} value={product.brand || '—'} />
                <InfoRow label={t('inventory.productDetail.oemReference')} value={product.oem_reference || '—'} />
              </Section>

              <Section title={t('inventory.productDetail.sectionVehicleFit')}>
                <InfoRow label={t('inventory.productDetail.makeModel')} value={vehicleFit || '—'} />
                <InfoRow label={t('inventory.productDetail.yearRange')} value={yearRange || '—'} />
                <InfoRow label={t('inventory.productDetail.engine')} value={product.engine || '—'} />
                <InfoRow label={t('inventory.productDetail.engineNumber')} value={product.engine_number || '—'} />
              </Section>

              {otherFits.length > 0 && (
                <Section title={t('inventory.productDetail.sectionOtherVehicleFits', { count: otherFits.length })}>
                  <ul className="space-y-2">
                    {otherFits.map((fit, i) => {
                      const fitMakeModel = [fit.make, fit.model].filter(Boolean).join(' ');
                      const fitYearRange = [fit.year_start, fit.year_end].filter((y) => y != null).join('–');
                      return (
                        <li key={i} className="rounded-lg border border-border p-3 text-sm">
                          <div className="font-semibold text-foreground">{fitMakeModel || '—'}</div>
                          <div className="text-2xs text-muted-foreground">
                            {[fitYearRange, fit.engine].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {isLubricant && (
                <Section title={t('inventory.productDetail.sectionLubricantSpecs')}>
                  <InfoRow label={t('inventory.productDetail.viscosity')} value={product.viscosity || '—'} />
                  <InfoRow label={t('inventory.productDetail.engineType')} value={product.engine_type || '—'} />
                  <InfoRow
                    label={t('inventory.productDetail.volume')}
                    value={product.volume_liters != null ? `${product.volume_liters} L` : '—'}
                  />
                </Section>
              )}

              <Section title={t('inventory.productDetail.sectionCatalogInfo')}>
                <InfoRow label={t('inventory.productDetail.deliveryTime')} value={product.delivery_time || '—'} />
                <InfoRow label={t('inventory.productDetail.specification')} value={product.specification || '—'} />
                <InfoRow
                  label={t('inventory.productDetail.interval')}
                  value={product.interval_km != null ? `${product.interval_km} km` : '—'}
                />
                <InfoRow label={t('inventory.productDetail.synonymsLabel')} value={product.synonyms || '—'} />
              </Section>

              <Section title={t('inventory.productDetail.sectionStockPricing')}>
                <InfoRow label={t('inventory.productDetail.price')} value={formatKwanza(product.price)} />
                <InfoRow label={t('inventory.productDetail.stock')} value={String(product.quantity)} />
                <InfoRow
                  label={t('inventory.common.status')}
                  value={product.active === false ? t('inventory.common.inactive') : t('inventory.common.active')}
                />
              </Section>

              <Section title={t('inventory.productDetail.sectionSupplier')}>
                <InfoRow label={t('inventory.productDetail.supplierName')} value={product.supplier || '—'} />
                <InfoRow label={t('inventory.productDetail.supplierAddress')} value={product.supplier_address || '—'} />
                <InfoRow label={t('inventory.productDetail.supplierPhone')} value={product.supplier_phone || '—'} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
