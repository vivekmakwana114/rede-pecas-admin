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

// Confirmed shape from GET /admin/customers (customer.model.ts/
// customer.controller.ts): a paginated envelope — { customers, total, page,
// limit } — not a flat array, and customers are keyed by phone (no numeric
// id). orders_count/total_spent/vehicles are a LATERAL-joined aggregate
// (see CUSTOMER_STATS_JOIN in customer.model.ts) — total_spent sums only
// approved orders (same "money actually collected" convention as the
// dashboard's Revenue card), vehicles only includes confirmed ones (an
// in-progress manual-entry wizard row isn't a real vehicle yet).
interface RawCustomer {
  phone: string;
  name: string | null;
  nif: string | null;
  address: string | null;
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

function toVehicle(raw: RawVehicle): Vehicle {
  return {
    make: raw.make || '—',
    model: raw.model || '—',
    year: Number(raw.year) || 0,
    plate: raw.plate || '—',
  };
}

function toCustomer(raw: RawCustomer): Customer {
  return {
    id: raw.phone,
    name: raw.name || raw.phone,
    phone: raw.phone,
    nif: raw.nif,
    address: raw.address,
    email: raw.email,
    createdAt: raw.first_contact_at,
    ordersCount: raw.orders_count,
    totalSpent: Number(raw.total_spent) || 0,
    vehicles: (raw.vehicles ?? []).map(toVehicle),
  };
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
    return (res.data.data.customers as RawCustomer[]).map(toCustomer);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load customers.'));
  }
});

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
