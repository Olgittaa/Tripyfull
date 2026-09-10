// Photos come from two places: an external host (Google, Wikipedia, an imported
// link) or our own API, which stores uploads and serves them under a path.
// The stored ones arrive as a root-relative path, so they need the API origin.
const API_BASE = import.meta.env.VITE_API_URL || '';

/** Absolute src for a photo URL, whoever stores it. */
export function photoSrc(url) {
  if (!url) return url;
  return url.startsWith('/') ? API_BASE + url : url;
}
