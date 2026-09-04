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
  // Context layer: nearby saved places as small muted dots — [{ id, lat, lon, label, sub }].
  // Excluded from fitBounds so the view stays framed on the actual route.
  dots: { type: Array, default: () => [] },
});
const emit = defineEmits(['dot-add']);

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

function dotIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:11px;height:11px;background:#8b8478;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);opacity:.85"></div>`,
    iconSize: [11, 11],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  });
}

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
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:
      '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20,
  }).addTo(map);
  renderMarkers();
  // The map can be born inside a panel that is still animating open (width ~0),
  // and Leaflet caches that size — so follow the container.
  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
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

  // Nearby saved places first, so route pins render above them.
  dots.forEach((d) => {
    const marker = L.marker([d.lat, d.lon], { icon: dotIcon(), zIndexOffset: -100 });
    const sub = d.sub ? `<br><small>${d.sub}</small>` : '';
    marker.bindPopup(
      `<b>${d.label}</b>${sub}<br><button type="button" class="map-dot-add" style="margin-top:6px;padding:3px 10px;border:1px solid #0e5c55;border-radius:99px;background:#fff;color:#0e5c55;font:600 12px/1.4 sans-serif;cursor:pointer">+ Add to this day</button>`,
    );
    marker.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('.map-dot-add');
      if (btn) {
        btn.onclick = () => {
          marker.closePopup();
          emit('dot-add', d.id);
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
</style>
