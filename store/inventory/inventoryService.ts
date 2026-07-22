import { api } from '@/lib/api';

// Shape used for the client-side preview grid only (see adapters.ts) — the
// actual import now uploads the raw file to the server, which parses and
// validates it itself (required columns, per-row checks, all rejected
// together on any problem). Kept separate from whatever fields the server
// ends up requiring so the preview never silently drifts out of sync with
// validation that now lives server-side.
export interface UploadItemPayload {
  reference: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  supplierAddress?: string;
  supplierPhone?: string;
  // Catalog fields from the products CSV (see product.service.ts's
  // HEADER_ALIASES on the backend) — one field per CSV column, shown in the
  // import review grid 1:1 with the source file so the admin can see
  // exactly what's about to be imported, not a curated subset.
  category?: string;
  subcategory?: string;
  oemReference?: string;
  deliveryTime?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  yearStart?: number;
  yearEnd?: number;
  engine?: string;
  engineNumber?: string;
  viscosity?: string;
  engineType?: string;
  volumeLiters?: number;
  specification?: string;
  intervalKm?: number;
  description?: string;
  synonyms?: string;
  imageUrl?: string;
  brand?: string;
}

export const getProducts = () => {
  return api.get('/admin/products');
};

export const getProduct = (id: number) => {
  return api.get(`/admin/products/${id}`);
};

// Also how a product is re-activated — see ProductUpdateFields' `active`
// field and ProductsGrid's "Activate product" action (PATCH { active: true }).
export const updateProduct = (id: number, fields: import('./inventorySlice').ProductUpdateFields) => {
  return api.patch(`/admin/products/${id}`, fields);
};

// Permanently deletes the product — the backend only allows this once it's
// already inactive (409 otherwise), and also 409s if an existing order or
// waitlist entry still references it — see product.controller.ts's
// deleteProductHandler/hardDeleteProduct.
export const deleteProduct = (id: number) => {
  return api.delete(`/admin/products/${id}`);
};

// Blank header-only XLSX for the bulk-import flow — see ImportPanel.tsx.
export const downloadTemplate = () => {
  return api.get('/admin/inventory/template', { responseType: 'blob' });
};

export const uploadInventoryFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type must NOT be the instance's default 'application/json' here —
  // setting it to undefined drops that default so the browser sets
  // multipart/form-data with the correct boundary itself.
  return api.post('/admin/inventory/import', formData, {
    headers: { 'Content-Type': undefined },
  });
};
