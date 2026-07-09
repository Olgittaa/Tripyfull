import axios from 'axios';
import { clearAuth } from './auth.js';
import router from './router.js';

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
      const currentPath = router.currentRoute.value.fullPath;
      if (currentPath !== '/auth') {
        router.push({ path: '/auth', query: { redirect: currentPath } });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
