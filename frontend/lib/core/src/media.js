// Photos come from two places: an external host (Google, Wikipedia, an imported
// link) or our own API, which stores uploads and serves them under a path.
// The stored ones arrive as a root-relative path, so they need the API origin.
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Absolute src for a photo URL, whoever stores it. */
export function photoSrc(url) {
  if (!url) return url;
  return url.startsWith('/') ? API_BASE + url : url;
}

/** A photo we store ourselves — uploaded by the user — as opposed to one found. */
export const isOwnPhoto = (url) => typeof url === 'string' && url.startsWith('/');

/**
 * The user's own uploads first, then what an import or an enrichment found;
 * order within each group as stored. A photo you took yourself is the one you
 * want to see on the card.
 */
export function ownPhotosFirst(list) {
  const photos = list || [];
  return [...photos.filter(isOwnPhoto), ...photos.filter((u) => !isOwnPhoto(u))];
}
