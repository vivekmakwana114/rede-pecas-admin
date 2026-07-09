import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { login, getProfile } from './authService';

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface AuthTokens {
  access: { token: string };
  refresh: { token: string };
}

interface AuthState {
  admin: AdminProfile | null;
  tokens: AuthTokens | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

interface LoginResponsePayload {
  data: { admin: AdminProfile };
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}

interface ProfileResponsePayload {
  data: { admin: AdminProfile };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (
    { email, password, rememberMe }: { email: string; password: string; rememberMe: boolean },
    { rejectWithValue },
  ) => {
    try {
      const res = await login({ email, password });
      return { ...res.data, rememberMe } as LoginResponsePayload;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Incorrect email or password.'));
    }
  },
);

export const fetchAdminProfile = createAsyncThunk('auth/fetchAdminProfile', async (_: void, { rejectWithValue }) => {
  try {
    const res = await getProfile();
    return res.data as ProfileResponsePayload;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to fetch profile.'));
  }
});

function readStoredAuth(): { admin: AdminProfile | null; tokens: AuthTokens | null } {
  if (typeof window === 'undefined') {
    return { admin: null, tokens: null };
  }
  const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
  if (!raw) {
    return { admin: null, tokens: null };
  }
  try {
    const parsed = JSON.parse(raw);
    return { admin: parsed.admin ?? null, tokens: parsed.tokens ?? null };
  } catch {
    return { admin: null, tokens: null };
  }
}

const initialState: AuthState = { ...readStoredAuth(), status: 'idle', error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.admin = null;
      state.tokens = null;
      state.status = 'idle';
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
        sessionStorage.removeItem('auth');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponsePayload>) => {
        const { rememberMe, data, accessToken, refreshToken } = action.payload;

        state.status = 'succeeded';
        state.admin = data.admin;
        state.tokens = { access: { token: accessToken }, refresh: { token: refreshToken } };

        if (typeof window !== 'undefined') {
          const authData = JSON.stringify({ admin: state.admin, tokens: state.tokens });
          if (rememberMe) {
            localStorage.setItem('auth', authData);
            sessionStorage.removeItem('auth');
          } else {
            sessionStorage.setItem('auth', authData);
            localStorage.removeItem('auth');
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Incorrect email or password.';
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action: PayloadAction<ProfileResponsePayload>) => {
        state.admin = action.payload.data.admin;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
