import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as servicesService from './servicesService';

// Mirrors the backend's Service shape (src/models/service.model.ts,
// getAllServices/getServiceById) — a standalone bookable service from a
// service_providers row, matched to products via service_category. Not the
// same concept as the (now-removed) product-attached service fields.
export interface Service {
  id: number;
  provider_id: number;
  provider_name?: string;
  provider_address?: string | null;
  provider_province?: string;
  provider_phone?: string;
  provider_specialties?: string | null;
  provider_rating?: number;
  provider_response_time?: string | null;
  service_name: string;
  service_category: string;
  service_base_price: number;
  service_duration_h: number;
  available_at_home: boolean;
  base_travel_fee?: number | null;
  logistics_fee_notes?: string | null;
  active?: boolean;
}

// Mirrors the backend's serviceUpdate Joi schema (src/validations/service.validation.ts).
export interface ServiceUpdateFields {
  service_name?: string;
  service_category?: string;
  service_base_price?: number;
  service_duration_h?: number;
  available_at_home?: boolean;
  base_travel_fee?: number | null;
  logistics_fee_notes?: string | null;
  active?: boolean;
  // Provider's own fields — edited from a service's own panel, same pattern
  // as ProductUpdateFields' supplier fields (no dedicated provider
  // management screen exists yet).
  providerName?: string;
  providerAddress?: string | null;
  providerProvince?: string | null;
  providerPhone?: string | null;
}

export interface ServiceUploadResult {
  inserted: number;
  updated: number;
  // Rows the server's file-upload importer skipped rather than rejecting the
  // whole file for — see service.service.ts's validateServiceRow on the backend.
  skipped?: { row: number; reasons: string[] }[];
}

interface ServicesState {
  services: Service[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  upload: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    result: ServiceUploadResult | null;
    error: string | null;
  };
}

const initialState: ServicesState = {
  services: [],
  status: 'idle',
  error: null,
  upload: { status: 'idle', result: null, error: null },
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const fetchServices = createAsyncThunk('services/fetchServices', async (_: void, { rejectWithValue }) => {
  try {
    const res = await servicesService.getServices();
    return res.data.data as Service[];
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load services.'));
  }
});

export const importServices = createAsyncThunk(
  'services/importServices',
  async (file: File, { rejectWithValue }) => {
    try {
      const res = await servicesService.uploadServiceFile(file);
      return res.data.data as ServiceUploadResult;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to import the service file.'));
    }
  },
);

export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ id, fields }: { id: number; fields: ServiceUpdateFields }, { rejectWithValue }) => {
    try {
      await servicesService.updateService(id, fields);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to update the service.'));
    }
  },
);

export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id: number, { rejectWithValue }) => {
    try {
      await servicesService.deleteService(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to delete the service.'));
    }
  },
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    resetServiceUpload(state) {
      state.upload = { status: 'idle', result: null, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchServices.fulfilled, (state, action: PayloadAction<Service[]>) => {
        state.status = 'succeeded';
        state.error = null;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load services.';
      })
      .addCase(importServices.pending, (state) => {
        state.upload.status = 'loading';
        state.upload.error = null;
      })
      .addCase(importServices.fulfilled, (state, action: PayloadAction<ServiceUploadResult>) => {
        state.upload.status = 'succeeded';
        state.upload.result = action.payload;
      })
      .addCase(importServices.rejected, (state, action) => {
        state.upload.status = 'failed';
        state.upload.error = (action.payload as string) || 'Failed to import the service file.';
      });
  },
});

export const { resetServiceUpload } = servicesSlice.actions;
export default servicesSlice.reducer;
