import { api } from '@/lib/api';

export interface ServiceUploadItemPayload {
  providerName: string;
  providerAddress?: string;
  providerProvince?: string;
  providerPhone?: string;
  specialties?: string;
  rating?: number;
  responseTime?: string;
  serviceName: string;
  serviceCategory: string;
  serviceBasePrice: number;
  serviceDurationH: number;
  availableAtHome?: boolean;
  baseTravelFee?: number;
  logisticsFeeNotes?: string;
}

/**
 * Fetches the full list of services from the admin API.
 */
export const getServices = () => {
  return api.get('/admin/services');
};

/**
 * Fetches a single service by its id.
 */
export const getService = (id: number) => {
  return api.get(`/admin/services/${id}`);
};

/**
 * Updates a service's editable fields by id.
 */
export const updateService = (id: number, fields: import('./servicesSlice').ServiceUpdateFields) => {
  return api.patch(`/admin/services/${id}`, fields);
};

/**
 * Deletes a service by id.
 */
export const deleteService = (id: number) => {
  return api.delete(`/admin/services/${id}`);
};

/**
 * Downloads the service import spreadsheet template as a blob.
 */
export const downloadServiceTemplate = () => {
  return api.get('/admin/services/template', { responseType: 'blob' });
};

/**
 * Uploads a service file for bulk import, sending it as multipart form data.
 */
export const uploadServiceFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/admin/services/import', formData, {
    headers: { 'Content-Type': undefined },
  });
};
