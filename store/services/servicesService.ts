import { api } from '@/lib/api';

// Shape used for the client-side preview grid only (see serviceAdapters.ts)
// — the actual import uploads the raw file to the server, which parses and
// validates it itself, mirroring inventoryService.ts's UploadItemPayload.
// Field names mirror service.service.ts's HEADER_ALIASES on the backend.
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

export const getServices = () => {
  return api.get('/admin/services');
};

export const getService = (id: number) => {
  return api.get(`/admin/services/${id}`);
};

export const updateService = (id: number, fields: import('./servicesSlice').ServiceUpdateFields) => {
  return api.patch(`/admin/services/${id}`, fields);
};

// Permanently deletes the service — the backend only allows this once it's
// already inactive (409 otherwise) — see service.controller.ts's
// deleteServiceHandler/hardDeleteService.
export const deleteService = (id: number) => {
  return api.delete(`/admin/services/${id}`);
};

// Blank header-only XLSX for the bulk-import flow — see ServiceImportPanel.tsx.
export const downloadServiceTemplate = () => {
  return api.get('/admin/services/template', { responseType: 'blob' });
};

export const uploadServiceFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type must NOT be the instance's default 'application/json' here —
  // setting it to undefined drops that default so the browser sets
  // multipart/form-data with the correct boundary itself.
  return api.post('/admin/services/import', formData, {
    headers: { 'Content-Type': undefined },
  });
};
