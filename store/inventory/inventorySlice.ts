import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as inventoryService from './inventoryService';

export interface Product {
  reference: string;
  name: string;
  price: number;
  quantity: number;
  supplier?: string;
  service_offered?: boolean;
  service_name?: string | null;
  service_price?: number | null;
}

export interface UploadResult {
  inserted: number;
  updated: number;
  deactivated: number;
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
