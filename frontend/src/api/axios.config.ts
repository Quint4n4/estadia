import axios from 'axios';
import { tokenStore } from '../utils/tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Refresh mutex — prevents multiple simultaneous refresh calls ──────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Drains the queue of requests that arrived while a refresh was in flight.
 * If `error` is non-null every queued promise is rejected; otherwise each
 * one is resolved with the new access token so the original request can be
 * retried automatically.
 */
const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// ── Request interceptor: attach access token from memory ─────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStore.getAccess();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: silent token refresh on 401 ────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStore.getRefresh();

      if (!refreshToken) {
        // No refresh token available — nothing to try, go to login
        tokenStore.clear();
        sessionStorage.setItem('session_expired_msg', 'Tu sesión expiró. Por favor inicia sesión nuevamente.');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // ── Another refresh is already in flight — queue this request ────────
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      // ── This request wins the race — it performs the actual refresh ───────
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        axios
          .post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
          .then((response) => {
            const { access, refresh } = response.data;

            tokenStore.setAccess(access);
            if (refresh) tokenStore.setRefresh(refresh);

            originalRequest.headers['Authorization'] = `Bearer ${access}`;

            // Unblock all queued requests with the new token
            processQueue(null, access);

            resolve(apiClient(originalRequest));
          })
          .catch((err) => {
            // Refresh failed — reject every queued request and log out
            processQueue(err, null);
            tokenStore.clear();
            sessionStorage.setItem('session_expired_msg', 'Tu sesión expiró. Por favor inicia sesión nuevamente.');
            window.location.href = '/login';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
