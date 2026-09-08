import axios from 'axios';
import { clearAuth } from './auth.js';

/* The app registers how to recover an expired session: it shows a sign-in
   dialog (or leaves for /auth) and resolves true once the user is back in,
   false if they gave up. Keeps this core module free of any app/router
   dependency. */
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}
// One dialog no matter how many requests fail at once.
let reauthenticating = null;

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

/* A 401 means the session is gone, not that the request was wrong: ask for a
   new sign-in and replay the request afterwards, so nothing on the page is
   lost. Sign-in and register answer for themselves. */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const recoverable =
      response?.status === 401 &&
      config &&
      !config.sessionRetry &&
      !String(config.url || '').includes('/api/auth/');
    if (!recoverable) return Promise.reject(error);
    if (!onUnauthorized) {
      clearAuth();
      return Promise.reject(error);
    }
    config.sessionRetry = true;
    reauthenticating ??= Promise.resolve()
      .then(() => onUnauthorized())
      .finally(() => {
        reauthenticating = null;
      });
    const signedIn = await reauthenticating;
    if (!signedIn) return Promise.reject(error);
    return api(config); // the request interceptor attaches the fresh token
  },
);

export default api;
