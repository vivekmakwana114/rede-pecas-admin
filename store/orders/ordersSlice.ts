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
 *
 * `stock_status` and the `service_*` fields aren't sent by the backend yet
 * (tracked alongside the `time`-format fix) — optional here so the UI can
 * render them the moment the API adds them, with a bucket-derived fallback
 * in adapters.ts until then. `service_price` accepts string or number since
 * we don't yet know which this endpoint will serialize it as (Product's
 * equivalent field arrives as a number, but this endpoint sends `price` as
 * a string).
 */
export interface RawOrderItem {
  number: string;
  customer: string;
  price: string;
  part: string;
  time: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
  stock_status?: 'pending' | 'unavailable' | 'available' | 'confirmed';
  service_offered?: boolean;
  service_name?: string | null;
  service_price?: string | number | null;
}

export interface OrderItem {
  number: string;
  customer: string;
  price: number;
  part: string;
  time: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
  stock_status?: 'pending' | 'unavailable' | 'available' | 'confirmed';
  service_offered?: boolean;
  service_name?: string | null;
  service_price?: number | null;
}

interface OrdersResponseData {
  pending: RawOrderItem[];
  approved: RawOrderItem[];
  rejected: RawOrderItem[];
  stockConfirmation: RawOrderItem[];
}

// All-time platform totals — from GET /admin/orders/stats, deliberately
// separate from the pending/approved/rejected/stockConfirmation buckets
// above, which are today-scoped queues for the Orders page's daily log
// (see getOrderStats in order.model.ts on the backend for why).
export interface OrderStats {
  totalOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  approvedRevenue: number;
}

interface RawOrderStats {
  totalOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  approvedRevenue: string;
}

const initialStats: OrderStats = {
  totalOrders: 0,
  approvedOrders: 0,
  rejectedOrders: 0,
  approvedRevenue: 0,
};

interface OrdersState {
  pending: OrderItem[];
  approved: OrderItem[];
  rejected: OrderItem[];
  stockConfirmation: OrderItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  stats: OrderStats;
  statsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: OrdersState = {
  pending: [],
  approved: [],
  rejected: [],
  stockConfirmation: [],
  status: 'idle',
  error: null,
  stats: initialStats,
  statsStatus: 'idle',
};

function toOrderItem(raw: RawOrderItem): OrderItem {
  return {
    ...raw,
    price: Number(raw.price) || 0,
    service_price: raw.service_price != null ? Number(raw.service_price) : null,
  };
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

export const fetchOrderStats = createAsyncThunk('orders/fetchOrderStats', async (_: void, { rejectWithValue }) => {
  try {
    const res = await ordersService.getOrderStats();
    const raw = res.data.data as RawOrderStats;
    return { ...raw, approvedRevenue: Number(raw.approvedRevenue) || 0 } as OrderStats;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load order stats.'));
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

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (number: string, { rejectWithValue }) => {
    try {
      await ordersService.cancelOrder(number);
      return number;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to cancel the order.'));
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
      })
      .addCase(fetchOrderStats.pending, (state) => {
        state.statsStatus = 'loading';
      })
      .addCase(fetchOrderStats.fulfilled, (state, action: PayloadAction<OrderStats>) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchOrderStats.rejected, (state) => {
        state.statsStatus = 'failed';
      });
  },
});

export default ordersSlice.reducer;
