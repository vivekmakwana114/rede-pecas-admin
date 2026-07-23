import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as inventoryService from './inventoryService';

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
  // Catalog fields from the 2026-07 products CSV import (see db/schema.sql
  // products table on the backend). All nullable except category/subcategory/
  // service_category/vehicle_make/delivery_time/synonyms/description, which
  // are NOT NULL server-side but may still be absent on API responses typed
  // loosely here.
  brand?: string | null;
  oem_reference?: string | null;
  synonyms?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  service_category?: string;
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
  // Reversible soft-delete flag — the admin list includes inactive products
  // (unlike the customer-facing catalog) so a deactivated one stays reachable
  // to toggle back on. See product.controller.ts's getProductsHandler.
  active?: boolean;
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
  // Rows the server's file-upload importer skipped rather than rejecting the
  // whole file for (missing/invalid required field, unknown subcategory,
  // etc.) — see product.service.ts's validateRow on the backend.
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

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async (_: void, { rejectWithValue }) => {
  try {
    const res = await inventoryService.getProducts();
    return res.data.data as Product[];
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load products.'));
  }
});

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

// Permanently deletes the product (backend rejects with a 409 unless it's
// already inactive — deactivate first via updateProduct's `active: false`;
// see hardDeleteProduct/deleteProductHandler on the backend, and
// ProductsGrid's handleDeactivate/handleActivate/handleDelete for how the
// three actions fit together). A 409 for "still active" or "still
// referenced by an order" surfaces here as the rejected payload's message.
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
    resetUpload(state) {
      state.upload = { status: 'idle', result: null, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.status = 'succeeded';
        state.error = null;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load products.';
      })
      .addCase(importInventory.pending, (state) => {
        state.upload.status = 'loading';
        state.upload.error = null;
      })
      .addCase(importInventory.fulfilled, (state, action: PayloadAction<UploadResult>) => {
        state.upload.status = 'succeeded';
        state.upload.result = action.payload;
      })
      .addCase(importInventory.rejected, (state, action) => {
        state.upload.status = 'failed';
        state.upload.error = (action.payload as string) || 'Failed to import the stock file.';
      });
  },
});

export const { resetUpload } = inventorySlice.actions;
export default inventorySlice.reducer;
