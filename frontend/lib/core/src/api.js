import axios from 'axios';
import { clearAuth } from './auth.js';

// The app registers how to react to a 401 (e.g. redirect to /auth). Keeps this
// core module free of any app/router dependency.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export default api;
