import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as customersService from './customersService';

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
}

// NOTE: GET /admin/customers is not yet confirmed against the real backend —
// this mirrors GET /admin/orders' { data: [...] } envelope and its
// price-as-string quirk (applied here to totalSpent). Adjust once the real
// response shape is shared.
interface RawCustomer {
  id: number | string;
  name: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: string;
  vehicles: Vehicle[];
}

export interface Customer {
  id: number | string;
  name: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  vehicles: Vehicle[];
}

interface CustomersState {
  customers: Customer[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  status: 'idle',
  error: null,
};

function toCustomer(raw: RawCustomer): Customer {
  return { ...raw, totalSpent: Number(raw.totalSpent) || 0, vehicles: raw.vehicles ?? [] };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async (_: void, { rejectWithValue }) => {
  try {
    const res = await customersService.getCustomers();
    return (res.data.data as RawCustomer[]).map(toCustomer);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load customers.'));
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<Customer[]>) => {
        state.status = 'succeeded';
        state.error = null;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load customers.';
      });
  },
});

export default customersSlice.reducer;
