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
