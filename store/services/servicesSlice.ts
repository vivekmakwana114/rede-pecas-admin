import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as servicesService from './servicesService';

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

export interface ServiceUpdateFields {
  service_name?: string;
  service_category?: string;
  service_base_price?: number;
  service_duration_h?: number;
  available_at_home?: boolean;
  base_travel_fee?: number | null;
  logistics_fee_notes?: string | null;
  active?: boolean;
  providerName?: string;
  providerAddress?: string | null;
  providerProvince?: string | null;
  providerPhone?: string | null;
}

export interface ServiceUploadResult {
  inserted: number;
  updated: number;
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

/**
 * Pulls a human-readable message out of an Axios error's response body,
 * falling back to the error's own message or a given default.
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

/**
 * Fetches the service list from the API for the services table.
 */
export const fetchServices = createAsyncThunk('services/fetchServices', async (_: void, { rejectWithValue }) => {
  try {
    const res = await servicesService.getServices();
    return res.data.data as Service[];
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load services.'));
  }
});

/**
 * Uploads a service file to the API for bulk import and returns the
 * insert/update/skip results for display.
 */
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

/**
 * Updates a service via the API and returns its id so the reducer can
 * identify the affected entry (list refresh is handled by the caller).
 */
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

/**
 * Deletes a service via the API and returns its id so the reducer can
 * identify the affected entry (list refresh is handled by the caller).
 */
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
    /** Resets the upload sub-state back to idle, clearing any prior result or error. */
    resetServiceUpload(state) {
      state.upload = { status: 'idle', result: null, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      /** Marks the service list fetch as in progress. */
      .addCase(fetchServices.pending, (state) => {
        state.status = 'loading';
      })
      /** Stores the fetched service list on success. */
      .addCase(fetchServices.fulfilled, (state, action: PayloadAction<Service[]>) => {
        state.status = 'succeeded';
        state.error = null;
        state.services = action.payload;
      })
      /** Records the error message when the service fetch fails. */
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load services.';
      })
      /** Marks the service import as in progress and clears any previous error. */
      .addCase(importServices.pending, (state) => {
        state.upload.status = 'loading';
        state.upload.error = null;
      })
      /** Stores the import result (inserted/updated/skipped counts) on success. */
      .addCase(importServices.fulfilled, (state, action: PayloadAction<ServiceUploadResult>) => {
        state.upload.status = 'succeeded';
        state.upload.result = action.payload;
      })
      /** Records the error message when the service import fails. */
      .addCase(importServices.rejected, (state, action) => {
        state.upload.status = 'failed';
        state.upload.error = (action.payload as string) || 'Failed to import the service file.';
      });
  },
});

export const { resetServiceUpload } = servicesSlice.actions;
export default servicesSlice.reducer;
