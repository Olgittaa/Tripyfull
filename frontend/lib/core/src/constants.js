import { t } from './i18n.js';
// Shared domain constants — single source for labels/tones/icons that were
// previously copy-pasted per view. Values mirror the backend enums.

export const TRIP_STATUS_META = {
  DRAFT: { tone: 'neutral' },
  PLANNED: { tone: 'gold' },
  ACTIVE: { tone: 'brand' },
  COMPLETED: { tone: 'success' },
};

/** The status in the app's language — read inside a computed to follow a change. */
export const tripStatusLabel = (s) => (TRIP_STATUS_META[s] ? t(`status.${s}`) : s);
export const tripStatusTone = (s) => TRIP_STATUS_META[s]?.tone ?? 'neutral';

// Per-place-type icon + warm color, matching the Tripyfull category styling.
// The words are t()'s (placeTypeLabel), so no label lives here.
export const PLACE_TYPE_META = {
  SIGHTSEEING: {
    emoji: '🏛',
    bg: 'var(--success-100)',
    color: 'var(--accent)',
  },
  BEACH: { emoji: '🏖', bg: 'var(--warning-100)', color: 'var(--warning-300)' },
  NATURE: { emoji: '🌿', bg: 'var(--success-100)', color: 'var(--success-300)' },
  RESTAURANT: {
    emoji: '🍽',
    bg: 'var(--warning-100)',
    color: 'var(--warning-300)',
  },
  MUSEUM: { emoji: '🏺', bg: 'var(--danger-100)', color: 'var(--accent)' },
  VIEWPOINT: {
    emoji: '🌄',
    bg: 'var(--warning-100)',
    color: 'var(--warning-500)',
  },
  PORT: { emoji: '⛴', bg: 'var(--success-100)', color: 'var(--accent)' },
  AIRPORT: { emoji: '✈️', bg: 'var(--success-100)', color: 'var(--accent)' },
  NEIGHBORHOOD: {
    emoji: '🏘',
    bg: 'var(--danger-100)',
    color: 'var(--accent)',
  },
  PARK: { emoji: '🌳', bg: 'var(--success-100)', color: 'var(--success-300)' },
  SHOP: { emoji: '🛍', bg: 'var(--danger-100)', color: 'var(--danger-500)' },
  OTHER: { emoji: '📍', bg: 'var(--surface)', color: 'var(--ink-500)' },
};

export const placeTypeMeta = (type) => PLACE_TYPE_META[type] || PLACE_TYPE_META.OTHER;

/** A place's kind in the app's language — read inside a computed to follow a change. */
export const placeTypeLabel = (type) =>
  PLACE_TYPE_META[type] ? t(`placeType.${type}`) : type || '';

/** What kinds of stop there are, in the order the type picker offers them. */
export const ACTIVITY_TYPES = [
  'SIGHTSEEING',
  'BEACH',
  'NATURE',
  'NEIGHBORHOOD',
  'RESTAURANT',
  'MEAL_STOP',
  'SHOPPING',
  'TRANSPORT',
  'ACCOMMODATION',
  'OTHER',
];

/** A stop's kind in the app's language — read inside a computed to follow a change. */
export const activityTypeLabel = (type) =>
  ACTIVITY_TYPES.includes(type) ? t(`activityType.${type}`) : type || '';

/** The ways from one stop to the next, as the leg row offers them; words come from t(). */
// The longest note the server keeps on a stop, a booking or a to-do (varchar(5000)).
export const NOTE_MAX = 5000;

export const TRAVEL_MODE_KEYS = ['foot', 'taxi', 'bus', 'train', 'car', 'boat'];
export const travelModeLabel = (key) => (TRAVEL_MODE_KEYS.includes(key) ? t(`travel.${key}`) : '');
export const travelModeHint = (key) =>
  TRAVEL_MODE_KEYS.includes(key) ? t(`travel.hint.${key}`) : '';

/** What kinds of place there are, in the order the pickers offer them. */
export const PLACE_TYPES = Object.keys(PLACE_TYPE_META);
