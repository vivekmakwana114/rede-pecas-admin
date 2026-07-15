import { api } from '@/lib/api';

export interface UploadItemPayload {
  reference: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
}

export const getProducts = () => {
  return api.get('/admin/products');
};

export const uploadInventory = (payload: { items: UploadItemPayload[] }) => {
  return api.post('/admin/inventory/upload', payload);
};
