import { MODE_EMOJI } from '@tripyfull/core';

// How each kind of stop is drawn. The kinds themselves, and their names in the
// app's language, are core's (ACTIVITY_TYPES, activityTypeLabel) — this module
// stays free of Vue and of words.

export const typeIcon = (t) =>
  ({
    SIGHTSEEING: '\u{1F3DB}',
    BEACH: '\u{1F3D6}',
    NATURE: '\u{1F33F}',
    NEIGHBORHOOD: '\u{1F3D8}',
    RESTAURANT: '\u{1F37D}',
    MEAL_STOP: '\u2615',
    SHOPPING: '\u{1F6CD}',
    TRANSPORT: '\u{1F68C}',
    ACCOMMODATION: '\u{1F3E8}',
    OTHER: '\u{1F4CC}',
  })[t] ?? '\u{1F4CC}';

/** The tile's colours by kind. */
export const catStyle = (type) => {
  const styles = {
    SIGHTSEEING: { background: 'var(--success-100)', color: 'var(--success-300)' },
    BEACH: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    NATURE: { background: 'var(--success-100)', color: 'var(--accent)' },
    NEIGHBORHOOD: { background: 'var(--danger-100)', color: 'var(--accent)' },
    RESTAURANT: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    MEAL_STOP: { background: 'var(--warning-100)', color: 'var(--warning-500)' },
    SHOPPING: { background: 'var(--danger-100)', color: 'var(--danger-500)' },
    TRANSPORT: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACCOMMODATION: { background: 'var(--success-100)', color: 'var(--primary)' },
    OTHER: { background: 'var(--surface)', color: 'var(--ink-500)' },
  };
  return styles[type] || styles.OTHER;
};

/** A journey written from a booking shows what it travels by, not a generic bus. */
export const stopIcon = (a) =>
  (a.fromBooking && MODE_EMOJI[a.bookingTransportMode]) || typeIcon(a.type);

/** The kind of stop a saved place of a given type usually becomes. */
const PLACE_TO_ACT = {
  BEACH: 'BEACH',
  NATURE: 'NATURE',
  PARK: 'NATURE',
  RESTAURANT: 'RESTAURANT',
  SHOP: 'SHOPPING',
  MUSEUM: 'SIGHTSEEING',
  SIGHTSEEING: 'SIGHTSEEING',
  VIEWPOINT: 'SIGHTSEEING',
  NEIGHBORHOOD: 'NEIGHBORHOOD',
  PORT: 'TRANSPORT',
  AIRPORT: 'TRANSPORT',
  OTHER: 'OTHER',
};
export const placeToActivityType = (t) => PLACE_TO_ACT[t] || 'OTHER';
