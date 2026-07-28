import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as ordersService from './ordersService';

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'stockConfirmation';

// A multi-product "basket" order (customer asked for several parts in one
// WhatsApp message) carries its line items here instead of the single
// part/price fields above, which stay null/absent for these orders — see
// rede-pecas-api's db/schema.sql orders.items column.
export interface RawOrderItemLine {
  itemId: number;
  productId: number;
  productName: string;
  reference: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitPrice: number | string;
  serviceName: string | null;
  servicePrice: number | string | null;
  availabilityStatus: 'pending' | 'available' | 'unavailable' | 'declined';
}

export interface OrderItemLine {
  itemId: number;
  productId: number;
  productName: string;
  reference: string;
  supplierId: number;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  serviceName: string | null;
  servicePrice: number | null;
  availabilityStatus: 'pending' | 'available' | 'unavailable' | 'declined';
}

export interface RawOrderItem {
  number: string;
  customer: string;
  price: string;
  quantity?: number;
  part: string;
  time: string;
  updated_at?: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
  stock_status?: 'pending' | 'unavailable' | 'confirmed';
  service_offered?: boolean;
  service_name?: string | null;
  service_price?: string | number | null;
  verifying?: boolean;
  reviewable?: boolean;
  items?: RawOrderItemLine[] | null;
}

export interface OrderItem {
  number: string;
  customer: string;
  price: number;
  quantity: number;
  part: string;
  time: string;
  updated_at?: string;
  has_proof?: boolean;
  payment_proof_media_type?: 'image' | 'document' | null;
  stock_status?: 'pending' | 'unavailable' | 'confirmed';
  service_offered?: boolean;
  service_name?: string | null;
  service_price?: number | null;
  verifying?: boolean;
  reviewable?: boolean;
  items?: OrderItemLine[] | null;
}

interface OrdersResponseData {
  pending: RawOrderItem[];
  approved: RawOrderItem[];
  rejected: RawOrderItem[];
  stockConfirmation: RawOrderItem[];
}

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

/**
 * Maps a raw line item to the UI's OrderItemLine shape, coercing
 * unitPrice/servicePrice to numbers (or null when absent).
 */
export function toOrderItemLine(raw: RawOrderItemLine): OrderItemLine {
  return {
    ...raw,
    unitPrice: Number(raw.unitPrice) || 0,
    servicePrice: raw.servicePrice != null ? Number(raw.servicePrice) : null,
  };
}

/**
 * Maps a raw order payload to the UI's OrderItem shape, coercing
 * price/quantity/service_price to numbers (or null when absent).
 */
function toOrderItem(raw: RawOrderItem): OrderItem {
  return {
    ...raw,
    price: Number(raw.price) || 0,
    quantity: raw.quantity ?? 0,
    service_price: raw.service_price != null ? Number(raw.service_price) : null,
    items: raw.items ? raw.items.map(toOrderItemLine) : null,
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
 * Fetches orders (optionally scoped to today) from the API and normalizes
 * the raw price/quantity/service-price fields into numbers.
 */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (range: 'today' | 'all' = 'all', { rejectWithValue }) => {
    try {
      const res = await ordersService.getOrders(range);
      return res.data.data as OrdersResponseData;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to load orders.'));
    }
  }
);

/**
 * Fetches aggregate order stats from the API and normalizes the raw
 * revenue string into a number.
 */
export const fetchOrderStats = createAsyncThunk('orders/fetchOrderStats', async (_: void, { rejectWithValue }) => {
  try {
    const res = await ordersService.getOrderStats();
    const raw = res.data.data as RawOrderStats;
    return { ...raw, approvedRevenue: Number(raw.approvedRevenue) || 0 } as OrderStats;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to load order stats.'));
  }
});

/**
 * Approves or rejects an order via the API and returns its order number so
 * the caller can refresh the affected list.
 */
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

/**
 * Confirms or denies stock availability for an order via the API and
 * returns its order number so the caller can refresh the affected list.
 */
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

/**
 * Confirms or denies stock availability per line item for a multi-product
 * "basket" order via the API and returns its order number so the caller can
 * refresh the affected list — the multi-item counterpart to
 * `confirmOrderStock` above, used when an order has line items instead of a
 * single part.
 */
export const confirmOrderStockItems = createAsyncThunk(
  'orders/confirmOrderStockItems',
  async (
    { number, items }: { number: string; items: { itemId: number; available: boolean }[] },
    { rejectWithValue }
  ) => {
    try {
      await ordersService.confirmOrderStockItems(number, items);
      return number;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to confirm stock for the selected items.'));
    }
  }
);

/**
 * Cancels an order via the API and returns its order number so the caller
 * can refresh the affected list.
 */
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

/**
 * Updates each order bucket in state only if its normalized contents
 * actually differ from what's already there, avoiding needless re-renders
 * from the 15s polling refresh.
 */
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
      /** Marks the orders fetch as in progress. */
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      /** Applies the fetched order groups to state, only replacing groups whose contents actually changed. */
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<OrdersResponseData>) => {
        state.status = 'succeeded';
        state.error = null;
        applyIfChanged(state, action.payload);
      })
      /** Records the error message when the orders fetch fails. */
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load orders.';
      })
      /** Marks the order stats fetch as in progress. */
      .addCase(fetchOrderStats.pending, (state) => {
        state.statsStatus = 'loading';
      })
      /** Stores the fetched order stats on success. */
      .addCase(fetchOrderStats.fulfilled, (state, action: PayloadAction<OrderStats>) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      /** Marks the order stats fetch as failed. */
      .addCase(fetchOrderStats.rejected, (state) => {
        state.statsStatus = 'failed';
      });
  },
});

export default ordersSlice.reducer;
