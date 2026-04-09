import axios from 'axios';
import { tokenStore } from '../utils/tokenStore';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://estadia-production-60af.up.railway.app/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject access token from in-memory store on every request (never from localStorage)
apiClient.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear in-memory + sessionStorage tokens and redirect to login
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
