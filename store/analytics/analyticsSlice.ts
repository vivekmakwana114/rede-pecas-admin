import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as analyticsService from './analyticsService';

export type AnalyticsPeriod = 'daily' | 'monthly' | 'yearly';

// NOTE: GET /admin/orders/analytics is not a confirmed endpoint yet — there's
// no real backend support for period-bucketed history (GET /admin/orders only
// returns today's live pending/approved/rejected/stockConfirmation snapshot,
// with no per-order date). This assumes the backend will do the bucketing
// server-side and return one point per hour/day/month depending on `period`.
// `label` is whatever the backend wants on the X axis ("08:00", "12 Mar", "Jun").
interface RawAnalyticsPoint {
  label: string;
  revenue: string;
  pending: number;
  approved: number;
  rejected: number;
  stockConfirmation: number;
}

export interface AnalyticsPoint {
  label: string;
  revenue: number;
  pending: number;
  approved: number;
  rejected: number;
  stockConfirmation: number;
}

interface AnalyticsState {
  period: AnalyticsPeriod;
  points: AnalyticsPoint[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AnalyticsState = {
  period: 'daily',
  points: [],
  status: 'idle',
  error: null,
};

function toPoint(raw: RawAnalyticsPoint): AnalyticsPoint {
  return { ...raw, revenue: Number(raw.revenue) || 0 };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const fetchOrderAnalytics = createAsyncThunk(
  'analytics/fetchOrderAnalytics',
  async (period: AnalyticsPeriod, { rejectWithValue }) => {
    try {
      const res = await analyticsService.getOrderAnalytics(period);
      const points = (res.data.data.points as RawAnalyticsPoint[]).map(toPoint);
      return { period, points };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to load analytics.'));
    }
  },
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPeriod(state, action: PayloadAction<AnalyticsPeriod>) {
      state.period = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrderAnalytics.fulfilled, (state, action: PayloadAction<{ period: AnalyticsPeriod; points: AnalyticsPoint[] }>) => {
        state.status = 'succeeded';
        state.error = null;
        state.period = action.payload.period;
        state.points = action.payload.points;
      })
      .addCase(fetchOrderAnalytics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load analytics.';
      });
  },
});

export const { setPeriod } = analyticsSlice.actions;
export default analyticsSlice.reducer;
