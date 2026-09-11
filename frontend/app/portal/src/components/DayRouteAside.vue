<template>
  <!-- Beside the list on a laptop. On a phone the same aside is a sheet the
       dock slides up: a glance at the route, a tap on a saved place to add
       it, and back to the list. -->
  <aside class="itin-map" :class="{ 'is-open': open }">
    <div class="itin-map-head">
      <h3 style="font: var(--type-h3); margin: 0">Day route</h3>
      <span class="text-subtle text-sm"
        >{{ markers.length }} point{{ markers.length === 1 ? '' : 's' }}</span
      >
      <button
        type="button"
        class="itin-map-close"
        aria-label="Close the map"
        @click="$emit('update:open', false)"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>
    <BookingMap
      :markers="markers"
      :legs="legs"
      :dots="libraryDots"
      numbered
      :height="mapHeight"
      @dot-add="onMapDotAdd"
      @dot-hide="hidePlace"
    />
    <div class="itin-map-legend">
      <span v-if="libraryDots.length">
        <i class="pi pi-circle-fill" style="font-size: 8px; color: var(--warning-500)"></i>
        {{ libraryDots.length }} saved place{{ libraryDots.length === 1 ? '' : 's' }} on the map —
        colour is the rating; click one for details, to add or to hide it.
      </span>
      <button v-if="hiddenIds.size" type="button" class="link-btn" @click="unhideAll">
        show {{ hiddenIds.size }} hidden
      </button>
    </div>
    <div v-if="routeTotal" class="itin-route-total">
      <i class="pi pi-directions"></i>
      <span
        >{{ fmtDur(routeTotal.durationSec) }} · {{ fmtDist(routeTotal.distanceM) }} ·
        {{ stopCount }} stops</span
      >
    </div>
    <div v-if="!markers.length" class="itin-map-empty">
      <i class="pi pi-map" style="font-size: 22px"></i>
      <span>No places with coordinates yet</span>
    </div>

    <!-- Candidates for this day: best-rated first, nearest first among
         equals, and never something already on the timeline. -->
    <div class="itin-picks">
      <div class="itin-picks-head">
        <h3>Places to consider</h3>
        <span class="text-subtle text-sm">{{ candidatePlaces.length }}</span>
      </div>
      <div class="itin-picks-controls">
        <div class="itin-picks-scope">
          <button
            v-for="s in PICK_SCOPES"
            :key="s.key"
            type="button"
            class="pick-scope-btn"
            :class="{ 'is-on': pickScope === s.key }"
            @click="pickScope = s.key"
          >
            {{ s.label }}
          </button>
        </div>
        <div class="itin-picks-scope">
          <button
            v-for="o in PICK_SORTS"
            :key="o.key"
            type="button"
            class="pick-scope-btn"
            :class="{ 'is-on': pickSort === o.key }"
            v-tooltip="o.hint"
            @click="pickSort = o.key"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
      <div class="itin-picks-list">
        <div v-for="p in candidatePlaces" :key="p.id" class="pick-row">
          <span class="pick-rating" :class="`pick-rating--${p.rating || 3}`"
            >★ {{ p.rating || 3 }}</span
          >
          <span class="pick-main">
            <span class="pick-name">{{ p.name }}</span>
            <span class="pick-sub">{{ pickSub(p) }}</span>
          </span>
          <!-- One click puts it in the day, right after the stop it is
               closest to; the second opens the full form. -->
          <button
            type="button"
            class="pick-add"
            :disabled="quickAddingId === p.id"
            v-tooltip="p.nearStop ? `Add after ${p.nearStop.name}` : 'Add to this day'"
            @click="quickAdd(p)"
          >
            <i class="pi" :class="quickAddingId === p.id ? 'pi-spinner pi-spin' : 'pi-plus'"></i>
          </button>
          <button
            type="button"
            class="pick-more"
            v-tooltip="'Add with times and notes'"
            @click="$emit('open-place', p)"
          >
            <i class="pi pi-sliders-h"></i>
          </button>
        </div>
        <p v-if="!candidatePlaces.length" class="text-subtle text-sm" style="margin: 6px 0">
          {{
            pickScope === 'city'
              ? 'Nothing from the trip list is in this city — try Trip list.'
              : 'Everything on the trip list is already planned — add places to the trip on the Places page.'
          }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  api,
  distanceMeters,
  formatDistance as fmtDist,
  formatDuration as fmtDur,
  PLACE_TYPE_META,
} from '@tripyfull/core';
import { toast } from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import { placeToActivityType } from '@/plan/activityTypes.js';

/**
 * The day's route on a map, with the saved places that could still join it.
 * The map shows the planned stops as numbered pins and the candidates as
 * dots; the list under it is the same candidates, best first or nearest
 * first. One click adds a place right after the stop it is closest to; the
 * screen hears "updated" with the day's new list. Hiding a place is a view
 * choice and stays in this browser, per trip.
 */
const props = defineProps({
  /** The phone's sheet is open. */
  open: { type: Boolean, default: false },
  /** Numbered pins of the planned stops. */
  markers: { type: Array, default: () => [] },
  /** Lines between them. */
  legs: { type: Array, default: () => [] },
  routeTotal: { type: Object, default: null },
  stopCount: { type: Number, default: 0 },
  activities: { type: Array, default: () => [] },
  /** The place library the candidates are drawn from. */
  places: { type: Array, default: () => [] },
  day: { type: Object, default: null },
  dayId: { type: String, required: true },
  tripId: { type: String, required: true },
});
const emit = defineEmits(['update:open', 'updated', 'open-place']);

/** The map is the widest thing here, so it follows the window's height. */
const mapHeight = ref(560);
const measureMap = () => {
  // In the phone's sheet the map takes half the screen; the legend, the route
  // total and the places to consider follow underneath.
  mapHeight.value = window.matchMedia('(max-width: 700px)').matches
    ? Math.round(window.innerHeight * 0.52)
    : Math.max(420, Math.min(760, window.innerHeight - 320));
};

onMounted(() => {
  loadHidden();
  measureMap();
  window.addEventListener('resize', measureMap);
});
onBeforeUnmount(() => window.removeEventListener('resize', measureMap));

/** km between two points — good enough to sort candidates by "how far off route". */
const distanceKm = (aLat, aLon, bLat, bLon) => distanceMeters([aLat, aLon], [bLat, bLon]) / 1000;

// Untyped places read better as "Place" than "Other" on the cards.
const placeTypeLabel = (t) =>
  t && t !== 'OTHER' && PLACE_TYPE_META[t] ? PLACE_TYPE_META[t].label : 'Place';

/** "Not today" — hiding declutters both the map and the list. It is a view
 *  choice, so it lives in the browser per trip, not in the trip's data. */
const HIDDEN_KEY = `tf.hiddenPlaces.${props.tripId}`;
const hiddenIds = ref(new Set());

const loadHidden = () => {
  try {
    hiddenIds.value = new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'));
  } catch {
    hiddenIds.value = new Set();
  }
};
const persistHidden = () => {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIds.value]));
  } catch {
    /* private mode — hiding just won't survive a reload */
  }
};
const hidePlace = (id) => {
  const next = new Set(hiddenIds.value);
  next.add(id);
  hiddenIds.value = next;
  persistHidden();
  const name = props.places.find((p) => p.id === id)?.name || 'Place';
  toast.success('Hidden', `${name} — "show hidden" brings it back`);
};
const unhideAll = () => {
  hiddenIds.value = new Set();
  persistHidden();
};

// The candidates are the trip's own shortlist — the whole library is what the
// Places page is for.
const PICK_SCOPES = [
  { key: 'city', label: 'This city' },
  { key: 'trip', label: 'Trip list' },
];
const PICK_SORTS = [
  { key: 'rating', label: 'Best first', hint: 'Must-sees first, nearest among equals' },
  { key: 'near', label: 'Nearest', hint: 'Closest to what is already planned today' },
];
const pickScope = ref('trip');
const pickSort = ref('rating');

/** Places attached to this trip — the shortlist the day should be built from. */
const inThisTrip = (p) => (p.tripIds || []).includes(props.tripId);

/** The day's stops, so a candidate can be measured against the nearest one. */
const dayStops = computed(() =>
  props.markers.map((m, i) => ({ n: i + 1, name: m.label, lat: m.lat, lon: m.lon })),
);

/** Fallback anchor for an empty day: something saved in the day's own city. */
const cityAnchor = computed(() => {
  const withCity = props.places.find(
    (p) => p.latitude != null && p.longitude != null && matchesDayCity(p),
  );
  return withCity ? { lat: Number(withCity.latitude), lon: Number(withCity.longitude) } : null;
});

/** Nearest planned stop to a place — the answer to "what is this next to?". */
const nearestStop = (p) => {
  if (p.latitude == null || p.longitude == null || !dayStops.value.length) return null;
  let best = null;
  for (const st of dayStops.value) {
    const km = distanceKm(st.lat, st.lon, Number(p.latitude), Number(p.longitude));
    if (!best || km < best.km) best = { ...st, km };
  }
  return best;
};

const matchesDayCity = (p) => {
  const c = (props.day?.city || '').trim().toLowerCase();
  if (!c) return true;
  const pc = (p.city || '').toLowerCase();
  return !!pc && (pc === c || pc.includes(c) || c.includes(pc));
};

/** Rating first (the strategy's whole point), then nearest among equals. */
const candidatePlaces = computed(() => {
  const planned = new Set(props.activities.map((a) => a.placeId).filter(Boolean));
  const fallback = cityAnchor.value;
  const byKm = (a, b) => (a.km == null ? 1e9 : a.km) - (b.km == null ? 1e9 : b.km);
  return (
    props.places
      .filter((p) => !planned.has(p.id) && !hiddenIds.value.has(p.id))
      // city subset of trip subset of all
      .filter(inThisTrip)
      .filter((p) => (pickScope.value === 'city' ? matchesDayCity(p) : true))
      .map((p) => {
        const near = nearestStop(p);
        const km =
          near?.km ??
          (fallback && p.latitude != null && p.longitude != null
            ? distanceKm(fallback.lat, fallback.lon, Number(p.latitude), Number(p.longitude))
            : null);
        return { ...p, nearStop: near, km };
      })
      .sort((a, b) =>
        pickSort.value === 'near'
          ? byKm(a, b) || (b.rating || 3) - (a.rating || 3)
          : (b.rating || 3) - (a.rating || 3) || byKm(a, b) || a.name.localeCompare(b.name),
      )
      .slice(0, 40)
  );
});

const fmtKm = (km) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

/** Type, how long it takes, and what it sits next to today. */
const pickSub = (p) =>
  [
    placeTypeLabel(p.type),
    p.visitMinutes ? `${p.visitMinutes} min` : null,
    p.nearStop
      ? `${fmtKm(p.nearStop.km)} from ${p.nearStop.n}. ${p.nearStop.name}`
      : p.km != null
        ? `${fmtKm(p.km)} away`
        : null,
    p.needsBooking ? 'book ahead' : null,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * Add straight to the day and drop it in after the stop it is nearest to —
 * geography decides the order, which is the point of planning on a map.
 */
const quickAddingId = ref(null);
const quickAdd = async (p) => {
  quickAddingId.value = p.id;
  const near = p.nearStop;
  try {
    const res = await api.post(`/api/days/${props.dayId}/activities`, {
      name: p.name,
      type: placeToActivityType(p.type),
      address: p.address || null,
      placeId: p.id,
      needsBooking: !!p.needsBooking,
    });
    let list = [...props.activities, res.data];

    if (near) {
      const ids = list.map((a) => a.id).filter((id) => id !== res.data.id);
      const anchorId = list.find((a) => a.name === near.name)?.id;
      const at = anchorId ? ids.indexOf(anchorId) + 1 : ids.length;
      ids.splice(at, 0, res.data.id);
      const ordered = await api.patch(`/api/days/${props.dayId}/activities/reorder`, {
        orderedIds: ids,
      });
      list = ordered.data;
    }
    emit('updated', list);
    toast.success('Added', near ? `After ${near.n}. ${near.name}` : `${p.name} is in the day`);
  } catch {
    toast.danger('Error', 'Failed to add the place');
  } finally {
    quickAddingId.value = null;
  }
};

const libraryDots = computed(() =>
  candidatePlaces.value
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      lat: Number(p.latitude),
      lon: Number(p.longitude),
      label: p.name,
      rating: p.rating || 3,
      sub: pickSub(p),
      note: p.ratingComment || null,
    })),
);
const onMapDotAdd = (id) => {
  const p = props.places.find((x) => x.id === id);
  if (p) emit('open-place', p);
};
</script>

<style scoped>
/* The sheet's close button exists for phones; see the block below. */
.itin-map-close {
  display: none;
}
.itin-map {
  position: sticky;
  top: 0;
}
.itin-map-legend {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: 6px;
  font: var(--fw-regular) 11px/1.4 var(--font-sans);
  color: var(--text-secondary);
}
/* How full the day is: two stacked shares of a 10h day. */
.itin-picks-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.pick-add,
.pick-more {
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  font-size: 12px;
}
.pick-add {
  color: var(--accent);
}
.pick-more {
  color: var(--text-disabled);
}
.pick-add:hover,
.pick-more:hover {
  background: var(--card);
  color: var(--text-primary);
}
.pick-add:disabled {
  opacity: 0.5;
  cursor: default;
}
/* Candidates: a dense, scannable list — rating badge, name, the facts that
   decide whether it fits today. */
.itin-picks {
  margin-top: 18px;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3) var(--space-4);
}
.itin-picks-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.itin-picks-head h3 {
  margin: 0;
  font: var(--fw-bold) 15px/1.2 var(--font-display);
}
.itin-picks-scope {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
}
.pick-scope-btn {
  border: none;
  background: none;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font: var(--fw-medium) 12px/1 var(--font-sans);
  color: var(--text-secondary);
  cursor: pointer;
}
.pick-scope-btn.is-on {
  background: var(--card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}
.itin-picks-list {
  max-height: 320px;
  overflow-y: auto;
  margin: 0 calc(-1 * var(--space-2));
}
.pick-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px var(--space-2);
  border: none;
  background: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
}
.pick-row:hover {
  background: var(--surface);
}
.pick-rating {
  flex: none;
  font: var(--fw-semibold) 12px/1 var(--font-sans);
  color: var(--text-secondary);
  width: 30px;
}
.pick-rating--5 {
  color: var(--warning-700);
  font-weight: var(--fw-bold);
}
.pick-rating--4 {
  color: var(--text-primary);
}
.pick-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pick-name {
  font: var(--fw-semibold) 13px/1.3 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-sub {
  font: var(--fw-regular) 11px/1.3 var(--font-sans);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-row .pi-plus {
  color: var(--accent);
  font-size: 13px;
  flex: none;
}
.itin-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.itin-map-empty {
  height: 420px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font: var(--fw-medium) 13px/1 var(--font-sans);
}
.itin-route-total {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--text-secondary);
  font: var(--fw-medium) 12px/1 var(--font-sans);
}
.itin-route-total i {
  font-size: 12px;
  color: var(--success-700);
}
@media (max-width: 1024px) {
  .itin-map {
    position: static;
  }
  .itin-map-empty {
    height: 280px;
  }
}
@media (max-width: 700px) {
  /* The map aside becomes a sheet, parked below the screen until the dock
     slides it up. It keeps its real size while parked, so Leaflet measures a
     true box on mount and fits the route correctly the first time it shows. */
  .itin-map {
    position: fixed;
    inset: var(--topbar-height) 0 0 0;
    z-index: 70;
    overflow-y: auto;
    padding: 12px var(--space-4) 84px;
    background: var(--bg);
    transform: translateY(100%);
    transition: transform var(--dur-base) var(--ease-out);
  }
  .itin-map.is-open {
    transform: none;
  }
  .itin-map-head {
    position: relative;
    padding-right: 44px;
  }
  .itin-map-close {
    position: absolute;
    right: 0;
    top: -4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
  }
  .itin-picks-list {
    max-height: none;
  }
  /* A place's facts (type, minutes, distance) get two lines instead of an
     ellipsis that hides the distance — the reason the row is read at all. */
  .pick-sub {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
