import { ref, reactive } from 'vue';
import { setLocale, matchLocale } from './i18n.js';

export const username = ref(localStorage.getItem('username'));
/* Set by the sign-in form when the account is brand new; the shell watches it
   to open the how-to once, and clears it. Not stored: "just registered" is a
   moment, and a reload has already passed it. */
export const justRegistered = ref(false);
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

// The language the app opens in: the account's, once one has signed in here;
// otherwise the browser's, as far as we speak it.
setLocale(
  localStorage.getItem('userPrefs')
    ? prefs.language
    : matchLocale(typeof navigator !== 'undefined' ? navigator.language : 'en'),
);

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
    if (settings.language) prefs.language = setLocale(settings.language);
    if (settings.region != null) prefs.region = settings.region || '';
    if (settings.dateFormat) prefs.dateFormat = settings.dateFormat;
    if (settings.timeFormat) prefs.timeFormat = settings.timeFormat;
    savePrefs();
  }
}

/**
 * Re-reads the account when the app starts with a token already in hand. Without
 * it the settings are whatever the last sign-in wrote into this browser: changed
 * on a laptop, they never reach the phone, and a browser that was never signed
 * in to shows the defaults.
 */
export async function refreshSettings(api) {
  if (!localStorage.getItem('token')) return;
  try {
    const { data } = await api.get('/api/auth/me');
    setAuth(null, data.username, data);
  } catch {
    // An expired session is the session layer's business, not ours.
  }
}

export function updateSettings(settings) {
  if (settings.baseCurrency) {
    localStorage.setItem('baseCurrency', settings.baseCurrency);
    baseCurrency.value = settings.baseCurrency;
  }
  if (settings.language) prefs.language = setLocale(settings.language);
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
  // Signed out, the app speaks the browser's language again.
  setLocale(matchLocale(typeof navigator !== 'undefined' ? navigator.language : 'en'));
}
