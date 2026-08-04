import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { login, getProfile, updateProfile, logout as logoutRequest } from './authService';

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
 * Logs an admin in via the auth API and returns the profile plus access/refresh
 * tokens (and the rememberMe flag) for the reducer to persist.
 */
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

/**
 * Fetches the current admin's profile from the API to refresh the stored admin data.
 */
export const fetchAdminProfile = createAsyncThunk('auth/fetchAdminProfile', async (_: void, { rejectWithValue }) => {
  try {
    const res = await getProfile();
    return res.data as ProfileResponsePayload;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err, 'Failed to fetch profile.'));
  }
});

/**
 * Updates the current admin's name/email via the API and returns the
 * refreshed profile for the reducer to store.
 */
export const updateAdminProfile = createAsyncThunk(
  'auth/updateAdminProfile',
  async (fields: { name?: string; email?: string }, { rejectWithValue }) => {
    try {
      const res = await updateProfile(fields);
      return res.data as ProfileResponsePayload;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to update the profile.'));
    }
  },
);

/**
 * Rewrites the persisted admin/tokens pair in whichever storage (local or
 * session) currently holds it, so an in-place profile edit survives a reload
 * instead of being overwritten by the stale copy on next app init.
 */
function persistAdmin(admin: AdminProfile, tokens: AuthTokens | null): void {
  if (typeof window === 'undefined') return;
  const authData = JSON.stringify({ admin, tokens });
  if (localStorage.getItem('auth')) {
    localStorage.setItem('auth', authData);
  } else if (sessionStorage.getItem('auth')) {
    sessionStorage.setItem('auth', authData);
  }
}

/**
 * Logs the admin out by revoking the stored refresh token on the server,
 * ignoring any errors from the request itself.
 */
export const logout = createAsyncThunk('auth/logout', async (_: void, { getState }) => {
  const { tokens } = (getState() as { auth: AuthState }).auth;
  try {
    await logoutRequest(tokens?.refresh.token);
  } catch {
  }
});

/**
 * Reads a previously-persisted admin/tokens pair from local or session
 * storage (for hydrating initial Redux state), returning nulls on the
 * server, when nothing's stored, or if the stored value is malformed.
 */
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      /** Clears the admin and tokens from state and storage after logout completes. */
      .addCase(logout.fulfilled, (state) => {
        state.admin = null;
        state.tokens = null;
        state.status = 'idle';
        state.error = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth');
          sessionStorage.removeItem('auth');
        }
      })
      /** Marks the login request as in progress and clears any previous error. */
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      /** Stores the logged-in admin and tokens, persisting them to local or session storage based on rememberMe. */
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
      /** Records the error message when login fails. */
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Incorrect email or password.';
      })
      /** Updates the stored admin profile once it's freshly fetched. */
      .addCase(fetchAdminProfile.fulfilled, (state, action: PayloadAction<ProfileResponsePayload>) => {
        state.admin = action.payload.data.admin;
      })
      /** Stores the freshly-edited admin profile and persists it alongside the existing tokens. */
      .addCase(updateAdminProfile.fulfilled, (state, action: PayloadAction<ProfileResponsePayload>) => {
        state.admin = action.payload.data.admin;
        persistAdmin(state.admin, state.tokens);
      });
  },
});

export default authSlice.reducer;
