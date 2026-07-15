import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as ordersService from './ordersService';

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'stockConfirmation';

/**
 * Confirmed shape from GET /admin/orders — price arrives as a string (e.g.
 * "2500.00"), and `customer` is just the WhatsApp number, no separate name
 * field. Extend this once other statuses/endpoints are confirmed to carry
 * more fields (e.g. `pending` may include reference/supplier — unconfirmed,
 * it was empty in the sample response).
 */
export interface RawOrderItem {
  number: string;
  customer: string;
  price: string;
  part: string;
  time: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
}

export interface OrderItem {
  number: string;
  customer: string;
  price: number;
  part: string;
  time: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
}

interface OrdersResponseData {
  pending: RawOrderItem[];
  approved: RawOrderItem[];
  rejected: RawOrderItem[];
  stockConfirmation: RawOrderItem[];
}

interface OrdersState {
  pending: OrderItem[];
  approved: OrderItem[];
  rejected: OrderItem[];
  stockConfirmation: OrderItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OrdersState = {
  pending: [],
  approved: [],
  rejected: [],
  stockConfirmation: [],
  status: 'idle',
  error: null,
};

function toOrderItem(raw: RawOrderItem): OrderItem {
  return { ...raw, price: Number(raw.price) || 0 };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (_: void, { rejectWithValue }) => {
  try {
    const res = await ordersService.getOrders();
    return res.data.data as OrdersResponseData;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load orders.'));
  }
});

export const reviewOrder = createAsyncThunk(
  'orders/reviewOrder',
  async ({ number, approved }: { number: string; approved: boolean }, { rejectWithValue }) => {
    try {
      await ordersService.reviewOrder(number, approved);
      return number;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, approved ? 'Failed to approve the order.' : 'Failed to reject the order.')
      );
    }
  }
);

export const confirmOrderStock = createAsyncThunk(
  'orders/confirmOrderStock',
  async ({ number, available }: { number: string; available: boolean }, { rejectWithValue }) => {
    try {
      await ordersService.confirmOrderStock(number, available);
      return number;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, available ? 'Failed to confirm stock.' : 'Failed to mark stock unavailable.')
      );
    }
  }
);

// Assigns only the buckets whose content actually changed, so unrelated
// consumers (e.g. Grid's pagination, which resets when its `rows` prop
// reference changes) don't treat an identical 15s poll as new data.
function applyIfChanged(state: OrdersState, next: OrdersResponseData) {
  (Object.keys(next) as (keyof OrdersResponseData)[]).forEach((key) => {
    const nextItems = next[key].map(toOrderItem);
    if (JSON.stringify(state[key]) !== JSON.stringify(nextItems)) {
      state[key] = nextItems;
    }
  });
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<OrdersResponseData>) => {
        state.status = 'succeeded';
        state.error = null;
        applyIfChanged(state, action.payload);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load orders.';
      });
  },
});

export default ordersSlice.reducer;
