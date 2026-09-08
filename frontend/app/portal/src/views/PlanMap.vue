<template>
  <div class="page-content page-content--full map-page">
    <div class="page-head">
      <div>
        <h1>Plan map</h1>
        <!-- Explanation, not data: on a phone its two lines go to the map. -->
        <p class="phone-hide">
          The skeleton of the trip: 5★ anchors first, lower ratings only along the route.
        </p>
      </div>
    </div>

    <!-- Rating layers + counters -->
    <div class="layer-row">
      <button
        v-for="l in RATING_LAYERS"
        :key="l.r"
        type="button"
        class="layer-chip"
        :class="{ 'is-off': !layersOn[l.r] }"
        @click="toggleLayer(l.r)"
      >
        <span
          :style="{
            width: l.size * 2 + 'px',
            height: l.size * 2 + 'px',
            borderRadius: '50%',
            background: l.color,
            display: 'inline-block',
            opacity: layersOn[l.r] ? 1 : 0.35,
          }"
        ></span>
        {{ l.r }}★ · {{ countByRating(l.r) }}
      </button>
      <!-- Planned places carry a day tag on the map; this narrows the map to them. -->
      <label class="layer-chip layer-toggle">
        <input type="checkbox" v-model="onlyPlanned" />
        <span>Planned only · {{ plannedCount }}</span>
      </label>
      <span class="base-switch">
        <button
          v-for="(cfg, key) in BASE_LAYERS"
          :key="key"
          type="button"
          class="base-switch-btn"
          :class="{ 'is-on': baseLayer === key }"
          @click="setBaseLayer(key)"
        >
          {{ cfg.label }}
        </button>
      </span>
      <span class="map-legend text-subtle text-sm">
        <span class="map-legend-swatch"></span>hotels from bookings
      </span>
    </div>

    <div v-if="loading" class="skeleton map-canvas"></div>
    <div
      v-show="!loading"
      ref="mapEl"
      class="map-canvas"
      :class="{ 'map-canvas--photo': baseLayer === 'satellite' }"
    ></div>
    <p
      v-if="!loading && !visiblePlaces.length"
      class="text-muted text-sm"
      style="margin-top: 10px; flex: none"
    >
      No places with coordinates match the current layers — add places in the
      <router-link to="/places">library</router-link> and rate them.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, formatDayDate, placeTypeMeta } from '@tripyfull/core';
import { toast } from '@tripyfull/ui';

const route = useRoute();
const router = useRouter();
const tripId = route.params.tripId;

const tripTitle = ref('');
const loading = ref(true);
const places = ref([]);
const hotels = ref([]); // bookings with coordinates

// Strategy colors: 5 red (anchor), 4 orange, 3 yellow, 2-1 grey dots.
const RATING_LAYERS = [
  { r: 5, color: '#dc2626', size: 11 },
  { r: 4, color: '#f97316', size: 9 },
  { r: 3, color: '#eab308', size: 7 },
  // Stone rather than pale grey: on a street map the light greys were invisible.
  { r: 2, color: '#78716c', size: 6 },
  { r: 1, color: '#a8a29e', size: 5 },
];
const layersOn = reactive({ 5: true, 4: true, 3: true, 2: true, 1: true });
const toggleLayer = (r) => (layersOn[r] = !layersOn[r]);

/* ---- Planned places: which day each one is already in ---- */
// The itinerary decides what is planned; the map only shows it. One place can be
// planned on several days (a market you go back to), so it is a list per place.
const planned = ref([]);
const onlyPlanned = ref(false);
const plannedByPlace = computed(() => {
  const m = new Map();
  for (const e of planned.value) {
    if (!m.has(e.placeId)) m.set(e.placeId, []);
    m.get(e.placeId).push(e);
  }
  return m;
});
const plansFor = (p) => plannedByPlace.value.get(p.id) || [];
const plannedCount = computed(() => mapped.value.filter((p) => plansFor(p).length).length);
/** "3" for one day, "3 · 5" for two; reserve days read as "R". */
const dayTag = (p) =>
  [...new Set(plansFor(p).map((e) => (e.buffer ? 'R' : String(e.dayNumber))))].join(' · ');
const dayLabel = (e) =>
  (e.buffer ? 'Reserve day' : `Day ${e.dayNumber}`) +
  (e.date ? ` · ${formatDayDate(e.date)}` : '') +
  (e.startTime ? ` · ${String(e.startTime).slice(0, 5)}` : '');

const mapped = computed(() => places.value.filter((p) => p.latitude && p.longitude));
const countByRating = (r) => mapped.value.filter((p) => (p.rating || 3) === r).length;
const visiblePlaces = computed(() =>
  mapped.value.filter((p) => layersOn[p.rating || 3] && (!onlyPlanned.value || plansFor(p).length)),
);

/* ---- Leaflet ---- */
// Keyless, free tile sources (attribution is the only requirement). CARTO's
// Voyager was calmer under coloured markers, but it now stamps "API KEY
// REQUIRED" over keyless tiles, so the map is OSM's own.
const BASE_LAYERS = {
  map: {
    label: 'Map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © <a href="https://www.esri.com" target="_blank">Esri</a>, Maxar',
    maxZoom: 19,
  },
};
const baseLayer = ref('map');
const mapEl = ref(null);
let map = null;
let L = null;
let baseTiles = null;

/** Swaps the tile layer in place, keeping markers and the current view. */
function applyBaseLayer() {
  if (!map || !L) return;
  const cfg = BASE_LAYERS[baseLayer.value];
  if (baseTiles) map.removeLayer(baseTiles);
  baseTiles = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom });
  baseTiles.addTo(map);
  baseTiles.bringToBack();
}

const setBaseLayer = (key) => {
  baseLayer.value = key;
  applyBaseLayer();
};
let lastBounds = [];
let resizeObserver = null;

async function initMap() {
  if (!L) {
    const mod = await import('leaflet');
    await import('leaflet/dist/leaflet.css');
    L = mod.default ?? mod;
  }
  await nextTick();
  if (map) {
    map.remove();
    map = null;
  }
  if (!mapEl.value) return;
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  // Popup content is plain HTML; the day links are routed by hand so the map
  // page is not reloaded.
  map.on('popupopen', (ev) => {
    ev.popup
      .getElement()
      ?.querySelectorAll('.day-link')
      .forEach((a) =>
        a.addEventListener('click', (e) => {
          e.preventDefault();
          router.push(`/trips/${tripId}/days/${a.dataset.day}`);
        }),
      );
  });
  applyBaseLayer();
  resizeObserver = new ResizeObserver(() => fitToBounds());
  resizeObserver.observe(mapEl.value);
  render();
}

function render() {
  if (!map || !L) return;
  // Size first: fitBounds on a hidden/unsized container locks the zoom at street level.
  map.invalidateSize();
  map.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker || layer instanceof L.Marker) map.removeLayer(layer);
  });

  const bounds = [];
  for (const p of visiblePlaces.value) {
    const layer = RATING_LAYERS.find((l) => l.r === (p.rating || 3)) || RATING_LAYERS[2];
    const plans = plansFor(p);
    const marker = plans.length
      ? // Planned: the same coloured dot, with the day number riding on it, so
        // "what is already in the plan" reads from the map alone.
        L.marker([p.latitude, p.longitude], {
          icon: L.divIcon({
            className: '',
            html:
              `<div class="day-pin" style="--dot:${layer.size * 2}px;--dot-color:${layer.color}">` +
              `<span class="day-pin-dot"></span><span class="day-pin-tag">${escapeHtml(dayTag(p))}</span></div>`,
            iconSize: [layer.size * 2, layer.size * 2],
            iconAnchor: [layer.size, layer.size],
            popupAnchor: [0, -layer.size],
          }),
          zIndexOffset: 500,
        })
      : L.circleMarker([p.latitude, p.longitude], {
          radius: layer.size,
          color: '#ffffff',
          weight: 2,
          fillColor: layer.color,
          fillOpacity: 1,
        });
    marker.bindPopup(
      `<b>${escapeHtml(p.name)}</b><br>` +
        `${placeTypeMeta(p.type).emoji} ${'★'.repeat(p.rating || 3)}${'☆'.repeat(5 - (p.rating || 3))}` +
        (p.visitMinutes ? ` · ~${p.visitMinutes} min` : '') +
        (p.ratingComment ? `<br><i>${escapeHtml(p.ratingComment)}</i>` : '') +
        plans
          .map(
            (e) =>
              `<br><a href="#" class="day-link" data-day="${e.dayId}">${escapeHtml(dayLabel(e))}</a>`,
          )
          .join('') +
        (plans.length ? '' : '<br><span class="popup-muted">Not planned yet</span>'),
    );
    marker.addTo(map);
    bounds.push([p.latitude, p.longitude]);
  }

  for (const h of hotels.value) {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#0e5c55;border-radius:4px;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px">⌂</div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
    const marker = L.marker([h.latitude, h.longitude], { icon });
    marker.bindPopup(`<b>${escapeHtml(h.name)}</b><br>hotel / stay`);
    marker.addTo(map);
    bounds.push([h.latitude, h.longitude]);
  }

  lastBounds = bounds;
  fitToBounds();
}

// fitBounds needs a real container size; when the pane/tab is hidden the size is 0
// and Leaflet locks the zoom at street level — so refit whenever the size appears.
function fitToBounds() {
  if (!map) return;
  map.invalidateSize();
  if (lastBounds.length > 1) map.fitBounds(lastBounds, { padding: [40, 40], maxZoom: 15 });
  else if (lastBounds.length === 1) map.setView(lastBounds[0], 12);
  else map.setView([20, 0], 2);
}

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

watch([visiblePlaces, hotels, planned], () => render());

onMounted(async () => {
  try {
    const [tripRes, placesRes, bookingsRes, plannedRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      // The trip's own shortlist — the plan map is about this trip, not the whole library.
      api.get('/api/places', { params: { tripId } }),
      api.get(`/api/trips/${tripId}/bookings`),
      api.get(`/api/trips/${tripId}/planned-places`).catch(() => ({ data: [] })),
    ]);
    planned.value = plannedRes.data || [];
    tripTitle.value = tripRes.data.title;
    places.value = placesRes.data;
    hotels.value = (bookingsRes.data || []).filter(
      (b) => b.category === 'ACCOMMODATION' && b.latitude && b.longitude,
    );
  } catch {
    toast.danger('Error', 'Failed to load the plan map');
  } finally {
    loading.value = false;
    await initMap();
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
/* The map is the page: it takes every pixel the chrome above it doesn't use,
   so nothing here scrolls. */
.map-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--topbar-height) - 2 * var(--page-pad));
}
/* Rating layers, the planned-only toggle, the basemap switch and the legend
   share one wrapping row above the map. */
.layer-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 16px;
}
.layer-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  /* The dot inside mirrors the marker's size on the map (22px for 5★, 10px for
     1★); the pill keeps one height whichever dot it carries. */
  min-height: 34px;
  padding: 5px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-primary);
  font: var(--fw-medium) 13px/1 var(--font-sans);
  cursor: pointer;
}
.layer-chip.is-off {
  background: var(--surface);
  color: var(--text-disabled);
}
.layer-toggle {
  margin-left: 4px;
}
.layer-toggle input {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: var(--primary);
  cursor: pointer;
}
.map-legend {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.map-legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--primary);
}
.base-switch {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  margin-left: 4px;
}
.base-switch-btn {
  border: none;
  background: none;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  cursor: pointer;
}
.base-switch-btn.is-on {
  background: var(--card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.map-canvas {
  flex: 1;
  min-height: 260px;
  margin-top: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  overflow: hidden;
  /* Leaflet stacks its panes at z-index 400+ and its controls at 1000. Kept
     inside a stacking context of their own they stay under the drawer (81)
     and the modal (90) — otherwise the map drew over the phone's trip menu. */
  isolation: isolate;
}

/* Muted streets under coloured markers: the plain OSM style puts every shop in
   colour, which competed with the rating dots. Satellite is left alone. */
.map-canvas :deep(.leaflet-tile-pane) {
  filter: saturate(0.5) contrast(0.9) brightness(1.06);
}
.map-canvas--photo :deep(.leaflet-tile-pane) {
  filter: none;
}
/* Lifts every dot off the tiles, whichever basemap is under it. */
.map-canvas :deep(path.leaflet-interactive) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

/* Leaflet injects the marker and popup markup outside Vue's reach. */
.map-canvas :deep(.day-pin) {
  position: relative;
  width: var(--dot);
  height: var(--dot);
}
.map-canvas :deep(.day-pin-dot) {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--dot-color);
  border: 1.5px solid #fff;
  box-sizing: border-box;
}
.map-canvas :deep(.day-pin-tag) {
  position: absolute;
  left: calc(100% - 4px);
  bottom: calc(100% - 4px);
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: #fff;
  font: var(--fw-semibold) 10px/1.4 var(--font-sans);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}
.map-canvas :deep(.day-link) {
  color: var(--primary);
  text-decoration: none;
  font-weight: var(--fw-medium);
}
.map-canvas :deep(.day-link:hover) {
  text-decoration: underline;
}
.map-canvas :deep(.popup-muted) {
  color: var(--text-secondary);
}

/* ---- Phones: last in the file, so these win over the rules above ----
   Thumb-sized controls, and the legend falls in beside the switch instead of
   hugging the far edge. */
@media (max-width: 700px) {
  .layer-row {
    gap: 6px;
    margin-top: 12px;
  }
  .layer-chip {
    min-height: 36px;
    padding: 0 12px;
  }
  .layer-toggle {
    margin-left: 0;
  }
  .base-switch-btn {
    padding: 9px 12px;
  }
  .map-legend {
    margin-left: 0;
  }
  .map-canvas {
    margin-top: 10px;
  }
}
</style>
