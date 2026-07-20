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
  serviceName?: string;
  servicePrice?: number;
}

export const getProducts = () => {
  return api.get('/admin/products');
};

export const getProduct = (id: number) => {
  return api.get(`/admin/products/${id}`);
};

export const updateProduct = (
  id: number,
  fields: {
    name?: string;
    reference?: string;
    price?: number;
    quantity?: number;
    delivery_time?: string | null;
    service_offered?: boolean;
    service_name?: string | null;
    service_price?: number | null;
  },
) => {
  return api.patch(`/admin/products/${id}`, fields);
};

// Soft-deletes the product (backend sets active = false rather than a hard
// delete — see product.controller.ts).
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
