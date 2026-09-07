<template>
  <div
    ref="el"
    class="booking-map"
    :class="{ 'booking-map--hidden': !hasMarkers }"
    :style="height ? { height: height + 'px' } : null"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  markers: { type: Array, default: () => [] },
  numbered: { type: Boolean, default: false }, // teal numbered pins + route line
  height: { type: Number, default: 0 },
  // [{ points: [[lat, lon], …], mode: 'foot'|'car' }] — one road geometry per leg
  // (foot dotted, car solid); falls back to a straight dashed line when absent.
  legs: { type: Array, default: null },
  // Context layer: saved places not planned yet — [{ id, lat, lon, label, sub, rating, note }].
  // Coloured by rating; excluded from fitBounds so the view stays on the route.
  dots: { type: Array, default: () => [] },
});
const emit = defineEmits(['dot-add', 'dot-hide']);

const el = ref(null);
let map = null;
let L = null;
let resizeObserver = null;

const hasMarkers = computed(
  () => props.markers.some((m) => m.lat && m.lon) || props.dots.some((d) => d.lat && d.lon),
);

const PIN_COLORS = { from: '#22c55e', to: '#ef4444', single: '#6366f1' };

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

/** Saved-place dot, sized and coloured by rating so must-sees read first.
    The two lowest ratings used to be near-white and vanished on the map; they
    are now muted stone rather than pale grey. */
const DOT_BY_RATING = {
  5: { size: 16, color: '#dc2626' },
  4: { size: 14, color: '#f97316' },
  3: { size: 12, color: '#eab308' },
  2: { size: 11, color: '#78716c' },
  1: { size: 10, color: '#a8a29e' },
};

/**
 * A dot the street map cannot swallow: white ring, dark hairline outside it, and
 * a size that grows as you zoom in — at street level a 12 px dot disappears
 * among the shop icons. The marker is anchored at a zero-size point and centred
 * by transform, so CSS may scale it without moving it off its coordinate.
 */
function dotIcon(rating) {
  const { size, color } = DOT_BY_RATING[rating] || DOT_BY_RATING[3];
  return L.divIcon({
    className: '',
    html: `<div class="place-dot" style="--dot-size:${size}px;--dot-color:${color}"></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -size / 2 - 2],
  });
}

const POPUP_BTN =
  'margin-top:6px;padding:3px 10px;border-radius:99px;background:#fff;font:600 12px/1.4 sans-serif;cursor:pointer';

function numberIcon(n) {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:#0e5c55;color:#fff;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font:700 12px/1 'JetBrains Mono',monospace">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

async function initMap() {
  if (!el.value || !hasMarkers.value) return;
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
  map = L.map(el.value, { zoomControl: false, attributionControl: true });
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  // Same keyless basemap as the plan map: local labels, calmer under markers.
  // OSM's own tiles: free and keyless. CARTO began stamping "API KEY REQUIRED"
  // over its keyless basemaps.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
  renderMarkers();
  // The map can be born inside a panel that is still animating open (width ~0),
  // and Leaflet caches that size — so follow the container.
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    // Dots grow with the zoom: the closer the view, the more detail competes.
    const applyDotScale = () => {
      const z = map.getZoom();
      el.value?.style.setProperty('--dot-scale', z >= 16 ? '1.6' : z >= 14 ? '1.3' : '1');
    };
    applyDotScale();
    // Both events: 'zoom' keeps the size honest during the animation, 'zoomend'
    // catches the case where the animation is skipped.
    map.on('zoom zoomend', applyDotScale);

    resizeObserver = new ResizeObserver(() => map?.invalidateSize());
    resizeObserver.observe(el.value);
  }
}

function renderMarkers() {
  if (!map || !L) return;
  // Remove existing markers/lines (keep tile layer)
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
  });

  const valid = props.markers.filter((m) => m.lat && m.lon);
  const dots = props.dots.filter((d) => d.lat && d.lon);
  if (!valid.length && !dots.length) return;

  // Saved places first, so route pins render above them.
  dots.forEach((d) => {
    const marker = L.marker([d.lat, d.lon], {
      icon: dotIcon(d.rating),
      zIndexOffset: -100,
    });
    const stars = d.rating ? `★ ${d.rating}` : '';
    const sub = d.sub ? `<br><small>${d.sub}</small>` : '';
    const note = d.note ? `<br><small style="color:#6b5f56">${d.note}</small>` : '';
    marker.bindPopup(
      `<b>${d.label}</b> <span style="color:#855309">${stars}</span>${sub}${note}` +
        `<br><button type="button" class="map-dot-add" style="${POPUP_BTN};border:1px solid #0e5c55;color:#0e5c55">+ Add to this day</button>` +
        `<button type="button" class="map-dot-hide" style="${POPUP_BTN};margin-left:6px;border:1px solid #cdc6bd;color:#6b5f56">Hide</button>`,
    );
    marker.on('popupopen', (e) => {
      const el = e.popup.getElement();
      const add = el?.querySelector('.map-dot-add');
      if (add) {
        add.onclick = () => {
          marker.closePopup();
          emit('dot-add', d.id);
        };
      }
      const hide = el?.querySelector('.map-dot-hide');
      if (hide) {
        hide.onclick = () => {
          marker.closePopup();
          emit('dot-hide', d.id);
        };
      }
    });
    marker.addTo(map);
  });

  if (!valid.length) {
    map.fitBounds(
      dots.map((d) => [d.lat, d.lon]),
      { padding: [40, 40], maxZoom: 14 },
    );
    map.invalidateSize();
    return;
  }

  valid.forEach((m, i) => {
    const icon = props.numbered
      ? numberIcon(m.n ?? i + 1)
      : pinIcon(valid.length === 1 ? PIN_COLORS.single : i === 0 ? PIN_COLORS.from : PIN_COLORS.to);
    const marker = L.marker([m.lat, m.lon], { icon });
    if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
    marker.addTo(map);
  });

  const routedLegs = (props.legs || []).filter(
    (l) => Array.isArray(l.points) && l.points.length >= 2,
  );
  if (routedLegs.length) {
    // Real road geometry per leg; markers may sit slightly off the path.
    routedLegs.forEach((l) => {
      L.polyline(
        l.points,
        l.mode === 'car'
          ? { color: '#0e5c55', weight: 3, opacity: 0.9 }
          : { color: '#0e5c55', weight: 3, dashArray: '2 7', opacity: 0.9 }, // dotted = on foot
      ).addTo(map);
    });
    map.fitBounds([...routedLegs.flatMap((l) => l.points), ...valid.map((m) => [m.lat, m.lon])], {
      padding: [40, 40],
    });
  } else if (valid.length >= 2) {
    L.polyline(
      valid.map((m) => [m.lat, m.lon]),
      props.numbered
        ? { color: '#0e5c55', weight: 2.4, dashArray: '6 5', opacity: 0.85 }
        : { color: '#6366f1', weight: 2.5, dashArray: '7 5', opacity: 0.7 },
    ).addTo(map);
    map.fitBounds(
      valid.map((m) => [m.lat, m.lon]),
      { padding: [40, 40] },
    );
  } else {
    map.setView([valid[0].lat, valid[0].lon], 14);
  }
  map.invalidateSize();
}

onMounted(() => {
  if (hasMarkers.value) initMap();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (map) {
    map.remove();
    map = null;
  }
});

watch(
  [() => props.markers, () => props.legs, () => props.dots],
  async ([markers, , dots]) => {
    if (!markers.some((m) => m.lat && m.lon) && !dots.some((d) => d.lat && d.lon)) return;
    if (!map) {
      await initMap();
    } else {
      renderMarkers();
    }
  },
  { deep: true },
);
</script>

<style scoped>
.booking-map {
  /* Leaflet stacks its panes at z-index 400+; kept inside their own context they
     can no longer climb over a search dropdown (z-index 200) opened above the map. */
  position: relative;
  z-index: 0;
  height: 210px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  overflow: hidden;
  margin-top: 12px;
  transition: opacity 0.2s;
}
.booking-map--hidden {
  display: none;
}

/* OSM's own tiles carry every shop and clinic in colour; muted, they stay
   readable as streets while the rating dots own the colour on top. Only the
   tile pane is filtered — markers and popups sit in panes of their own. */
.booking-map :deep(.leaflet-tile-pane) {
  filter: saturate(0.5) contrast(0.9) brightness(1.06);
}

.booking-map :deep(.place-dot) {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(var(--dot-size) * var(--dot-scale, 1));
  height: calc(var(--dot-size) * var(--dot-scale, 1));
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--dot-color);
  border: 2px solid #fff;
  box-sizing: border-box;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.35);
  transition:
    width 0.12s ease-out,
    height 0.12s ease-out;
}
</style>
