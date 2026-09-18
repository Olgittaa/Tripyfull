// The photos the printed book carries.
//
// On screen a place shows the biggest picture it has: Google serves its own
// around 1200 px wide, our uploads are kept at 1600. Paper needs none of that.
// A stop's picture is printed 82 mm wide and the cover's largest one 170 mm, so
// past ~1000 px nothing more reaches the page — but every one of those bytes
// reaches the PDF, and a book of twenty stops built from the originals is the
// several-megabyte file a consultant then has to email to a client.
//
// So each picture is loaded once, redrawn no larger than the page can show and
// re-encoded as a JPEG — kept only when that actually saves bytes, since a small
// picture re-encoded can come back heavier. Either way the document carries the
// picture inside itself, which also frees the file from the server: the .doc used
// to point at /api/place-photos/…, which a client opening it at home cannot reach.

/**
 * The longest edge a printed photo keeps. The largest a book ever shows one is
 * the cover's single picture across the full 170 mm column — 150 dpi at this
 * size; every other use is half that width or less, so 250 dpi and up.
 */
export const PRINT_EDGE = 1000;

/**
 * JPEG quality for the re-encode. Photographs stand up to it; the route map is
 * built elsewhere and kept higher, because a map is mostly small lettering.
 */
export const PRINT_QUALITY = 0.72;

/** Absolute URL for a stored photo, so the document works outside the app too. */
export const photoUrl = (path, apiBase) =>
  !path ? null : path.startsWith('/') ? apiBase + path : path;

/** Every photo URL the export mentions, absolute — feed for bakePhotos. */
export function collectPhotoUrls(d, apiBase = '') {
  const out = [];
  for (const day of d.days || []) {
    for (const a of day.activities || []) {
      for (const p of a.placePhotos || []) out.push(photoUrl(p, apiBase));
    }
  }
  for (const p of d.places || []) for (const u of p.photos || []) out.push(photoUrl(u, apiBase));
  return out;
}

/**
 * Resolves with the loaded image, or null when it does not render in time. A
 * photo that is slow past the timeout counts as missing — better one picture
 * fewer than a document that waits on a dead host.
 */
function loadImage(url, { shared, timeoutMs }) {
  return new Promise((resolve) => {
    const img = new Image();
    // Reading pixels back out of a canvas needs the host's permission, and
    // asking for it is the whole difference between a shrunk photo and a link.
    if (shared) img.crossOrigin = 'anonymous';
    let timer = null;
    const done = (ok) => {
      clearTimeout(timer);
      resolve(ok && img.naturalWidth > 1 ? img : null);
    };
    timer = setTimeout(() => done(false), timeoutMs);
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = url;
  });
}

/** How many bytes a data URL carries: base64 spends 4 characters on every 3. */
const bytesOf = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

/**
 * The bytes behind a URL, normally straight out of the cache the <img> has just
 * filled; null when they cannot be read.
 */
async function fetchBytes(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

/** A blob as a data URL, so the document can carry it; null if it cannot be read. */
const asDataUrl = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

/** The image as a JPEG data URL, no longer than `maxEdge` on its long side. */
function shrink(img, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  // Paper is white, and a JPEG has no transparency to keep: a PNG drawn on the
  // bare canvas would come out on black.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Loads each URL once and answers with what the document should print for it:
 * a data URL when the picture could be shrunk, the URL itself when the host
 * shares its bytes with nobody, and nothing at all when it does not render.
 *
 * @returns {Promise<Map<string, string>>} keyed by the URL that was asked for
 */
export function bakePhotos(
  urls,
  { maxEdge = PRINT_EDGE, quality = PRINT_QUALITY, timeoutMs = 5000 } = {},
) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    unique.map(async (url) => {
      const img = await loadImage(url, { shared: true, timeoutMs });
      if (img) {
        let smaller;
        try {
          smaller = shrink(img, maxEdge, quality);
        } catch {
          // The canvas was tainted after all; the link still prints.
          return [url, url];
        }
        // Not every redraw is a saving: a picture already smaller than the page,
        // or one this browser's JPEG encoder is gentle with — Safari's is much
        // gentler than Chrome's at the same setting — can come back heavier than
        // it went in. The book takes whichever of the two weighs less.
        const original = await fetchBytes(url);
        if (original && original.size < bytesOf(smaller)) {
          return [url, (await asDataUrl(original)) || smaller];
        }
        return [url, smaller];
      }
      // A host that will not share its bytes refuses the load itself. Ask again
      // the plain way, so a picture that renders is printed, just at its own size.
      const plain = await loadImage(url, { shared: false, timeoutMs });
      return plain ? [url, url] : null;
    }),
  ).then((pairs) => new Map(pairs.filter(Boolean)));
}
