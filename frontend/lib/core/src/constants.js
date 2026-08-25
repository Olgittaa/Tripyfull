// Shared domain constants — single source for labels/tones/icons that were
// previously copy-pasted per view. Values mirror the backend enums.

export const TRIP_STATUS_META = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PLANNED: { label: 'Planned', tone: 'gold' },
  ACTIVE: { label: 'Active', tone: 'brand' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

export const tripStatusLabel = (s) => TRIP_STATUS_META[s]?.label ?? s;
export const tripStatusTone = (s) => TRIP_STATUS_META[s]?.tone ?? 'neutral';

// Per-place-type label + icon + warm color, matching the Tripyfull category styling.
export const PLACE_TYPE_META = {
  SIGHTSEEING: {
    label: 'Sightseeing',
    emoji: '🏛',
    bg: 'var(--success-100)',
    color: 'var(--accent)',
  },
  BEACH: { label: 'Beach', emoji: '🏖', bg: 'var(--warning-100)', color: 'var(--warning-300)' },
  NATURE: { label: 'Nature', emoji: '🌿', bg: 'var(--success-100)', color: 'var(--success-300)' },
  RESTAURANT: {
    label: 'Restaurant',
    emoji: '🍽',
    bg: 'var(--warning-100)',
    color: 'var(--warning-300)',
  },
  MUSEUM: { label: 'Museum', emoji: '🏺', bg: 'var(--danger-100)', color: 'var(--accent)' },
  VIEWPOINT: {
    label: 'Viewpoint',
    emoji: '🌄',
    bg: 'var(--warning-100)',
    color: 'var(--warning-500)',
  },
  PORT: { label: 'Port', emoji: '⛴', bg: 'var(--success-100)', color: 'var(--accent)' },
  AIRPORT: { label: 'Airport', emoji: '✈️', bg: 'var(--success-100)', color: 'var(--accent)' },
  NEIGHBORHOOD: {
    label: 'Neighborhood',
    emoji: '🏘',
    bg: 'var(--danger-100)',
    color: 'var(--accent)',
  },
  PARK: { label: 'Park', emoji: '🌳', bg: 'var(--success-100)', color: 'var(--success-300)' },
  SHOP: { label: 'Shop', emoji: '🛍', bg: 'var(--danger-100)', color: 'var(--danger-500)' },
  OTHER: { label: 'Other', emoji: '📍', bg: 'var(--surface)', color: 'var(--ink-500)' },
};

export const placeTypeMeta = (t) => PLACE_TYPE_META[t] || PLACE_TYPE_META.OTHER;

export const PLACE_TYPE_OPTIONS = Object.entries(PLACE_TYPE_META).map(([value, m]) => ({
  label: m.label,
  value,
}));
