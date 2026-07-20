'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { formatKwanza } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { updateProduct, type Product, type ProductUpdateFields } from '@/store/inventory/inventorySlice';
import { Section, InfoRow } from '@/components/DetailPanel';

const baseInputClassName =
  'w-full rounded-lg border px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

function fieldInputClassName(hasError?: string) {
  return `${baseInputClassName} ${hasError ? 'border-destructive' : 'border-input'}`;
}

const labelClassName = 'mb-1 block text-xs font-semibold text-muted-foreground';

type FormState = {
  name: string;
  reference: string;
  price: string;
  quantity: string;
  service_offered: boolean;
  service_name: string;
  service_price: string;
  supplierName: string;
  supplierAddress: string;
  supplierPhone: string;
};

/**
 * Every required field must actually be filled in — a blank Price/Quantity
 * string coerces to 0 via Number(''), which would otherwise sail through
 * silently as "valid" data instead of being caught as missing. Service Name/
 * Price are only required once the Service checkbox is on — picking the
 * service without giving it a name and a price is rejected instead of saved
 * as a half-filled, unusable offer (mirrors validateRow's rule for the bulk
 * import path in product.service.ts, so both entry points agree).
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

  if (form.service_offered) {
    if (!form.service_name.trim()) errors.service_name = 'Required when service is on.';
    if (!form.service_price.trim()) {
      errors.service_price = 'Required when service is on.';
    } else if (Number.isNaN(Number(form.service_price)) || Number(form.service_price) < 0) {
      errors.service_price = 'Must be 0 or more.';
    }
  }

  return errors;
}

/** Inline error text under a field — absent entirely when there's nothing wrong with it. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-2xs font-normal text-destructive">{message}</p>;
}

/**
 * View/edit side panel for a single product — slides in from the right
 * (matching ImportPanel's drawer, rather than a centered dialog) with fields
 * grouped into Product / Supplier / Service sections instead of one flat
 * list. Every field is editable, including the supplier's own name/address/
 * phone — editing those updates the shared supplier row (so every other
 * product from the same supplier reads the change too), not the product's
 * own (supplier_id, reference) identity. There's no dedicated supplier
 * management screen yet, so this panel doubles as it.
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    name: product.name,
    reference: product.reference,
    price: String(product.price),
    quantity: String(product.quantity),
    service_offered: product.service_offered ?? false,
    service_name: product.service_name ?? '',
    service_price: product.service_price != null ? String(product.service_price) : '',
    supplierName: product.supplier ?? '',
    supplierAddress: product.supplier_address ?? '',
    supplierPhone: product.supplier_phone ?? '',
  });

  // Clears a field's error the moment the admin edits it, rather than making
  // them resubmit blind to find out if their fix actually worked.
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

    const fields: ProductUpdateFields = {
      name: form.name,
      reference: form.reference,
      price: Number(form.price),
      quantity: Number(form.quantity),
      service_offered: form.service_offered,
      service_name: form.service_offered ? form.service_name || null : null,
      service_price: form.service_offered && form.service_price ? Number(form.service_price) : null,
      supplierName: form.supplierName,
      supplierAddress: form.supplierAddress || null,
      supplierPhone: form.supplierPhone || null,
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

              <Section title="Service">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="service_offered"
                    checked={form.service_offered}
                    onChange={(e) => updateField('service_offered', e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <label htmlFor="service_offered" className="text-xs font-semibold text-muted-foreground">
                    Service offered alongside this product
                  </label>
                </div>

                {form.service_offered && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className={labelClassName}>Service Name</label>
                      <input
                        className={fieldInputClassName(fieldErrors.service_name)}
                        value={form.service_name}
                        onChange={(e) => updateField('service_name', e.target.value)}
                      />
                      <FieldError message={fieldErrors.service_name} />
                    </div>
                    <div>
                      <label className={labelClassName}>Service Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={fieldInputClassName(fieldErrors.service_price)}
                        value={form.service_price}
                        onChange={(e) => updateField('service_price', e.target.value)}
                      />
                      <FieldError message={fieldErrors.service_price} />
                    </div>
                  </div>
                )}
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
              <Section title="Stock &amp; Pricing">
                <InfoRow label="Price" value={formatKwanza(product.price)} />
                <InfoRow label="Stock" value={String(product.quantity)} />
              </Section>

              <Section title="Supplier">
                <InfoRow label="Name" value={product.supplier || '—'} />
                <InfoRow label="Address" value={product.supplier_address || '—'} />
                <InfoRow label="Phone" value={product.supplier_phone || '—'} />
              </Section>

              <Section title="Service">
                {product.service_offered && product.service_name ? (
                  <>
                    <InfoRow label="Name" value={product.service_name} />
                    {product.service_price != null && (
                      <InfoRow label="Price" value={formatKwanza(product.service_price)} />
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No service attached to this product.</p>
                )}
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
