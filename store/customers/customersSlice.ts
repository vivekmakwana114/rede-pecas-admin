import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as customersService from './customersService';

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
}

interface RawVehicle {
  make: string | null;
  model: string | null;
  year: string | null;
  plate: string | null;
}

interface RawCustomer {
  phone: string;
  name: string | null;
  nif: string | null;
  address: string | null;
  // Captured per-order (not at registration) via the deferred order-profile
  // flow — holds the customer's last-known value, overwritten on each new
  // order. View-only: the backend's PATCH /customers/:phone doesn't accept
  // this field, so there's no edit path for it here either.
  customer_type: 'individual' | 'company' | null;
  email: string | null;
  first_contact_at: string;
  orders_count: number;
  total_spent: string;
  vehicles: RawVehicle[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  nif: string | null;
  address: string | null;
  customerType: 'individual' | 'company' | null;
  email: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  vehicles: Vehicle[];
}

export interface CustomerUpdateFields {
  name?: string;
  nif?: string | null;
  address?: string | null;
  email?: string | null;
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

/**
 * Maps a raw API vehicle payload to the UI's Vehicle shape, substituting
 * a placeholder dash for any missing make/model/plate field.
 */
function toVehicle(raw: RawVehicle): Vehicle {
  return {
    make: raw.make || '—',
    model: raw.model || '—',
    year: Number(raw.year) || 0,
    plate: raw.plate || '—',
  };
}

/**
 * Maps a raw API customer payload to the UI's Customer shape, defaulting
 * the display name to the phone number and normalizing total spend/vehicles.
 */
function toCustomer(raw: RawCustomer): Customer {
  return {
    id: raw.phone,
    name: raw.name || raw.phone,
    phone: raw.phone,
    nif: raw.nif,
    address: raw.address,
    customerType: raw.customer_type,
    email: raw.email,
    createdAt: raw.first_contact_at,
    ordersCount: raw.orders_count,
    totalSpent: Number(raw.total_spent) || 0,
    vehicles: (raw.vehicles ?? []).map(toVehicle),
  };
}

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
 * Fetches all customers from the API and maps the raw response rows
 * (including nested vehicles) into the normalized Customer shape.
 */
export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async (_: void, { rejectWithValue }) => {
  try {
    const res = await customersService.getCustomers();
    return (res.data.data.customers as RawCustomer[]).map(toCustomer);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load customers.'));
  }
});

/**
 * Updates a customer's editable fields via the API and returns their phone
 * number so the reducer can identify which customer to refresh.
 */
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ phone, fields }: { phone: string; fields: CustomerUpdateFields }, { rejectWithValue }) => {
    try {
      await customersService.updateCustomer(phone, fields);
      return phone;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to update the customer.'));
    }
  },
);

/**
 * Deletes a customer via the API and returns their phone number so the
 * reducer can remove them from state.
 */
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (phone: string, { rejectWithValue }) => {
    try {
      await customersService.deleteCustomer(phone);
      return phone;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to delete the customer.'));
    }
  },
);

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
