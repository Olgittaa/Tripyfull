// Shared date helpers. The API exchanges dates as 'YYYY-MM-DD' strings;
// everything here treats them as LOCAL dates (new Date('YYYY-MM-DD') is UTC
// and shifts a day back for users west of UTC, corrupting dates on each edit).

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
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;
};

// 'Sat 5 Aug' — for a day of the trip, where the weekday is what people plan by.
export const formatDayDate = (d) => {
  if (!d) return '—';
  const dt = parseDate(d);
  return `${WEEKDAYS_SHORT[dt.getDay()]} ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;
};

export const formatDateRange = (start, end) => {
  if (!start) return '';
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
};
