// The app's languages, without a library.
//
// `t('trips.new')` answers in the current language, falling back to English
// for a key a translation has not caught up with, and to the key itself when
// nobody has it — a missing word shows up on screen as its own name rather
// than as nothing. Plural forms lean on the browser's own `Intl.PluralRules`,
// so Russian's three shapes and Arabic's six need no code here; dates and
// numbers go through `Intl` too (see date.js). Reading `locale.value` inside
// `t()` is what makes every template re-render when the language changes.
//
// Scripts the design system's Latin fonts cannot draw get a Noto companion,
// loaded once when that language is first chosen, and slotted into the font
// stacks through `--font-script`. Arabic is written right to left inside its
// own lines; the layout itself still runs left to right — mirroring it is a
// task of its own.
import { ref } from 'vue';
import { messages } from './i18n/index.js';

/** The languages the app speaks, in the order the settings offer them. */
export const LOCALES = [
  { code: 'en', label: 'English', tag: 'en-GB' },
  { code: 'de', label: 'Deutsch', tag: 'de' },
  { code: 'es', label: 'Español', tag: 'es' },
  { code: 'pt', label: 'Português', tag: 'pt-BR' },
  { code: 'ru', label: 'Русский', tag: 'ru' },
  { code: 'ja', label: '日本語', tag: 'ja', font: 'Noto Sans JP' },
  { code: 'zh', label: '简体中文', tag: 'zh-CN', font: 'Noto Sans SC' },
  { code: 'hi', label: 'हिन्दी', tag: 'hi', font: 'Noto Sans Devanagari' },
  { code: 'bn', label: 'বাংলা', tag: 'bn', font: 'Noto Sans Bengali' },
  { code: 'ar', label: 'العربية', tag: 'ar', font: 'Noto Sans Arabic' },
];

export const DEFAULT_LOCALE = 'en';

/** The current language's code. Read it in a computed to follow changes. */
export const locale = ref(DEFAULT_LOCALE);

const entryFor = (code) => LOCALES.find((l) => l.code === code);

/** The BCP 47 tag `Intl` wants for the current language ("en-GB", "zh-CN"). */
export const localeTag = () => entryFor(locale.value)?.tag ?? locale.value;

/**
 * The best of our languages for a browser's preference: "de-AT" → de,
 * "zh-Hans-CN" → zh, anything we do not have → English.
 */
export function matchLocale(preferred) {
  const wanted = String(preferred || '').toLowerCase();
  const base = wanted.split(/[-_]/)[0];
  return entryFor(base) ? base : DEFAULT_LOCALE;
}

const loadedFonts = new Set();

/** Fetches the Noto font a script needs, once, and points the font stacks at it. */
function applyFont(entry) {
  if (typeof document === 'undefined') return;
  const family = entry?.font;
  document.documentElement.style.setProperty(
    '--font-script',
    family ? `'${family}'` : 'sans-serif',
  );
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@300..800&display=swap`;
  document.head.appendChild(link);
}

/** Switches the language everywhere: templates, dates, the page's `lang`, the fonts. */
export function setLocale(code) {
  const next = messages[code] ? code : DEFAULT_LOCALE;
  locale.value = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = localeTag();
    applyFont(entryFor(next));
  }
  return next;
}

/**
 * The text for a key in the current language. `params` fill `{name}`
 * placeholders; `params.count` also picks the plural form when the entry is
 * one (`{ one: '{count} day', other: '{count} days' }`), and is written in
 * the language's own digits.
 */
export function t(key, params = {}) {
  const table = messages[locale.value] ?? messages[DEFAULT_LOCALE];
  let entry = table[key] ?? messages[DEFAULT_LOCALE][key];
  if (entry === undefined) return key;
  if (typeof entry === 'object') {
    const n = Number(params.count ?? 0);
    const form = new Intl.PluralRules(localeTag()).select(n);
    entry = entry[form] ?? entry.other ?? Object.values(entry)[0];
  }
  return entry.replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name];
    if (value === undefined) return `{${name}}`;
    return typeof value === 'number'
      ? new Intl.NumberFormat(localeTag()).format(value)
      : String(value);
  });
}
