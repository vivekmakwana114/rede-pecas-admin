'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateProduct, type Product, type ProductUpdateFields } from '@/store/inventory/inventorySlice';
import { Section, InfoRow } from '@/components/DetailPanel';

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
function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = 'Required.';
  if (!form.reference.trim()) errors.reference = 'Required.';

  if (!form.price.trim()) {
    errors.price = 'Required.';
  } else if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.price = 'Must be 0 or more.';
  }

  if (!form.quantity.trim()) {
    errors.quantity = 'Required.';
  } else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
    errors.quantity = 'Must be a whole number, 0 or more.';
  }

  if (!form.supplierName.trim()) errors.supplierName = 'Required.';

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

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Fix the highlighted fields before saving.');
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
      onSaved(`Product ${form.name || product.reference} updated.`);
      onClose();
    } else {
      setError((result.payload as string) || 'Failed to update the product.');
    }
  };

  const isLubricant = product.category === 'lubricant' || !!(product.viscosity || product.engine_type || product.volume_liters);
  const vehicleFit = [product.vehicle_make, product.vehicle_model].filter(Boolean).join(' ');
  const yearRange = [product.year_start, product.year_end].filter((y) => y != null).join('–');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/60" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <p className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              {editing ? 'Edit Product' : 'Product'}
            </p>
            <h2 className="mt-1 truncate text-base font-bold text-foreground">{product.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{product.reference}</p>
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
              <Section title="Product">
                <div>
                  <label className={labelClassName}>Name</label>
                  <input
                    className={fieldInputClassName(fieldErrors.name)}
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>
                <div>
                  <label className={labelClassName}>SKU / Reference</label>
                  <input
                    className={fieldInputClassName(fieldErrors.reference)}
                    value={form.reference}
                    onChange={(e) => updateField('reference', e.target.value)}
                  />
                  <FieldError message={fieldErrors.reference} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Price</label>
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
                    <label className={labelClassName}>Quantity</label>
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
                  <label className={labelClassName}>Description</label>
                  <textarea
                    rows={2}
                    className={fieldInputClassName()}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Synonyms / search keywords</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. oil filter, filtro de óleo"
                    value={form.synonyms}
                    onChange={(e) => updateField('synonyms', e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Classification">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Category</label>
                    <select
                      className={fieldInputClassName()}
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                    >
                      <option value="part">Part</option>
                      <option value="lubricant">Lubricant</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>Subcategory</label>
                    <select
                      className={fieldInputClassName()}
                      value={form.subcategory}
                      onChange={(e) => updateField('subcategory', e.target.value)}
                    >
                      <option value="" disabled>
                        Select…
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
                  <label className={labelClassName}>Brand</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>OEM Reference</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.oemReference}
                    onChange={(e) => updateField('oemReference', e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Vehicle Fit">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Vehicle Make</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.vehicleMake}
                      onChange={(e) => updateField('vehicleMake', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Vehicle Model</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.vehicleModel}
                      onChange={(e) => updateField('vehicleModel', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Year Start</label>
                    <input
                      type="number"
                      className={fieldInputClassName()}
                      value={form.yearStart}
                      onChange={(e) => updateField('yearStart', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Year End</label>
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
                    <label className={labelClassName}>Engine</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engine}
                      onChange={(e) => updateField('engine', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Engine Number</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engineNumber}
                      onChange={(e) => updateField('engineNumber', e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Lubricant Specs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClassName}>Viscosity</label>
                    <input
                      className={fieldInputClassName()}
                      placeholder="e.g. 15W40"
                      value={form.viscosity}
                      onChange={(e) => updateField('viscosity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Engine Type</label>
                    <input
                      className={fieldInputClassName()}
                      value={form.engineType}
                      onChange={(e) => updateField('engineType', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClassName}>Volume (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={fieldInputClassName()}
                    value={form.volumeLiters}
                    onChange={(e) => updateField('volumeLiters', e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Catalog Info">
                <div>
                  <label className={labelClassName}>Delivery Time</label>
                  <input
                    className={fieldInputClassName()}
                    placeholder="e.g. Today"
                    value={form.deliveryTime}
                    onChange={(e) => updateField('deliveryTime', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Specification</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.specification}
                    onChange={(e) => updateField('specification', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Interval (Km)</label>
                  <input
                    type="number"
                    className={fieldInputClassName()}
                    value={form.intervalKm}
                    onChange={(e) => updateField('intervalKm', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Image URL</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.imageUrl}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                  />
                </div>
              </Section>

              <Section title="Supplier">
                <div>
                  <label className={labelClassName}>Name</label>
                  <input
                    className={fieldInputClassName(fieldErrors.supplierName)}
                    value={form.supplierName}
                    onChange={(e) => updateField('supplierName', e.target.value)}
                  />
                  <FieldError message={fieldErrors.supplierName} />
                </div>
                <div>
                  <label className={labelClassName}>Address</label>
                  <input
                    className={fieldInputClassName()}
                    value={form.supplierAddress}
                    onChange={(e) => updateField('supplierAddress', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Phone</label>
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
              {product.description && (
                <Section title="Description">
                  <p className="text-sm text-foreground">{product.description}</p>
                </Section>
              )}

              <Section title="Classification">
                <InfoRow label="Category" value={product.category || '—'} />
                <InfoRow label="Subcategory" value={product.subcategory || '—'} />
                <InfoRow label="Service Category" value={product.service_category || '—'} />
                <InfoRow label="Brand" value={product.brand || '—'} />
                <InfoRow label="OEM Reference" value={product.oem_reference || '—'} />
              </Section>

              <Section title="Vehicle Fit">
                <InfoRow label="Make / Model" value={vehicleFit || '—'} />
                <InfoRow label="Year Range" value={yearRange || '—'} />
                <InfoRow label="Engine" value={product.engine || '—'} />
                <InfoRow label="Engine Number" value={product.engine_number || '—'} />
              </Section>

              {isLubricant && (
                <Section title="Lubricant Specs">
                  <InfoRow label="Viscosity" value={product.viscosity || '—'} />
                  <InfoRow label="Engine Type" value={product.engine_type || '—'} />
                  <InfoRow label="Volume" value={product.volume_liters != null ? `${product.volume_liters} L` : '—'} />
                </Section>
              )}

              <Section title="Catalog Info">
                <InfoRow label="Delivery Time" value={product.delivery_time || '—'} />
                <InfoRow label="Specification" value={product.specification || '—'} />
                <InfoRow label="Interval" value={product.interval_km != null ? `${product.interval_km} km` : '—'} />
                <InfoRow label="Synonyms" value={product.synonyms || '—'} />
              </Section>

              <Section title="Stock &amp; Pricing">
                <InfoRow label="Price" value={formatKwanza(product.price)} />
                <InfoRow label="Stock" value={String(product.quantity)} />
                <InfoRow label="Status" value={product.active === false ? 'Inactive' : 'Active'} />
              </Section>

              <Section title="Supplier">
                <InfoRow label="Name" value={product.supplier || '—'} />
                <InfoRow label="Address" value={product.supplier_address || '—'} />
                <InfoRow label="Phone" value={product.supplier_phone || '—'} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
