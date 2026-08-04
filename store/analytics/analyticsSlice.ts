import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import * as analyticsService from './analyticsService';

export type AnalyticsPeriod = 'daily' | 'monthly' | 'yearly';

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

/**
 * Maps a raw analytics-point payload to the UI's AnalyticsPoint shape,
 * coercing revenue to a number.
 */
function toPoint(raw: RawAnalyticsPoint): AnalyticsPoint {
  return { ...raw, revenue: Number(raw.revenue) || 0 };
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
 * Fetches order analytics for a given period from the API, normalizes the
 * raw revenue strings into numbers, and returns the period/points pair for the reducer.
 */
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
    /** Sets the currently selected analytics period (daily/monthly/yearly). */
    setPeriod(state, action: PayloadAction<AnalyticsPeriod>) {
      state.period = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      /** Marks the analytics fetch as in progress. */
      .addCase(fetchOrderAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      /** Stores the fetched period and data points on success. */
      .addCase(fetchOrderAnalytics.fulfilled, (state, action: PayloadAction<{ period: AnalyticsPeriod; points: AnalyticsPoint[] }>) => {
        state.status = 'succeeded';
        state.error = null;
        state.period = action.payload.period;
        state.points = action.payload.points;
      })
      /** Records the error message when the analytics fetch fails. */
      .addCase(fetchOrderAnalytics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Failed to load analytics.';
      });
  },
});

export const { setPeriod } = analyticsSlice.actions;
export default analyticsSlice.reducer;
