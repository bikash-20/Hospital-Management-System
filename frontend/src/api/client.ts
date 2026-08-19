import axios from 'axios';

// In Docker (nginx), /api is proxied to the backend — use same origin.
// In dev mode, Vite proxy handles it via /api directly.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE ? `${API_BASE}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('oh_token');
      localStorage.removeItem('oh_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
