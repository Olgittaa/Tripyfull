<template>
  <div class="page-content page-content--full map-page">
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">{{ tripTitle }}</div>
        <h1>Plan map</h1>
        <p>The skeleton of the trip: 5★ anchors first, lower ratings only along the route.</p>
      </div>
    </div>

    <!-- Rating layers + counters -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 16px">
      <button
        v-for="l in RATING_LAYERS"
        :key="l.r"
        type="button"
        :style="layerChipStyle(l)"
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
      <label class="save-place-toggle" style="margin-left: 4px">
        <input type="checkbox" v-model="onlyTripCountries" />
        <span>Trip countries only</span>
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
      <span class="text-subtle text-sm" style="margin-left: auto">
        <span
          style="
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 3px;
            background: #0e5c55;
            margin-right: 4px;
            vertical-align: -1px;
          "
        ></span
        >hotels from bookings
      </span>
    </div>

    <div v-if="loading" class="skeleton map-canvas"></div>
    <div v-show="!loading" ref="mapEl" class="map-canvas"></div>
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
import { useRoute } from 'vue-router';
import { api, placeTypeMeta } from '@tripyfull/core';
import { toast } from '@tripyfull/ui';

const route = useRoute();
const tripId = route.params.tripId;

const tripTitle = ref('');
const loading = ref(true);
const places = ref([]);
const hotels = ref([]); // bookings with coordinates
const tripCountries = ref([]);
const onlyTripCountries = ref(true);

// Strategy colors: 5 red (anchor), 4 orange, 3 yellow, 2-1 grey dots.
const RATING_LAYERS = [
  { r: 5, color: '#dc2626', size: 11 },
  { r: 4, color: '#f97316', size: 9 },
  { r: 3, color: '#eab308', size: 7 },
  { r: 2, color: '#9ca3af', size: 5 },
  { r: 1, color: '#d1d5db', size: 4 },
];
const layersOn = reactive({ 5: true, 4: true, 3: true, 2: true, 1: true });
const toggleLayer = (r) => (layersOn[r] = !layersOn[r]);

const layerChipStyle = (l) => ({
  padding: '7px 12px',
  borderRadius: '999px',
  border: '1px solid var(--border-default)',
  background: layersOn[l.r] ? 'var(--card)' : 'var(--surface)',
  color: layersOn[l.r] ? 'var(--text-primary)' : 'var(--text-disabled)',
  font: 'var(--fw-medium) 13px/1 var(--font-sans)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  cursor: 'pointer',
});

const inTripCountries = (p) =>
  !onlyTripCountries.value ||
  !tripCountries.value.length ||
  (p.country && tripCountries.value.includes(p.country.toUpperCase()));

const mapped = computed(() =>
  places.value.filter((p) => p.latitude && p.longitude && inTripCountries(p)),
);
const countByRating = (r) => mapped.value.filter((p) => (p.rating || 3) === r).length;
const visiblePlaces = computed(() => mapped.value.filter((p) => layersOn[p.rating || 3]));

/* ---- Leaflet ---- */
// Keyless, free tile sources (attribution is the only requirement).
// Voyager keeps local-language labels — Thai names read as they do on signs —
// and is calmer than raw OSM under coloured markers.
const BASE_LAYERS = {
  map: {
    label: 'Map',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20,
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
    const marker = L.circleMarker([p.latitude, p.longitude], {
      radius: layer.size,
      color: '#ffffff',
      weight: 1.5,
      fillColor: layer.color,
      fillOpacity: 0.92,
    });
    marker.bindPopup(
      `<b>${escapeHtml(p.name)}</b><br>` +
        `${placeTypeMeta(p.type).emoji} ${'★'.repeat(p.rating || 3)}${'☆'.repeat(5 - (p.rating || 3))}` +
        (p.visitMinutes ? ` · ~${p.visitMinutes} min` : '') +
        (p.ratingComment ? `<br><i>${escapeHtml(p.ratingComment)}</i>` : ''),
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

watch([visiblePlaces, hotels], () => render());

onMounted(async () => {
  try {
    const [tripRes, placesRes, bookingsRes, countriesRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get('/api/places'),
      api.get(`/api/trips/${tripId}/bookings`),
      api.get(`/api/trips/${tripId}/countries`).catch(() => ({ data: [] })),
    ]);
    tripTitle.value = tripRes.data.title;
    places.value = placesRes.data;
    tripCountries.value = (countriesRes.data || []).map((c) => String(c).toUpperCase());
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
}
</style>
