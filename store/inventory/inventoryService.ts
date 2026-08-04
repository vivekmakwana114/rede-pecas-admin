import { api } from '@/lib/api';

export interface UploadItemPayload {
  reference: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  supplierAddress?: string;
  supplierPhone?: string;
  category?: string;
  subcategory?: string;
  productType?: string;
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

/**
 * Fetches the full product/inventory list from the admin API.
 */
export const getProducts = () => {
  return api.get('/admin/products');
};

/**
 * Fetches a single product by its id.
 */
export const getProduct = (id: number) => {
  return api.get(`/admin/products/${id}`);
};

/**
 * Updates a product's editable fields by id.
 */
export const updateProduct = (id: number, fields: import('./inventorySlice').ProductUpdateFields) => {
  return api.patch(`/admin/products/${id}`, fields);
};

/**
 * Deletes a product by id.
 */
export const deleteProduct = (id: number) => {
  return api.delete(`/admin/products/${id}`);
};

/**
 * Downloads the inventory import spreadsheet template as a blob.
 */
export const downloadTemplate = () => {
  return api.get('/admin/inventory/template', { responseType: 'blob' });
};

/**
 * Uploads an inventory file for bulk import, sending it as multipart form data.
 */
export const uploadInventoryFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/inventory/import', formData, {
    headers: { 'Content-Type': undefined },
  });
};
