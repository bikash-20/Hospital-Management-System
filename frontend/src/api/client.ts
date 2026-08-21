import axios from 'axios';

// In Docker (nginx), /api is proxied to the backend — use same origin.
// In dev mode, Vite proxy handles it via /api directly.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly auth cookies on every request. Without this, the browser
  // would never include the access/refresh cookies set by the backend.
  withCredentials: true,
});

// Response interceptor — try a silent refresh on 401, retry once, then give up.
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
    await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    return true;
  } catch {
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

    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const ok = await attemptRefresh();
        isRefreshing = false;
        notifyRefreshed(ok);
        if (!ok) {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        // Another request is already refreshing — wait for it.
        const ok = await new Promise<boolean>((resolve) => subscribeRefresh(resolve));
        if (!ok) {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      // Retry the original request — the fresh access cookie will now be sent.
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;