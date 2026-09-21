// Shared date helpers. The API exchanges dates as 'YYYY-MM-DD' strings;
// everything here treats them as LOCAL dates (new Date('YYYY-MM-DD') is UTC
// and shifts a day back for users west of UTC, corrupting dates on each edit).
//
// What is shown is written in the app's language by `Intl` — "5 Aug" in
// English, "5. Aug." in German, "8月5日" in Japanese — so a screen that reads
// these inside a computed follows a change of language.
import { localeTag } from './i18n.js';

const fmt = (opts) => new Intl.DateTimeFormat(localeTag(), opts);

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Date -> 'YYYY-MM-DD' (local).
export const toDateStr = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse a Date or 'YYYY-MM-DD' string into a local-midnight Date (timezone-safe).
export const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const diffInDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);

// '5 Aug' — the short display format used across the app.
export const formatDateShort = (d) => {
  if (!d) return '—';
  return fmt({ day: 'numeric', month: 'short' }).format(parseDate(d));
};

// 'Sat 5 Aug' — for a day of the trip, where the weekday is what people plan by.
export const formatDayDate = (d) => {
  if (!d) return '—';
  return fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(d));
};

/** The twelve months in the app's language, 'short' ("Aug") or 'long' ("August"). */
export const monthNames = (style = 'short') => {
  const f = fmt({ month: style });
  return Array.from({ length: 12 }, (_, m) => f.format(new Date(2026, m, 1)));
};

/** The seven weekdays in the app's language, Monday first, 'short' ("Mon") or 'narrow' ("M"). */
export const weekdayNames = (style = 'short') => {
  const f = fmt({ weekday: style });
  // 5 Jan 2026 is a Monday.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2026, 0, 5 + i)).replace(/\.$/, ''));
};

export const formatDateRange = (start, end) => {
  if (!start) return '';
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
};
