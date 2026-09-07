// Photos come from two places: an external host (Google, Wikipedia, an imported
// link) or our own API, which stores uploads and serves them under a path.
// The stored ones arrive as a root-relative path, so they need the API origin.
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Absolute src for a photo URL, whoever stores it. */
export function photoSrc(url) {
  if (!url) return url;
  return url.startsWith('/') ? API_BASE + url : url;
}

/**
 * Photo links known to be dead before any request is made. Google's older
 * `gps-cs-s` photo URLs answer 403 to everyone now; asking anyway only fills
 * the console with "Failed to load resource" for every card on the page.
 */
export function isDeadPhotoUrl(url) {
  return typeof url === 'string' && url.includes('googleusercontent.com/gps-cs-s/');
}
