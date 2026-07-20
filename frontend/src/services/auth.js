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

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('baseCurrency');
  localStorage.removeItem('userPrefs');
  username.value = null;
  baseCurrency.value = 'EUR';
  Object.assign(prefs, defaultPrefs);
}
