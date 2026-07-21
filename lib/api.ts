import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:4000/v1';
const API_URL = /^https?:\/\//i.test(rawApiUrl) ? rawApiUrl : `https://${rawApiUrl.replace(/^\/+/, '')}`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
          // malformed storage — request goes out unauthenticated
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Guard against multiple simultaneous 401s each trying to redirect
let isRedirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    // A 401 from these endpoints is a domain-level answer the caller already
    // handles (bad credentials, wrong current password) — not proof the
    // session itself is dead, so it shouldn't force a global logout.
    const isAuthEndpoint =
      url.includes('/admin/login') || url.includes('/admin/refresh') || url.includes('/admin/change/password');

    if (status === 401 && !isAuthEndpoint && !isRedirectingToLogin && typeof window !== 'undefined') {
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

    return Promise.reject(error);
  },
);
