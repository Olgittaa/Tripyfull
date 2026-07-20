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
});

const el = ref(null);
let map = null;
let L = null;

const hasMarkers = computed(() => props.markers.some((m) => m.lat && m.lon));

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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '© <a href="https://openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);
  renderMarkers();
}

function renderMarkers() {
  if (!map || !L) return;
  // Remove existing markers/lines (keep tile layer)
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
  });

  const valid = props.markers.filter((m) => m.lat && m.lon);
  if (!valid.length) return;

  valid.forEach((m, i) => {
    const icon = props.numbered
      ? numberIcon(m.n ?? i + 1)
      : pinIcon(valid.length === 1 ? PIN_COLORS.single : i === 0 ? PIN_COLORS.from : PIN_COLORS.to);
    const marker = L.marker([m.lat, m.lon], { icon });
    if (m.label) marker.bindPopup(`<b>${m.label}</b>`);
    marker.addTo(map);
  });

  if (valid.length >= 2) {
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
  if (map) {
    map.remove();
    map = null;
  }
});

watch(
  () => props.markers,
  async (newVal) => {
    if (!newVal.some((m) => m.lat && m.lon)) return;
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
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  margin-top: 12px;
  transition: opacity 0.2s;
}
.booking-map--hidden {
  display: none;
}
</style>
