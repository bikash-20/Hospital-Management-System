import axios from 'axios';

// In Docker (nginx), /api is proxied to the backend — use same origin.
// In dev mode, Vite proxy handles it via /api directly.
const API_BASE = import.meta.env.VITE_API_URL || '';

export const ACCESS_TOKEN_KEY = 'carebridge_access_token';
export const REFRESH_TOKEN_KEY = 'carebridge_refresh_token';

export function setAuthTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly auth cookies on every request when supported by the browser.
  withCredentials: true,
});

// Request interceptor: attach Bearer token from localStorage for bulletproof cross-origin support
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — try a silent refresh on 401/unauthorized 403, retry once, then redirect.
let isRefreshing = false;
let refreshSubscribers: Array<(ok: boolean) => void> = [];

function subscribeRefresh(cb: (ok: boolean) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshed(ok: boolean) {
  refreshSubscribers.forEach((cb) => cb(ok));
  refreshSubscribers = [];
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      refreshToken ? { refreshToken } : {},
      { withCredentials: true },
    );
    if (data?.accessToken) {
      setAuthTokens(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    clearAuthTokens();
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Skip refresh handling for the auth endpoints themselves (avoid infinite loop).
    const url: string = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    // Handle 401 or 403 when unauthenticated/token expired
    const isAuthFailure =
      status === 401 ||
      (status === 403 && (!getAccessToken() || error.response?.data?.error === 'UNAUTHORIZED'));

    if (isAuthFailure && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const ok = await attemptRefresh();
        isRefreshing = false;
        notifyRefreshed(ok);
        if (!ok) {
          clearAuthTokens();
          if (!window.location.pathname.startsWith('/public') && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } else {
        // Another request is already refreshing — wait for it.
        const ok = await new Promise<boolean>((resolve) => subscribeRefresh(resolve));
        if (!ok) {
          clearAuthTokens();
          if (!window.location.pathname.startsWith('/public') && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      // Retry the original request with the fresh access token
      const freshToken = getAccessToken();
      if (freshToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
      }
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;