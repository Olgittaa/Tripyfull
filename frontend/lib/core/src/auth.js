import { ref, reactive } from 'vue';

export const username = ref(localStorage.getItem('username'));
export const baseCurrency = ref(localStorage.getItem('baseCurrency') || 'EUR');

const defaultPrefs = { language: 'en', region: '', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };

function loadPrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem('userPrefs') || '{}') };
  } catch {
    return { ...defaultPrefs };
  }
}

export const prefs = reactive(loadPrefs());

function savePrefs() {
  localStorage.setItem('userPrefs', JSON.stringify(prefs));
}

export function setAuth(token, user, settings) {
  if (token) localStorage.setItem('token', token);
  localStorage.setItem('username', user);
  username.value = user;
  if (settings) {
    if (settings.baseCurrency) {
      localStorage.setItem('baseCurrency', settings.baseCurrency);
      baseCurrency.value = settings.baseCurrency;
    }
    if (settings.language) prefs.language = settings.language;
    if (settings.region != null) prefs.region = settings.region || '';
    if (settings.dateFormat) prefs.dateFormat = settings.dateFormat;
    if (settings.timeFormat) prefs.timeFormat = settings.timeFormat;
    savePrefs();
  }
}

export function updateSettings(settings) {
  if (settings.baseCurrency) {
    localStorage.setItem('baseCurrency', settings.baseCurrency);
    baseCurrency.value = settings.baseCurrency;
  }
  if (settings.language) prefs.language = settings.language;
  if (settings.region != null) prefs.region = settings.region || '';
  if (settings.dateFormat) prefs.dateFormat = settings.dateFormat;
  if (settings.timeFormat) prefs.timeFormat = settings.timeFormat;
  savePrefs();
}

/**
 * When the stored token expires, in epoch milliseconds (null if there is no
 * token, or it carries no expiry). The payload is read, never trusted: the
 * server verifies the signature — this only lets the app ask for a new
 * sign-in the moment the old session dies, instead of after a failed request.
 */
export function tokenExpiresAt(token = localStorage.getItem('token')) {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('baseCurrency');
  localStorage.removeItem('userPrefs');
  username.value = null;
  baseCurrency.value = 'EUR';
  Object.assign(prefs, defaultPrefs);
}
