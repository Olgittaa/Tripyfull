// A route map as one image, drawn on a canvas from OpenStreetMap tiles.
//
// The printed plan wants a map on page two, the way a route book has one. A
// live Leaflet map is dozens of tile images and an SVG — fine on screen, a mess
// in print and lost in Word. One flat image survives both. Tiles are fetched in
// CORS mode, so the canvas stays readable and can be exported.

const TILE = 256;
const TILE_URL = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
// The app sends no referrer (index.html), but OSM blocks tile requests without one.
const TILE_REFERRER = 'strict-origin-when-cross-origin';

// One colour for every stop: the printed book does not show ratings.
const STOP_COLOR = '#e35a38';
const TEAL = '#0e5c55';

const lonToX = (lon, z) => ((lon + 180) / 360) * TILE * 2 ** z;
const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * 2 ** z;
};

const CONCURRENCY = 6; // OSM asks for a gentle client; a burst of 50 gets throttled
const ATTEMPTS = 2;
const TIMEOUT_MS = 10000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** @returns {Promise<{image?: ImageBitmap, error?: string}>} */
async function loadTile(z, x, y) {
  let error = 'network';
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt) await sleep(600 * attempt);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(TILE_URL(z, x, y), {
        mode: 'cors',
        referrerPolicy: TILE_REFERRER,
        signal: ctrl.signal,
      });
      if (res.ok) return { image: await createImageBitmap(await res.blob()) };
      error = `HTTP ${res.status}`;
      if (res.status !== 429 && res.status < 500) break; // a retry will not help
    } catch (e) {
      error = e.name === 'AbortError' ? 'timeout' : 'network';
    } finally {
      clearTimeout(timer);
    }
  }
  return { error };
}

/** Runs `jobs` with at most CONCURRENCY in flight. */
async function runPool(jobs) {
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await job();
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
}

/**
 * @param {Array<{lat:number, lon:number, kind:'stop'|'hotel', dayNumber?:number}>} points
 *        in the order they are visited; the line follows it
 * @param {Array<[number, number]>} route  optional lat/lon pairs for the line (defaults to the points)
 * @returns {Promise<{dataUrl: string|null, tilesTotal: number, tilesMissing: number, reason?: string}|null>}
 *          `dataUrl` is a JPEG; null when most tiles are missing (a map of markers on a blank
 *          ground helps nobody), `reason` says why. The whole result is null without points.
 */
export async function buildRouteMap(points, { width = 1400, height = 1700, route = null } = {}) {
  const pts = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (!pts.length) return null;

  // Zoom: the largest at which the padded bounding box still fits the canvas.
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const pad = 0.12;
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLon = Math.min(...lons),
    maxLon = Math.max(...lons);
  let z = 16;
  for (; z > 2; z--) {
    const w = (lonToX(maxLon, z) - lonToX(minLon, z)) * (1 + 2 * pad);
    const h = (latToY(minLat, z) - latToY(maxLat, z)) * (1 + 2 * pad);
    if (w <= width && h <= height) break;
  }
  // A single point (or a tiny cluster) should not zoom into one street.
  z = Math.min(z, 13);

  const cx = (lonToX(minLon, z) + lonToX(maxLon, z)) / 2;
  const cy = (latToY(minLat, z) + latToY(maxLat, z)) / 2;
  const left = cx - width / 2;
  const top = cy - height / 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e9e4da';
  ctx.fillRect(0, 0, width, height);

  // Tiles covering the viewport, drawn as they arrive; a missing one leaves its square blank.
  const n = 2 ** z;
  const x0 = Math.floor(left / TILE),
    x1 = Math.floor((left + width) / TILE);
  const y0 = Math.floor(top / TILE),
    y1 = Math.floor((top + height) / TILE);
  const jobs = [];
  const failures = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      const tx = ((x % n) + n) % n;
      jobs.push(async () => {
        const { image, error } = await loadTile(z, tx, y);
        if (image) ctx.drawImage(image, x * TILE - left, y * TILE - top, TILE, TILE);
        else failures.push(error);
      });
    }
  }
  await runPool(jobs);
  const coverage = { tilesTotal: jobs.length, tilesMissing: failures.length };
  if (failures.length) coverage.reason = mostCommon(failures);
  if (failures.length > jobs.length / 2) return { dataUrl: null, ...coverage };

  // Streets are loud under coloured markers; the same muting the app's maps use.
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(0, 0, width, height);

  const toPx = (lat, lon) => [lonToX(lon, z) - left, latToY(lat, z) - top];

  // The route, day by day, as one line.
  const line = route || pts.map((p) => [p.lat, p.lon]);
  if (line.length > 1) {
    ctx.beginPath();
    line.forEach(([lat, lon], i) => {
      const [x, y] = toPx(lat, lon);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = 'rgba(14,92,85,0.85)';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Markers: hotels as squares, places as dots.
  for (const p of pts) {
    const [x, y] = toPx(p.lat, p.lon);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    if (p.kind === 'hotel') {
      ctx.fillStyle = TEAL;
      ctx.fillRect(x - 12, y - 12, 24, 24);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 12, y - 12, 24, 24);
    } else {
      const r = 12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = STOP_COLOR;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }
  // Day numbers at each day's first stop, so the map reads with the overview.
  ctx.shadowBlur = 0;
  ctx.font = 'bold 22px "Hanken Grotesk", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const seenDays = new Set();
  for (const p of pts) {
    if (!p.dayNumber || seenDays.has(p.dayNumber)) continue;
    seenDays.add(p.dayNumber);
    const [x, y] = toPx(p.lat, p.lon);
    ctx.beginPath();
    ctx.arc(x + 22, y - 22, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = TEAL;
    ctx.fillText(String(p.dayNumber), x + 22, y - 21);
  }

  // Attribution is the one condition of using the tiles.
  ctx.font = '18px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const label = '© OpenStreetMap contributors';
  const w = ctx.measureText(label).width + 20;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(width - w, height - 30, w, 30);
  ctx.fillStyle = '#322a24';
  ctx.fillText(label, width - 10, height - 7);

  // JPEG: a map of tiles is photographic enough, and it keeps the document
  // (and the .doc made from it) several times smaller than PNG would.
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.82), ...coverage };
}

function mostCommon(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
