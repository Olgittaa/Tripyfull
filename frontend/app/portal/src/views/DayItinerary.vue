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
      <!-- Day header with prev/next -->
      <div class="day-head">
        <div class="day-head-main">
          <TfIconButton
            class="phone-hide"
            variant="outline"
            size="sm"
            label="Previous day"
            :disabled="currentDayIndex <= 0"
            @click="goToDay(currentDayIndex - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </TfIconButton>
          <div>
            <!-- The dock and the strip already name the day on a phone; the head
                 keeps the city alone there. -->
            <div class="tf-eyebrow phone-hide" style="margin-bottom: 4px">
              <template v-if="day && !day.date"
                >Reserve day {{ reserveIndex }} · outside the trip dates</template
              >
              <template v-else>Day {{ day?.dayNumber }} · {{ formatDayDate(day?.date) }}</template>
            </div>
            <h1 v-if="!editingCity" class="day-h1">
              <span class="day-h1-text">{{ day?.city || 'No city set' }}</span>
              <button
                type="button"
                class="day-h1-edit"
                aria-label="Change the city"
                @click="
                  editingCity = true;
                  cityDraft = day?.city || '';
                "
              >
                <i class="pi pi-pencil"></i>
              </button>
            </h1>
            <div v-else class="day-h1-form">
              <TfCitySearch
                v-model="cityDraft"
                placeholder="e.g. Tokyo, Kamakura"
                style="flex: 1"
                @select="onCitySelected"
              />
              <TfIconButton variant="ghost" size="sm" label="Save" @click="saveCity"
                ><i class="pi pi-check"></i
              ></TfIconButton>
              <TfIconButton variant="ghost" size="sm" label="Cancel" @click="editingCity = false"
                ><i class="pi pi-times"></i
              ></TfIconButton>
            </div>
          </div>
          <TfIconButton
            class="phone-hide"
            variant="outline"
            size="sm"
            label="Next day"
            :disabled="currentDayIndex >= allDays.length - 1"
            @click="goToDay(currentDayIndex + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </TfIconButton>
        </div>
        <div class="day-head-actions">
          <TfButton
            variant="secondary"
            size="sm"
            @click="showAutoPlan = true"
            title="Fill the days from your saved places, following the hotels"
          >
            <i class="pi pi-sparkles" style="font-size: 12px"></i>
            <span>Auto-plan</span>
          </TfButton>
          <TfButton
            v-if="activities.length > 1"
            variant="ghost"
            size="sm"
            @click="sortByTime"
            title="Reorder activities by their start time"
          >
            <i class="pi pi-sort-amount-down" style="font-size: 13px"></i>
            <span>Sort by time</span>
          </TfButton>
          <!-- Buffer days are their own reserve days now (the "+ Buffer" chip in
               the strip), so a dated day has nothing to toggle. -->
          <TfButton
            v-if="!day?.date"
            variant="ghost"
            size="sm"
            @click="removeReserveDay(day)"
            title="Remove this reserve day"
          >
            <i class="pi pi-trash" style="font-size: 13px"></i>
            <span>Remove reserve</span>
          </TfButton>
          <TfButton
            v-if="allDays.length > 1"
            variant="ghost"
            size="sm"
            @click="openSwapModal"
            title="Swap this day's plan with another day"
          >
            <i class="pi pi-arrow-right-arrow-left" style="font-size: 13px"></i>
            <span>Swap</span>
          </TfButton>
          <TfButton class="phone-hide" variant="primary" @click="openAddDialog">
            <i class="pi pi-plus" style="font-size: 14px"></i> Activity
          </TfButton>
        </div>
      </div>

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
          <div class="card day-facts">
            <!-- How full the day is: places you go to, and time spent getting there -->
            <div v-if="activities.length" class="fact">
              <i class="pi pi-clock fact-icon" title="Day"></i>
              <div class="day-load">
                <span
                  ><b>{{ dayBudget.stops }}</b> stop{{ dayBudget.stops === 1 ? '' : 's' }}</span
                >
                <span
                  ><span class="day-load-dot day-load-dot--visit"></span
                  >{{ fmtMin(dayBudget.visitMin) }} at places<span
                    v-if="dayBudget.untimed"
                    class="text-subtle"
                  >
                    · {{ dayBudget.untimed }} without a time</span
                  ></span
                >
                <span
                  ><span class="day-load-dot day-load-dot--travel"></span
                  >{{ fmtMin(dayBudget.travelMin) }} on the move</span
                >
              </div>
            </div>

            <!-- Overnight stay — only when the plan does not show it already: a
                 hotel's own row or an overnight flight says where the night is. -->
            <div v-if="!nightInPlan" class="fact">
              <i class="pi pi-moon fact-icon" title="Overnight"></i>

              <!-- Not editing -->
              <div v-if="!editingOvernight">
                <!-- Has overnight set -->
                <template v-if="day?.overnightStay">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span
                      style="
                        font: var(--fw-medium) 14px/18px var(--font-display);
                        color: var(--text-primary);
                      "
                    >
                      {{ day.overnightStay }}
                    </span>
                    <i
                      class="pi pi-pencil"
                      style="font-size: 11px; color: var(--text-secondary); cursor: pointer"
                      @click="
                        editingOvernight = true;
                        overnightDraft = day.overnightStay;
                      "
                    ></i>
                  </div>
                  <!-- Linked booking badge -->
                  <div
                    v-if="linkedBooking"
                    style="margin-top: 6px; display: flex; align-items: center; gap: 6px"
                  >
                    <TfBadge tone="accent" variant="soft">
                      <i class="pi pi-link" style="font-size: 10px"></i>
                      {{ linkedBooking.name
                      }}{{
                        linkedBooking.accommodationCity
                          ? ' · ' + linkedBooking.accommodationCity
                          : ''
                      }}
                    </TfBadge>
                    <TfTooltip text="Unlink booking">
                      <button
                        style="
                          background: none;
                          border: none;
                          color: var(--text-secondary);
                          font-size: 11px;
                          cursor: pointer;
                          padding: 2px;
                        "
                        @click="unlinkBooking"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </TfTooltip>
                  </div>
                </template>

                <!-- No overnight — show suggestion or placeholder -->
                <template v-else>
                  <!-- Booking suggestion available -->
                  <div v-if="overnightSuggestion">
                    <button
                      style="
                        border: 1.5px dashed var(--border-default);
                        background: transparent;
                        border-radius: var(--radius-md);
                        padding: 10px 14px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: var(--text-secondary);
                        font: var(--type-small);
                        width: 100%;
                        transition: all var(--dur-fast) var(--ease-out);
                        text-align: left;
                      "
                      @click="applyOvernightSuggestion"
                    >
                      <i
                        class="pi pi-sparkles"
                        style="color: var(--warning-300); font-size: 16px"
                      ></i>
                      <div>
                        <div
                          style="
                            font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                            color: var(--text-primary);
                          "
                        >
                          {{ overnightSuggestion.name }}
                        </div>
                        <div
                          style="
                            font: var(--fw-regular) 12px/1.2 var(--font-sans);
                            color: var(--text-secondary);
                            margin-top: 2px;
                          "
                        >
                          {{ overnightSuggestion.accommodationCity }} · from booking
                        </div>
                      </div>
                    </button>
                    <div
                      style="
                        margin-top: 6px;
                        font: var(--type-small);
                        color: var(--text-secondary);
                        cursor: pointer;
                      "
                      @click="
                        editingOvernight = true;
                        overnightDraft = '';
                      "
                    >
                      or enter manually...
                    </div>
                  </div>
                  <!-- No suggestion -->
                  <div
                    v-else
                    style="display: flex; align-items: center; gap: 8px; cursor: pointer"
                    @click="
                      editingOvernight = true;
                      overnightDraft = '';
                    "
                  >
                    <span
                      style="
                        font: var(--fw-regular) 14px/1.2 var(--font-sans);
                        color: var(--text-secondary);
                      "
                      >Not set — click to add</span
                    >
                  </div>
                </template>
              </div>

              <!-- Editing manually -->
              <div v-else style="display: flex; gap: 6px; align-items: center">
                <TfInput
                  v-model="overnightDraft"
                  placeholder="e.g. Friend's apartment, Airbnb..."
                  style="flex: 1"
                  @keyup.enter="saveOvernightManual"
                  @keyup.escape="editingOvernight = false"
                />
                <TfIconButton variant="ghost" size="sm" @click="saveOvernightManual"
                  ><i class="pi pi-check"></i
                ></TfIconButton>
                <TfIconButton variant="ghost" size="sm" @click="editingOvernight = false"
                  ><i class="pi pi-times"></i
                ></TfIconButton>
              </div>
            </div>
          </div>

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

        <!-- Right: day route map -->
        <!-- Beside the list on a laptop. On a phone the same aside is a sheet the
             dock slides up: a glance at the route, a tap on a saved place to add
             it, and back to the list. -->
        <aside class="itin-map" :class="{ 'is-open': mapOpen }">
          <div class="itin-map-head">
            <h3 style="font: var(--type-h3); margin: 0">Day route</h3>
            <span class="text-subtle text-sm"
              >{{ activityMarkers.length }} point{{ activityMarkers.length === 1 ? '' : 's' }}</span
            >
            <button
              type="button"
              class="itin-map-close"
              aria-label="Close the map"
              @click="mapOpen = false"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
          <BookingMap
            :markers="activityMarkers"
            :legs="mapLegs"
            :dots="libraryDots"
            numbered
            :height="mapHeight"
            @dot-add="onMapDotAdd"
            @dot-hide="hidePlace"
          />
          <div class="itin-map-legend">
            <span v-if="libraryDots.length">
              <i class="pi pi-circle-fill" style="font-size: 8px; color: var(--warning-500)"></i>
              {{ libraryDots.length }} saved place{{ libraryDots.length === 1 ? '' : 's' }} on the
              map — colour is the rating; click one for details, to add or to hide it.
            </span>
            <button v-if="hiddenIds.size" type="button" class="link-btn" @click="unhideAll">
              show {{ hiddenIds.size }} hidden
            </button>
          </div>
          <div v-if="routeTotal" class="itin-route-total">
            <i class="pi pi-directions"></i>
            <span
              >{{ fmtDur(routeTotal.durationSec) }} · {{ fmtDist(routeTotal.distanceM) }} ·
              {{ mappedStopCount }} stops</span
            >
          </div>
          <div v-if="!activityMarkers.length" class="itin-map-empty">
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
                  <i
                    class="pi"
                    :class="quickAddingId === p.id ? 'pi-spinner pi-spin' : 'pi-plus'"
                  ></i>
                </button>
                <button
                  type="button"
                  class="pick-more"
                  v-tooltip="'Add with times and notes'"
                  @click="openAddFromPlace(p)"
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  TfButton,
  TfIconButton,
  TfBadge,
  TfCitySearch,
  TfInput,
  TfSelect,
  TfModal,
  TfTooltip,
  toast,
  confirm,
} from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import AutoPlanModal from '@/components/AutoPlanModal.vue';
import DayStrip from '@/components/DayStrip.vue';
import DayDock from '@/components/DayDock.vue';
import StopCard from '@/components/StopCard.vue';
import LegRow from '@/components/LegRow.vue';
import StopDrawer from '@/components/StopDrawer.vue';
import {
  ACTIVITY_TYPES as typeOptions,
  typeIcon,
  typeLabel,
  catStyle,
} from '@/plan/activityTypes.js';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import {
  formatDayDate,
  placeTypeMeta,
  PLACE_TYPE_META,
  formatDuration as fmtDur,
  formatMinutes as fmtMin,
  formatDistance as fmtDist,
  distanceMeters,
} from '@tripyfull/core';
import { api } from '@tripyfull/core';
import {
  hasCoords,
  stopLat,
  stopLon,
  landsSameDay,
  legStart,
  isHotelRow,
  isJourneyRow,
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

// City + overnight editing
const editingCity = ref(false);
const cityDraft = ref('');
const editingOvernight = ref(false);
const overnightDraft = ref('');

// Library places for linking activities
const placesLib = ref([]);
const loadPlacesLib = async () => {
  try {
    placesLib.value = (await api.get('/api/places')).data || [];
  } catch {
    /* non-fatal */
  }
};

// Place-type meta for the "Add from places" cards (shared via @tripyfull/core).
const placeTypeEmoji = (t) => placeTypeMeta(t).emoji;
const placeTypeStyle = (t) => ({ background: placeTypeMeta(t).bg, color: placeTypeMeta(t).color });
// Untyped places read better as "Place" than "Other" on the cards.
const placeTypeLabel = (t) =>
  t && t !== 'OTHER' && PLACE_TYPE_META[t] ? PLACE_TYPE_META[t].label : 'Place';

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

// Saved places near the route: grey context dots on the map. Places already
// planned today are hidden — they're route pins.
/**
 * Every saved place in the current scope that is not planned yet — the map and
 * the candidate list show the same set, so whatever you spot on one you can act
 * on in the other.
 */
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
  const p = placesLib.value.find((x) => x.id === id);
  if (p) openAddFromPlace(p);
};

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

// Saved places in this day's city, for quick-add in the empty state.
/** The map is the widest thing here, so it follows the window's height. */
const mapHeight = ref(560);
const measureMap = () => {
  // In the phone's sheet the map takes half the screen; the legend, the route
  // total and the places to consider follow underneath.
  mapHeight.value = window.matchMedia('(max-width: 700px)').matches
    ? Math.round(window.innerHeight * 0.52)
    : Math.max(420, Math.min(760, window.innerHeight - 320));
};
/* The route map as a sheet over the list (phones); the dock toggles it. */
const mapOpen = ref(false);

/** km between two points — good enough to sort candidates by "how far off route". */
const distanceKm = (aLat, aLon, bLat, bLon) => distanceMeters([aLat, aLon], [bLat, bLon]) / 1000;

/** Rating wording shared with the places library. */

/** "Not today" — hiding declutters both the map and the list. It is a view
 *  choice, so it lives in the browser per trip, not in the trip's data. */
const HIDDEN_KEY = `tf.hiddenPlaces.${tripId}`;
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
  const name = placesLib.value.find((p) => p.id === id)?.name || 'Place';
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

/** A usable sightseeing day, the yardstick the budget bar measures against. */
/** "1 h 30 min" from minutes. */

/** How full the day is: stops, time at them, time on the move. A stop without a
    clock borrows its saved place's usual visit length. */
const dayBudget = computed(() =>
  dayLoad({
    activities: activities.value,
    date: day.value?.date,
    routeSeconds: routeTotal.value?.durationSec,
    visitMinutesFor: (a) =>
      a.fromBooking ? null : placesLib.value.find((x) => x.id === a.placeId)?.visitMinutes,
  }),
);

/** Places attached to this trip — the shortlist the day should be built from. */
const inThisTrip = (p) => (p.tripIds || []).includes(tripId);

/** The day's stops, so a candidate can be measured against the nearest one. */
const dayStops = computed(() =>
  activityMarkers.value.map((m, i) => ({ n: i + 1, name: m.label, lat: m.lat, lon: m.lon })),
);

/** Fallback anchor for an empty day: something saved in the day's own city. */
const cityAnchor = computed(() => {
  const withCity = placesLib.value.find(
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
  const c = (day.value?.city || '').trim().toLowerCase();
  if (!c) return true;
  const pc = (p.city || '').toLowerCase();
  return !!pc && (pc === c || pc.includes(c) || c.includes(pc));
};

/** Rating first (the strategy's whole point), then nearest among equals. */
const candidatePlaces = computed(() => {
  const planned = new Set(activities.value.map((a) => a.placeId).filter(Boolean));
  const fallback = cityAnchor.value;
  const byKm = (a, b) => (a.km == null ? 1e9 : a.km) - (b.km == null ? 1e9 : b.km);
  return (
    placesLib.value
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
    const res = await api.post(`/api/days/${dayId.value}/activities`, {
      name: p.name,
      type: placeToActivityType(p.type),
      address: p.address || null,
      placeId: p.id,
      needsBooking: !!p.needsBooking,
    });
    activities.value = [...activities.value, res.data];
    if (!placesLib.value.some((x) => x.id === p.id)) placesLib.value.unshift(p);

    if (near) {
      const ids = activities.value.map((a) => a.id).filter((id) => id !== res.data.id);
      const anchorId = activities.value.find((a) => a.name === near.name)?.id;
      const at = anchorId ? ids.indexOf(anchorId) + 1 : ids.length;
      ids.splice(at, 0, res.data.id);
      const ordered = await api.patch(`/api/days/${dayId.value}/activities/reorder`, {
        orderedIds: ids,
      });
      activities.value = ordered.data;
    }
    toast.success('Added', near ? `After ${near.n}. ${near.name}` : `${p.name} is in the day`);
  } catch {
    toast.danger('Error', 'Failed to add the place');
  } finally {
    quickAddingId.value = null;
  }
};

/** Flip any day between planned and buffer straight from the strip. */
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

// Find accommodation booking that covers this day's date (for suggestion)
const overnightSuggestion = computed(() => {
  if (!day.value?.date || day.value?.linkedBookingId) return null;
  const dayDate = day.value.date;
  return (
    bookings.value.find(
      (b) =>
        b.category === 'ACCOMMODATION' &&
        b.checkIn &&
        b.checkOut &&
        dayDate >= b.checkIn &&
        dayDate < b.checkOut,
    ) || null
  );
});

/* The night is already on the page when a stay has its evening row in the plan
   ("Check in", "Overnight", or a hotel stop of your own) or a journey lands on
   the next day; the overnight fact would say it twice. A "Check out" row is the
   morning after — it says nothing about where this night is spent. */
const nightInPlan = computed(() =>
  activities.value.some(
    (a) =>
      (isHotelRow(a) && !(a.fromBooking && /^Check out · /.test(a.name || ''))) ||
      (isJourneyRow(a) &&
        day.value?.date &&
        a.bookingArrivalAt &&
        String(a.bookingArrivalAt).slice(0, 10) > day.value.date),
  ),
);

// Find the linked booking (when day has linkedBookingId)
const linkedBooking = computed(() => {
  if (!day.value?.linkedBookingId) return null;
  return bookings.value.find((b) => b.id === day.value.linkedBookingId) || null;
});

const onCitySelected = (item) => {
  cityDraft.value = item.name;
  saveCity();
};

const saveCity = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, { city: cityDraft.value });
    updateDayLocal(res.data);
    editingCity.value = false;
  } catch {
    toast.danger('Error', 'Failed to update city');
  }
};

// Manual overnight entry — no booking link
const saveOvernightManual = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, {
      overnightStay: overnightDraft.value,
      clearLinkedBooking: true,
    });
    updateDayLocal(res.data);
    editingOvernight.value = false;
  } catch {
    toast.danger('Error', 'Failed to update overnight');
  }
};

// Apply from booking — saves overnight + city + booking link
const applyOvernightSuggestion = async () => {
  if (!overnightSuggestion.value) return;
  const booking = overnightSuggestion.value;
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, {
      overnightStay: booking.name,
      city: booking.accommodationCity,
      linkedBookingId: booking.id,
    });
    updateDayLocal(res.data);
  } catch {
    toast.danger('Error', 'Failed to link booking');
  }
};

// Unlink booking but keep the text
const unlinkBooking = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, { clearLinkedBooking: true });
    updateDayLocal(res.data);
  } catch {
    toast.danger('Error', 'Failed to unlink');
  }
};

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
  editingCity.value = false;
  editingOvernight.value = false;
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

onMounted(() => {
  loadHidden();
  measureMap();
  window.addEventListener('resize', measureMap);
});
onBeforeUnmount(() => window.removeEventListener('resize', measureMap));

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
/* The sheet's close button exists for phones; see the block below. */
.itin-map-close {
  display: none;
}
/* The day's head: arrows around the title on the left, the day's tools on the right. */
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.day-head-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.day-h1 {
  font: var(--fw-bold) 30px/1 var(--font-display);
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.day-h1-text {
  min-width: 0;
}
/* The pencil that changes the city: quiet until the title is hovered. */
.day-h1-edit {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-disabled);
  font-size: 14px;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}
.day-h1:hover .day-h1-edit,
.day-h1-edit:focus-visible {
  color: var(--text-secondary);
}
.day-h1-edit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--input-select-focus-bg);
}
.day-h1-form {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 320px;
}
/* City, day load and overnight stay: a slim strip, side by side while they
   fit. Each fact is its icon and its value on one line; the icon stands for
   the title ("Visiting", "Day", "Overnight" are its tooltip). */
.day-facts {
  margin-bottom: 16px;
  padding: 10px 14px;
  display: flex;
  gap: 6px 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.fact {
  /* Natural widths: the city is short, the load is long, and the overnight
  stay with its booking badge takes the next line rather than squeezing. */
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
/* Icon and value share one 18px line, so the icon sits level with the first
   line of text whatever the fact is. */
.fact-icon {
  flex: none;
  color: var(--accent);
  font-size: 15px;
  line-height: 18px;
}
.fact > :not(.fact-icon) {
  flex: 1;
  min-width: 0;
}
/* The day's own buttons: they wrap under the title rather than push the page. */
.day-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
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
@media (max-width: 1024px) {
  .itin-map {
    position: static;
  }
  .itin-map-empty {
    height: 280px;
  }
}
.timeline-time--derived {
  color: var(--text-disabled);
  font-style: italic;
}
.day-load {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font: var(--fw-medium) 13px/18px var(--font-sans);
  color: var(--text-secondary);
}
.day-load b {
  color: var(--text-primary);
}
.day-load-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: 1px;
}
.day-load-dot--visit {
  background: var(--primary);
}
.day-load-dot--travel {
  background: var(--warning-500);
}
@media (max-width: 700px) {
  /* The head stacks: the title takes the width, and the day's three tools sit
     in one short row under it instead of piling up beside a two-line city. */
  .day-head {
    flex-wrap: wrap;
    gap: 8px 0;
    margin-bottom: 16px;
  }
  .day-head-main {
    flex: 1 1 100%;
  }
  .day-h1 {
    font-size: 24px;
    line-height: 1.1;
  }
  .day-h1-edit {
    width: 38px;
    height: 38px;
    color: var(--text-secondary);
  }
  .day-h1-form {
    min-width: 0;
  }
  /* Room under the list for the dock. */
  .itin-layout {
    padding-bottom: 72px;
  }
  .itin-main {
    display: flex;
    flex-direction: column;
  }
  /* The three tools share one row: a little less air inside each button. */
  .day-head-actions {
    gap: 6px;
  }
  .day-head-actions .btn {
    padding-inline: 10px;
  }
  /* One fact per line on a phone. */
  .day-facts {
    margin: 0 0 12px;
    padding: 10px 12px;
  }
  .fact {
    flex-basis: 100%;
  }
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
  /* 22px of card around a stop is a laptop's air; the facts column gets it. */
  .timeline-content :deep(.tf-card) {
    padding: 14px;
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
