import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as inventoryService from './inventoryService';

export interface VehicleFit {
  make: string;
  model: string | null;
  year_start: number | null;
  year_end: number | null;
  engine: string | null;
  engine_number: string | null;
}

export interface Product {
  id: number;
  reference: string;
  name: string;
  price: number;
  quantity: number;
  supplier?: string;
  supplier_id?: number;
  supplier_address?: string | null;
  supplier_phone?: string | null;
  brand?: string | null;
  oem_reference?: string | null;
  synonyms?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  service_category?: string;
  // OEM/Aftermarket/New/Second Hand — free text, asked once at import/edit
  // time. Null for catalog rows created before this field existed.
  product_type?: string | null;
  vehicle_make?: string;
  vehicle_model?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  engine?: string | null;
  delivery_time?: string;
  engine_number?: string | null;
  viscosity?: string | null;
  engine_type?: string | null;
  volume_liters?: number | null;
  specification?: string | null;
  interval_km?: number | null;
  image_url?: string | null;
  active?: boolean;
  // Every compatible-vehicle fit on file for this product — vehicle_make/
  // model/year_start/year_end above are only the first of these (the one the
  // edit form edits); this is the full list, for display only.
  vehicle_fits?: VehicleFit[] | null;
}

export interface ProductUpdateFields {
  name?: string;
  reference?: string;
  price?: number;
  quantity?: number;
  active?: boolean;
  supplierName?: string;
  supplierAddress?: string | null;
  supplierPhone?: string | null;
  category?: string;
  subcategory?: string;
  product_type?: string | null;
  vehicle_make?: string;
  vehicle_model?: string | null;
  year_start?: number | null;
  year_end?: number | null;
  engine?: string | null;
  delivery_time?: string;
  oem_reference?: string | null;
  brand?: string | null;
  engine_number?: string | null;
  viscosity?: string | null;
  engine_type?: string | null;
  volume_liters?: number | null;
  specification?: string | null;
  interval_km?: number | null;
  image_url?: string | null;
  synonyms?: string;
  description?: string;
}

export interface UploadResult {
  inserted: number;
  updated: number;
  skipped?: { row: number; reasons: string[] }[];
}

interface InventoryState {
  products: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  upload: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    result: UploadResult | null;
    error: string | null;
  };
}

const initialState: InventoryState = {
  products: [],
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
 * Fetches the product list from the API for the inventory table.
 */
export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async (_: void, { rejectWithValue }) => {
  try {
    const res = await inventoryService.getProducts();
    return res.data.data as Product[];
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load products.'));
  }
});

/**
 * Uploads a stock file to the API for bulk product import and returns the
 * insert/update/skip results for display.
 */
export const importInventory = createAsyncThunk(
  'inventory/importInventory',
  async (file: File, { rejectWithValue }) => {
    try {
      const res = await inventoryService.uploadInventoryFile(file);
      return res.data.data as UploadResult;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to import the stock file.'));
    }
  },
);

/**
 * Updates a product via the API and returns its id so the reducer can
 * identify the affected entry (list refresh is handled by the caller).
 */
export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async ({ id, fields }: { id: number; fields: ProductUpdateFields }, { rejectWithValue }) => {
    try {
      await inventoryService.updateProduct(id, fields);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to update the product.'));
    }
  },
);

/**
 * Deletes a product via the API and returns its id so the reducer can
 * identify the affected entry (list refresh is handled by the caller).
 */
export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (id: number, { rejectWithValue }) => {
    try {
      await inventoryService.deleteProduct(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to delete the product.'));
    }
  },
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    /** Resets the upload sub-state back to idle, clearing any prior result or error. */
    resetUpload(state) {
      state.upload = { status: 'idle', result: null, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      /** Marks the product list fetch as in progress. */
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      /** Stores the fetched product list on success. */
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.status = 'succeeded';
        state.error = null;
        state.products = action.payload;
      })
      /** Records the error message when the product fetch fails. */
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load products.';
      })
      /** Marks the inventory upload as in progress and clears any previous error. */
      .addCase(importInventory.pending, (state) => {
        state.upload.status = 'loading';
        state.upload.error = null;
      })
      /** Stores the import result (inserted/updated/skipped counts) on success. */
      .addCase(importInventory.fulfilled, (state, action: PayloadAction<UploadResult>) => {
        state.upload.status = 'succeeded';
        state.upload.result = action.payload;
      })
      /** Records the error message when the inventory import fails. */
      .addCase(importInventory.rejected, (state, action) => {
        state.upload.status = 'failed';
        state.upload.error = (action.payload as string) || 'Failed to import the stock file.';
      });
  },
});

export const { resetUpload } = inventorySlice.actions;
export default inventorySlice.reducer;
