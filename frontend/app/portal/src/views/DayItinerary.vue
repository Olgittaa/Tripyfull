<template>
  <div class="page-content page-content--full">
    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 40px; width: 300px"></div>
      <div style="display: flex; gap: 8px">
        <div
          v-for="i in 5"
          :key="i"
          class="skeleton"
          style="width: 58px; height: 52px; border-radius: var(--radius-md)"
        ></div>
      </div>
      <div class="skeleton" style="height: 200px"></div>
    </div>

    <template v-else>
      <DayHead
        :day="day"
        :day-id="dayId"
        :day-index="currentDayIndex"
        :day-count="allDays.length"
        :reserve-index="reserveIndex"
        :can-sort="activities.length > 1"
        @prev="goToDay(currentDayIndex - 1)"
        @next="goToDay(currentDayIndex + 1)"
        @auto-plan="showAutoPlan = true"
        @sort="sortByTime"
        @remove-reserve="removeReserveDay(day)"
        @swap="openSwapModal"
        @add="openAddDialog"
        @updated="updateDayLocal"
      />
      <DayStrip
        v-if="allDays.length > 1"
        :days="allDays"
        :current-id="dayId"
        :adding="addingBuffer"
        @select="switchDay"
        @remove="removeReserveDay"
        @add="addBufferDay"
      />

      <!-- How full the day already is: the question every "add this?" answers to. -->
      <!-- Two-column: itinerary (left) + day route map (right) -->
      <div class="itin-layout">
        <div class="itin-main">
          <!-- The day in numbers, and the night when the plan does not show it -->
          <DayFacts
            :day="day"
            :day-id="dayId"
            :load="activities.length ? dayBudget : null"
            :night-in-plan="nightInPlan"
            :bookings="bookings"
            @updated="updateDayLocal"
          />

          <!-- Activities timeline -->
          <div v-if="activities.length" style="display: flex; flex-direction: column; gap: 12px">
            <div
              v-for="(a, i) in activities"
              :key="a.id"
              class="timeline-row"
              :class="{ 'is-dragging': dragIndex === i }"
              draggable="true"
              @dragstart="onDragStart(i, $event)"
              @dragover.prevent="onDragOver(i)"
              @drop.prevent
              @dragend="onDragEnd"
            >
              <div class="timeline-gutter">
                <i class="pi pi-bars drag-grip" title="Drag to reorder"></i>
                <span
                  class="timeline-time"
                  :class="{ 'timeline-time--derived': !a.startTime && derivedTimes[a.id] }"
                  :title="
                    !a.startTime && derivedTimes[a.id]
                      ? 'Worked out from the previous stop and the way there — set a time to fix it'
                      : ''
                  "
                  >{{
                    a.startTime
                      ? a.startTime.slice(0, 5)
                      : derivedTimes[a.id]
                        ? '≈ ' + derivedTimes[a.id]
                        : ''
                  }}</span
                >
                <span v-if="i < activities.length - 1" class="timeline-line"></span>
              </div>
              <div class="timeline-content">
                <StopCard
                  :activity="a"
                  :map-number="stopNumbers[a.id]"
                  :currency="currency"
                  :approx-base="isForeign(a) ? toBase(a) : null"
                  @open="startEdit(a)"
                />
                <!-- @dragstart guard: a press that drifts must not hijack the row drag -->
                <LegRow
                  v-if="legInfoByActivity[a.id]"
                  :info="legInfoByActivity[a.id]"
                  @change="setLegMode(a, $event)"
                  @dragstart.prevent.stop
                />
              </div>
            </div>
          </div>

          <!-- Empty state + quick add from city places -->
          <template v-else>
            <div class="empty-state">
              <div class="empty-state-icon"><i class="pi pi-directions"></i></div>
              <h3>Nothing planned yet</h3>
              <p>Add an activity manually, or quickly from this city's saved places.</p>
            </div>

            <!-- Candidates now live beside the map, next to the geography
                 they belong to; this stays as the manual way in. -->
            <div style="text-align: center; margin-top: 16px">
              <TfButton variant="primary" @click="openAddDialog"
                ><i class="pi pi-plus" style="font-size: 13px"></i> Add activity</TfButton
              >
            </div>
          </template>

          <!-- Day total by category -->
          <div
            v-if="activities.length"
            class="card"
            style="
              margin-top: 18px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 16px;
            "
          >
            <div style="display: flex; gap: 18px; flex-wrap: wrap">
              <div
                v-for="(amount, type) in costByType"
                :key="type"
                style="display: flex; align-items: center; gap: 7px"
              >
                <div class="cat-icon cat-icon--sm" :style="catStyle(type)">
                  {{ typeIcon(type) }}
                </div>
                <span
                  style="
                    font: var(--fw-medium) 13px/1 var(--font-sans);
                    color: var(--text-secondary);
                  "
                  >{{ typeLabel(type) }}</span
                >
                <span class="money money--sm">{{ amount.toFixed(2) }} {{ currency }}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px">
              <span
                style="font: var(--fw-medium) 13px/1 var(--font-sans); color: var(--text-secondary)"
                >Day total</span
              >
              <span class="money money--md">{{ dayTotal.toFixed(2) }} {{ currency }}</span>
            </div>
          </div>
        </div>
        <!-- /itin-main -->

        <!-- Right: the day's route on a map, and the places to consider for it -->
        <DayRouteAside
          v-model:open="mapOpen"
          :markers="activityMarkers"
          :legs="mapLegs"
          :route-total="routeTotal"
          :stop-count="mappedStopCount"
          :activities="activities"
          :places="placesLib"
          :day="day"
          :day-id="dayId"
          :trip-id="tripId"
          @updated="activities = $event"
          @open-place="openAddFromPlace"
        />
      </div>
      <!-- /itin-layout -->

      <!-- Phones only (CSS): the day, the map and "add" within a thumb's reach. -->
      <DayDock
        :day="day"
        :day-index="currentDayIndex"
        :day-count="allDays.length"
        :reserve-index="reserveIndex"
        :pins="activityMarkers.length"
        v-model:map-open="mapOpen"
        @prev="goToDay(currentDayIndex - 1)"
        @next="goToDay(currentDayIndex + 1)"
        @add="openAddDialog"
      />
    </template>

    <StopDrawer
      ref="stopDrawer"
      :trip-id="tripId"
      :day-id="dayId"
      :day="day"
      :days="allDays"
      :places="placesLib"
      :derived-times="derivedTimes"
      @saved="onStopSaved"
      @deleted="onStopDeleted"
      @place-added="onPlaceAdded"
    />

    <!-- Swap-days modal -->
    <TfModal v-model="showSwapModal" title="Swap days">
      <p class="text-muted text-sm" style="margin: 0 0 12px">
        The two days trade their plans — activities, cities, stays and notes. Date-bound things
        (expenses, the linked overnight booking) stay on their dates.
      </p>
      <TfSelect
        label="Swap this day with"
        v-model="swapTargetLabel"
        :options="swapDayLabels"
        placeholder="Pick a day"
        class="w-full"
      />
      <div class="dialog-actions" style="margin-top: 16px">
        <TfButton variant="ghost" @click="showSwapModal = false">Cancel</TfButton>
        <TfButton variant="primary" :disabled="!swapTargetLabel || swapping" @click="doSwap">
          {{ swapping ? 'Swapping…' : 'Swap' }}
        </TfButton>
      </div>
    </TfModal>
    <AutoPlanModal v-model="showAutoPlan" :trip-id="tripId" @applied="loadDay(dayId)" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { TfButton, TfSelect, TfModal, toast, confirm } from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import AutoPlanModal from '@/components/AutoPlanModal.vue';
import DayStrip from '@/components/DayStrip.vue';
import DayDock from '@/components/DayDock.vue';
import StopCard from '@/components/StopCard.vue';
import LegRow from '@/components/LegRow.vue';
import StopDrawer from '@/components/StopDrawer.vue';
import DayRouteAside from '@/components/DayRouteAside.vue';
import DayHead from '@/components/DayHead.vue';
import DayFacts from '@/components/DayFacts.vue';
import {
  ACTIVITY_TYPES as typeOptions,
  typeIcon,
  typeLabel,
  catStyle,
} from '@/plan/activityTypes.js';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { formatDayDate } from '@tripyfull/core';
import { api } from '@tripyfull/core';
import {
  hasCoords,
  stopLat,
  stopLon,
  landsSameDay,
  legStart,
  nightShownInPlan,
} from '@/plan/stops.js';
import { useDayLegs } from '@/composables/useDayLegs.js';
import { dayLoad, minutesBetween } from '@/plan/dayLoad.js';

const route = useRoute();
const router = useRouter();

const tripId = route.params.tripId;
const dayId = ref(route.params.dayId);

const day = ref(null);
const allDays = ref([]);
const activities = ref([]);
const bookings = ref([]);
const loading = ref(false);
const currency = accountCurrency;

// Library places for linking activities
const placesLib = ref([]);
const loadPlacesLib = async () => {
  try {
    placesLib.value = (await api.get('/api/places')).data || [];
  } catch {
    /* non-fatal */
  }
};

/* The stop editor. The screen opens it three ways and keeps the day's list in
   step with what it saved or deleted. */
const stopDrawer = ref(null);
const openAddDialog = () => stopDrawer.value?.openNew();
const startEdit = (a) => stopDrawer.value?.openEdit(a);
const openAddFromPlace = (p) => {
  onPlaceAdded(p);
  stopDrawer.value?.openFromPlace(p);
};
const onPlaceAdded = (p) => {
  if (!placesLib.value.some((x) => x.id === p.id)) placesLib.value.unshift(p);
};
const onStopSaved = ({ activity, created, moved }) => {
  if (moved) {
    activities.value = activities.value.filter((a) => a.id !== activity.id);
    return;
  }
  if (created) activities.value.push(activity);
  else {
    const idx = activities.value.findIndex((a) => a.id === activity.id);
    if (idx !== -1) activities.value[idx] = activity;
  }
  if (activity.startTime) autoSortByTime();
};
const onStopDeleted = (a) => {
  activities.value = activities.value.filter((x) => x.id !== a.id);
};

const currentDayIndex = computed(() => allDays.value.findIndex((d) => d.id === dayId.value));

/* ---- Manual ordering: drag-and-drop + sort by time ---- */
const dragIndex = ref(null);

const onDragStart = (i, e) => {
  dragIndex.value = i;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(i)); // Firefox refuses to drag without data
};

// Live reorder while hovering: the list (and the numbered map pins) preview the result.
const onDragOver = (i) => {
  if (dragIndex.value === null || i === dragIndex.value) return;
  const arr = activities.value;
  const [moved] = arr.splice(dragIndex.value, 1);
  arr.splice(i, 0, moved);
  dragIndex.value = i;
};

const onDragEnd = () => {
  if (dragIndex.value === null) return;
  dragIndex.value = null;
  persistOrder();
};

const persistOrder = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}/activities/reorder`, {
      orderedIds: activities.value.map((a) => a.id),
    });
    activities.value = res.data;
  } catch {
    toast.danger('Error', 'Failed to save the order');
    loadDay(dayId.value); // restore the server's order
  }
};

/**
 * The day in time order. Timed stops sort by their time; a stop without one
 * stays right after the stop it follows; the hotel rows the booking sync wrote
 * keep their place at the ends of the day (where you wake up, where you sleep).
 */
const inTimeOrder = (list) => {
  const isHotel = (a) => a.fromBooking && a.type === 'ACCOMMODATION';
  let head = 0;
  while (head < list.length && isHotel(list[head])) head++;
  let tail = list.length;
  while (tail > head && isHotel(list[tail - 1])) tail--;
  const middle = list.slice(head, tail);
  // Effective time: own, else the last timed stop before it (so it trails it).
  let last = '';
  const keyed = middle.map((a, i) => {
    if (a.startTime) last = a.startTime;
    return { a, i, t: a.startTime || last };
  });
  keyed.sort((x, y) => x.t.localeCompare(y.t) || x.i - y.i);
  return [...list.slice(0, head), ...keyed.map((k) => k.a), ...list.slice(tail)];
};
const sortByTime = () => {
  activities.value = inTimeOrder(activities.value);
  persistOrder();
};
/** After a save: if the day is no longer in time order, put it back. */
const autoSortByTime = () => {
  const ordered = inTimeOrder(activities.value);
  if (ordered.some((a, i) => a.id !== activities.value[i].id)) {
    activities.value = ordered;
    persistOrder();
  }
};

/**
 * Times the chain works out for stops that have none: the previous stop's time
 * (its own or worked out) plus how long it takes there — its own span, else the
 * place's visit time, else nothing (a departure point) — plus the way over.
 */
const derivedTimes = computed(() => {
  const out = {};
  let clock = null; // minutes since midnight at the end of the previous stop
  for (const a of activities.value) {
    const own = a.startTime ? toMinutes(a.startTime) : null;
    const start = own ?? clock;
    if (own == null && start != null) out[a.id] = fromMinutes(start);
    if (start == null) continue;
    let stay = minutesBetween(a);
    if (!stay && !a.fromBooking) {
      const place = placesLib.value.find((x) => x.id === a.placeId);
      stay = place?.visitMinutes || 0;
    }
    const leg = legInfoByActivity.value[a.id]?.data?.durationSec;
    clock = start + stay + (leg ? Math.round(leg / 60) : 0);
    if (clock >= 24 * 60) clock = null; // past midnight: stop guessing
  }
  return out;
});
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/* ---- Move an activity to another day (edit drawer) ---- */

/* Costs in other currencies are converted at the live rate, the way the budget
   page does it — a THB estimate must not be added up as if it were euros. */
const costRates = ref({});
const isForeign = (a) => !!a.costCurrency && a.costCurrency !== currency.value;
const toBase = (a) => {
  const amt = Number(a.costEstimate) || 0;
  if (!isForeign(a)) return amt;
  const rate = costRates.value[a.costCurrency];
  return rate ? amt * rate : 0; // unknown rate: left out rather than counted as base currency
};
const loadCostRates = async () => {
  const wanted = [...new Set(activities.value.filter(isForeign).map((a) => a.costCurrency))].filter(
    (c) => !costRates.value[c],
  );
  await Promise.all(
    wanted.map(async (c) => {
      try {
        const res = await api.get('/api/exchange-rate', {
          params: { from: c, to: currency.value },
        });
        costRates.value = { ...costRates.value, [c]: Number(res.data.rate) };
      } catch {
        /* no rate: the amount stays visible in its own currency, out of the total */
      }
    }),
  );
};
watch(activities, loadCostRates, { deep: true });
const dayTotal = computed(() => activities.value.reduce((s, a) => s + toBase(a), 0));

const mappedStopCount = computed(() => activities.value.filter(hasCoords).length);

// Pins for activities that have coordinates, numbered like the rows; a same-day
// journey adds an unnumbered pin where it lands.
const activityMarkers = computed(() => {
  const out = [];
  for (const a of activities.value) {
    if (!hasCoords(a)) continue;
    out.push({
      lat: Number(stopLat(a)),
      lon: Number(stopLon(a)),
      label: a.placeName || a.name,
      n: stopNumbers.value[a.id],
    });
    if (landsSameDay(a)) {
      const [lat, lon] = legStart(a);
      out.push({ lat, lon, label: `Arrive · ${a.name}`, n: '✈' });
    }
  }
  return out;
});
// activity id -> its number on the map (same order as the markers)
const stopNumbers = computed(() => {
  const map = {};
  let n = 0;
  activities.value.forEach((a) => {
    if (hasCoords(a)) map[a.id] = ++n;
  });
  return map;
});

const { legInfoByActivity, mapLegs, routeTotal, setLegMode } = useDayLegs({
  activities,
  reload: () => loadDay(dayId.value),
});

/* The route map as a sheet over the list (phones); the dock toggles it. */
const mapOpen = ref(false);

/** How full the day is: stops, time at them, time on the move. A stop without a
    clock borrows its saved place's usual visit length. */
const nightInPlan = computed(() => nightShownInPlan(activities.value, day.value?.date));

const dayBudget = computed(() =>
  dayLoad({
    activities: activities.value,
    date: day.value?.date,
    routeSeconds: routeTotal.value?.durationSec,
    visitMinutesFor: (a) =>
      a.fromBooking ? null : placesLib.value.find((x) => x.id === a.placeId)?.visitMinutes,
  }),
);

/** Dated days are the trip; reserve days sit beside it, without a date. */
const datedDays = computed(() => allDays.value.filter((d) => d.date));
const reserveDays = computed(() => allDays.value.filter((d) => !d.date));
const reserveIndex = computed(() => reserveDays.value.findIndex((d) => d.id === dayId.value) + 1);

const addingBuffer = ref(false);
const addBufferDay = async () => {
  addingBuffer.value = true;
  try {
    const res = await api.post(`/api/trips/${tripId}/days/buffer`);
    allDays.value = res.data || [];
    toast.success('Buffer day added', 'It sits outside the trip dates until you swap it in');
  } catch {
    toast.danger('Error', 'Failed to add a buffer day');
  } finally {
    addingBuffer.value = false;
  }
};

const removeReserveDay = async (d) => {
  const ok = await confirm({
    title: 'Remove reserve day',
    message: 'Anything planned on it is removed too. Continue?',
    tone: 'danger',
    confirmLabel: 'Remove',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;
  try {
    await api.delete(`/api/days/${d.id}`);
    allDays.value = allDays.value.filter((x) => x.id !== d.id);
    // Standing on the day that just went away: fall back to the first real one.
    if (d.id === dayId.value && datedDays.value.length) switchDay(datedDays.value[0].id);
    toast.success('Removed');
  } catch {
    toast.danger('Error', 'Failed to remove the day');
  }
};

const costByType = computed(() => {
  const map = {};
  activities.value.forEach((a) => {
    if (a.costEstimate && a.type) {
      map[a.type] = (map[a.type] || 0) + toBase(a);
    }
  });
  return map;
});

// Helper to sync day data locally
const updateDayLocal = (data) => {
  day.value = { ...day.value, ...data };
  const idx = allDays.value.findIndex((d) => d.id === dayId.value);
  if (idx !== -1) allDays.value[idx] = { ...allDays.value[idx], ...data };
};

const switchDay = (id) => {
  router.replace(`/trips/${tripId}/days/${id}`);
  dayId.value = id;
  loadDay(id);
};

// Swap this day's plan with another day of the trip.
const showSwapModal = ref(false);
const swapping = ref(false);
const swapTargetLabel = ref(null);
const swapDayOptions = computed(() =>
  allDays.value
    .filter((d) => d.id !== dayId.value)
    .map((d) => ({ label: `Day ${d.dayNumber} · ${formatDayDate(d.date)}`, value: d.id })),
);
const swapDayLabels = computed(() => swapDayOptions.value.map((o) => o.label));
const openSwapModal = () => {
  swapTargetLabel.value = null;
  showSwapModal.value = true;
};
const doSwap = async () => {
  const target = swapDayOptions.value.find((o) => o.label === swapTargetLabel.value)?.value;
  if (!target) return;
  swapping.value = true;
  try {
    await api.post(`/api/trips/${tripId}/days/${dayId.value}/swap/${target}`);
    showSwapModal.value = false;
    await loadDay(dayId.value);
    toast.success('Swapped', `Plans traded with ${swapTargetLabel.value}`);
  } catch {
    toast.danger('Error', 'Failed to swap days');
  } finally {
    swapping.value = false;
  }
};

// The route can also change without switchDay — sidebar "Itinerary" link,
// browser back/forward. The component is reused, so react to the param.
watch(
  () => route.params.dayId,
  (id) => {
    if (id && id !== dayId.value) {
      dayId.value = id;
      loadDay(id);
    }
  },
);

const goToDay = (idx) => {
  if (idx >= 0 && idx < allDays.value.length) {
    switchDay(allDays.value[idx].id);
  }
};

const showAutoPlan = ref(false);

const loadDay = async (id) => {
  try {
    // Reload all days to get fresh overnightStay/city data
    const [daysRes, activitiesRes] = await Promise.all([
      api.get(`/api/trips/${tripId}/days`),
      api.get(`/api/days/${id}/itinerary`),
    ]);
    allDays.value = daysRes.data;
    day.value = daysRes.data.find((d) => d.id === id) || null;
    activities.value = activitiesRes.data;
    autoSortByTime(); // stops appended out of time order (bookings first, hand-made after) fall into place
  } catch {
    day.value = allDays.value.find((d) => d.id === id) || null;
    activities.value = [];
  }
};

onMounted(async () => {
  loading.value = true;
  loadPlacesLib();
  try {
    const [tripRes, daysRes, activitiesRes, bookingsRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get(`/api/trips/${tripId}/days`),
      api.get(`/api/days/${dayId.value}/itinerary`),
      api.get(`/api/trips/${tripId}/bookings`),
    ]);
    allDays.value = daysRes.data;
    day.value = daysRes.data.find((d) => d.id === dayId.value);
    activities.value = activitiesRes.data;
    autoSortByTime(); // stops appended out of time order (bookings first, hand-made after) fall into place
    bookings.value = bookingsRes.data;
  } catch {
    toast.danger('Error', 'Failed to load day');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.itin-layout {
  display: grid;
  /* The map earns the wider half it needs to be read at a glance. */
  grid-template-columns: minmax(0, 1fr) minmax(420px, 34%);
  gap: 24px;
  align-items: start;
}
@media (max-width: 1100px) {
  .itin-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
.itin-main {
  min-width: 0;
}
.addfrom-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font: var(--fw-semibold) 16px/1 var(--font-sans);
  color: var(--text-primary);
  margin-bottom: 14px;
}
.addfrom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.addfrom-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}
.addfrom-item:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}
.addfrom-thumb {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border-default);
}
.addfrom-name {
  display: block;
  font: var(--fw-semibold) 15px/1.2 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.addfrom-sub {
  display: block;
  font: var(--fw-regular) 13px/1.3 var(--font-sans);
  color: var(--text-secondary);
  margin-top: 2px;
}
/* drag-and-drop ordering */
.timeline-row {
  cursor: grab;
}
.timeline-row:active {
  cursor: grabbing;
}
.timeline-row.is-dragging {
  opacity: 0.45;
}
.drag-grip {
  font-size: 11px;
  color: var(--text-disabled);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
  margin-bottom: 4px;
}
.timeline-row:hover .drag-grip {
  opacity: 1;
}
.timeline-time--derived {
  color: var(--text-disabled);
  font-style: italic;
}
@media (max-width: 700px) {
  /* Room under the list for the dock. */
  .itin-layout {
    padding-bottom: 72px;
  }
  .itin-main {
    display: flex;
    flex-direction: column;
  }
  /* 22px of card around a stop is a laptop's air; the facts column gets it. */
  .timeline-content :deep(.tf-card) {
    padding: 14px;
  }
}
</style>
