import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:4000/v1';
const API_URL = /^https?:\/\//i.test(rawApiUrl) ? rawApiUrl : `https://${rawApiUrl.replace(/^\/+/, '')}`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Attaches the stored access token (from localStorage or sessionStorage)
 * as a Bearer Authorization header on every outgoing request, if present.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth');
      if (raw) {
        try {
          const { tokens } = JSON.parse(raw);
          if (tokens?.access?.token) {
            config.headers.Authorization = `Bearer ${tokens.access.token}`;
          }
        } catch {
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

interface StoredAuth {
  admin: unknown;
  tokens: { access: { token: string }; refresh: { token: string } };
}

/**
 * Reads the persisted auth blob from whichever storage currently holds it
 * (rememberMe decides local vs. session at login time), so a token refresh
 * can rewrite just the access token in place without guessing which one to use.
 */
function readAuthStorage(): { data: StoredAuth | null; storage: Storage | null } {
  if (typeof window === 'undefined') return { data: null, storage: null };
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem('auth');
    if (raw) {
      try {
        return { data: JSON.parse(raw) as StoredAuth, storage };
      } catch {
        return { data: null, storage: null };
      }
    }
  }
  return { data: null, storage: null };
}

let isRedirectingToLogin = false;

/**
 * Clears the stored session and redirects to the login page (showing a
 * brief loading overlay), guarding against triggering more than one redirect
 * at a time.
 */
function redirectToLogin(): void {
  if (isRedirectingToLogin || typeof window === 'undefined') return;
  isRedirectingToLogin = true;
  localStorage.removeItem('auth');
  sessionStorage.removeItem('auth');

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#fff;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="width:32px;height:32px;border-radius:50%;border:4px solid var(--primary, #004060);border-top-color:transparent;animation:_auth_spin 0.7s linear infinite"></div>' +
    '<style>@keyframes _auth_spin{to{transform:rotate(360deg)}}</style>';
  document.body.appendChild(overlay);

  window.location.replace('/login');
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for a new access token, rewriting it
 * into whichever storage holds the session. Concurrent 401s share the same
 * in-flight exchange instead of each firing their own `/admin/refresh` call.
 * Returns null (never throws) if there's no refresh token stored or the
 * exchange itself fails, so callers can fall back to a full logout.
 */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { data, storage } = readAuthStorage();
      const refreshToken = data?.tokens?.refresh?.token;
      if (!refreshToken || !storage) return null;

      try {
        const res = await api.post('/admin/refresh', { refreshToken });
        const newAccessToken = res.data.accessToken as string;
        data.tokens.access.token = newAccessToken;
        storage.setItem('auth', JSON.stringify(data));
        return newAccessToken;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * On a 401 from any request other than login/refresh/change-password,
 * silently exchanges the refresh token for a new access token and retries
 * the original request once. Only falls back to clearing the session and
 * redirecting to /login if there's no refresh token to use, the exchange
 * itself fails (expired/revoked refresh token), or the retried request 401s
 * again — so a customer-facing access-token expiry (1h default) no longer
 * forces a re-login on its own.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config;
    const url: string = config?.url ?? '';
    const isAuthEndpoint =
      url.includes('/admin/login') || url.includes('/admin/refresh') || url.includes('/admin/change/password');

    if (status === 401 && !isAuthEndpoint && config && !config._retried) {
      config._retried = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);
