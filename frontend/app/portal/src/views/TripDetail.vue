<template>
  <div class="page-content page-content--full">
    <div v-if="store.loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 40px; width: 280px"></div>
      <div class="dash-tiles">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 120px"></div>
      </div>
      <div class="skeleton" style="height: 260px"></div>
    </div>

    <template v-else-if="trip">
      <!-- Head: what trip, when, and how far away it is -->
      <div class="page-head">
        <div>
          <div class="tf-eyebrow" style="margin-bottom: 8px">{{ statusLabel(trip.status) }}</div>
          <h1>{{ trip.title }}</h1>
          <p>
            {{ trip.destination || '' }}{{ trip.destination && trip.startDate ? ' · ' : ''
            }}{{ formatDateRange(trip.startDate, trip.endDate) }}
          </p>
        </div>
        <div class="page-head-actions">
          <div v-if="countdown" class="dash-countdown" :class="`dash-countdown--${phase}`">
            <span class="dash-countdown-num">{{ countdown.num }}</span>
            <span class="dash-countdown-text">{{ countdown.text }}</span>
          </div>
          <TfButton variant="secondary" title="Edit the trip" @click="startEdit">
            <i class="pi pi-pencil" style="font-size: 14px"></i>
            <span class="phone-hide">Edit</span>
          </TfButton>
          <TfButton variant="ghost" title="Printable route book" @click="printTrip">
            <i class="pi pi-print" style="font-size: 14px"></i>
            <span class="phone-hide">Print</span>
          </TfButton>
        </div>
      </div>

      <!-- No dates: nothing below can be computed, so say the one thing that matters -->
      <div v-if="!(trip.startDate && trip.endDate)" class="empty-state" style="margin-bottom: 24px">
        <div class="empty-state-icon"><i class="pi pi-calendar"></i></div>
        <h3>Set the dates first</h3>
        <p>Days, nights, due dates and the countdown all hang off them.</p>
        <TfButton variant="primary" @click="startEdit">
          <i class="pi pi-calendar-plus" style="font-size: 14px"></i> Set dates
        </TfButton>
      </div>

      <template v-else>
        <!-- Readiness: four things a trip needs, each with how far along it is -->
        <div class="dash-tiles">
          <button type="button" class="dash-tile" @click="goToFirstDay">
            <div class="dash-tile-head">
              <span class="dash-tile-label"><TfIcon name="route" /> Itinerary</span>
              <i class="pi pi-chevron-right"></i>
            </div>
            <div class="dash-tile-value">
              {{ plannedDays.length
              }}<span class="dash-tile-of">/ {{ datedDays.length }} days</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: pct(plannedDays.length, datedDays.length) + '%',
                  background: 'var(--primary)',
                }"
              ></div>
            </div>
            <div class="dash-tile-sub">
              {{
                emptyDays.length
                  ? `${emptyDays.length} day${emptyDays.length === 1 ? '' : 's'} still empty`
                  : 'every day has a plan'
              }}<template v-if="reserveDays.length"> · {{ reserveDays.length }} reserve</template>
            </div>
          </button>

          <button
            type="button"
            class="dash-tile"
            @click="$router.push(`/trips/${tripId}/bookings`)"
          >
            <div class="dash-tile-head">
              <span class="dash-tile-label"><TfIcon name="confirmation_number" /> Bookings</span>
              <i class="pi pi-chevron-right"></i>
            </div>
            <div class="dash-tile-value">
              {{ coveredNights }}<span class="dash-tile-of">/ {{ nightsTotal }} nights</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: pct(coveredNights, nightsTotal) + '%',
                  background: 'var(--primary)',
                }"
              ></div>
            </div>
            <div class="dash-tile-sub">
              {{
                bookings.length
                  ? `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`
                  : 'nothing booked yet'
              }}<template v-if="gaps.length">
                · {{ gaps.length }} gap{{ gaps.length === 1 ? '' : 's' }} without a hotel</template
              >
            </div>
          </button>

          <button type="button" class="dash-tile" @click="$router.push(`/trips/${tripId}/budget`)">
            <div class="dash-tile-head">
              <span class="dash-tile-label"><TfIcon name="account_balance_wallet" /> Budget</span>
              <i class="pi pi-chevron-right"></i>
            </div>
            <div class="dash-tile-value dash-tile-value--money">
              {{ fmtMoney(tripCost) }}<span class="dash-tile-of">{{ currency }}</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: paidPct + '%', background: 'var(--success-500)' }"
              ></div>
            </div>
            <div class="dash-tile-sub">
              <template v-if="!budgetData || !Number(budgetData.bookingsTotal)"
                >no costs yet</template
              >
              <template v-else-if="remaining > 0"
                >{{ paidPct }}% paid · {{ fmtMoney(remaining) }} {{ currency }} to go</template
              >
              <template v-else>everything paid</template>
            </div>
          </button>

          <button type="button" class="dash-tile" @click="$router.push(`/trips/${tripId}/todos`)">
            <div class="dash-tile-head">
              <span class="dash-tile-label"><TfIcon name="checklist" /> To-do</span>
              <i class="pi pi-chevron-right"></i>
            </div>
            <div class="dash-tile-value">
              {{ todosDone }}<span class="dash-tile-of">/ {{ todos.length }} done</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{
                  width: pct(todosDone, todos.length) + '%',
                  background: todosOverdue ? 'var(--danger-500)' : 'var(--primary)',
                }"
              ></div>
            </div>
            <div class="dash-tile-sub" :class="{ 'is-warn': todosOverdue }">
              <template v-if="!todos.length">start from our suggestions</template>
              <template v-else-if="todosOverdue">{{ todosOverdue }} overdue</template>
              <template v-else-if="todosSoon">{{ todosSoon }} due this week</template>
              <template v-else>nothing pressing</template>
            </div>
          </button>
        </div>

        <div class="dash-cols">
          <!-- Left: what happens next, across everything -->
          <div class="card">
            <div class="dash-card-head">
              <h3>Coming up</h3>
              <span class="text-subtle text-sm">{{
                phase === 'before'
                  ? 'before you leave'
                  : phase === 'during'
                    ? 'on the trip'
                    : 'after the trip'
              }}</span>
            </div>
            <div v-if="!agenda.length" class="dash-empty">
              <i class="pi pi-check-circle"></i> Nothing due — the plan is quiet.
            </div>
            <div v-else class="dash-list">
              <button
                v-for="item in agenda"
                :key="item.key"
                type="button"
                class="dash-row"
                @click="$router.push(item.to)"
              >
                <div
                  class="dash-row-date"
                  :class="{ 'is-late': item.late, 'is-today': item.today }"
                >
                  <span class="dash-row-day">{{ item.dayNum }}</span>
                  <span class="dash-row-mon">{{ item.mon }}</span>
                </div>
                <div class="cat-icon cat-icon--sm" :style="item.style">{{ item.icon }}</div>
                <div style="flex: 1; min-width: 0">
                  <div class="dash-row-title">{{ item.title }}</div>
                  <div class="dash-row-sub">{{ item.sub }}</div>
                </div>
                <span v-if="item.amount" class="money money--sm">{{ item.amount }}</span>
                <TfBadge v-else-if="item.late" size="sm" tone="danger" variant="soft">late</TfBadge>
              </button>
            </div>
          </div>

          <div class="dash-side">
            <!-- The shortlist against the strategy -->
            <div class="card">
              <div class="dash-card-head">
                <h3>Places</h3>
                <button
                  type="button"
                  class="link-btn"
                  @click="$router.push(`/trips/${tripId}/map`)"
                >
                  Plan map
                </button>
              </div>
              <div v-if="!places.length" class="dash-empty">
                <i class="pi pi-map-marker"></i>
                <span
                  >No places on the shortlist yet —
                  <router-link :to="`/trips/${tripId}/places`">add some</router-link>.</span
                >
              </div>
              <template v-else>
                <div class="dash-ratings">
                  <div
                    v-for="r in [5, 4, 3, 2, 1]"
                    :key="r"
                    class="dash-rating"
                    :class="{ 'is-empty': !ratingCount(r) }"
                  >
                    <span class="dash-rating-dot" :style="{ background: ratingColor(r) }"></span>
                    <span class="dash-rating-n">{{ ratingCount(r) }}</span>
                    <span class="dash-rating-lbl">{{ r }}★</span>
                  </div>
                </div>
                <div class="dash-kv">
                  <span>In the plan</span>
                  <strong>{{ plannedPlaceIds.size }} of {{ places.length }}</strong>
                </div>
                <div class="dash-kv" :class="{ 'is-warn': mustSeesLeft.length }">
                  <span>Must-sees not planned yet</span>
                  <strong>{{ mustSeesLeft.length }}</strong>
                </div>
                <div v-if="mustSeesLeft.length" class="dash-chips">
                  <span v-for="p in mustSeesLeft.slice(0, 4)" :key="p.id" class="chip">{{
                    p.name
                  }}</span>
                  <span v-if="mustSeesLeft.length > 4" class="text-subtle text-xs"
                    >+{{ mustSeesLeft.length - 4 }}</span
                  >
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Days: the whole trip at a glance, still one click from each day -->
        <div class="dash-card-head" style="margin: 24px 0 12px">
          <h3>Trip days</h3>
          <div style="display: flex; gap: 8px; align-items: center">
            <TfButton v-if="days.length" size="sm" variant="ghost" @click="goToFirstDay">
              Open itinerary <i class="pi pi-chevron-right" style="font-size: 12px"></i>
            </TfButton>
          </div>
        </div>

        <div v-if="daysLoading" class="dash-days">
          <div v-for="i in 6" :key="i" class="skeleton" style="height: 92px"></div>
        </div>
        <div v-else-if="days.length" class="dash-days">
          <button
            v-for="day in days"
            :key="day.id"
            type="button"
            class="dash-day"
            :class="{
              'is-empty': !day.activityCount && !day.isBuffer,
              'is-today': isToday(day.date),
            }"
            @click="$router.push(`/trips/${tripId}/days/${day.id}`)"
          >
            <div class="dash-day-head">
              <span class="dash-day-num">{{
                day.isBuffer ? 'Reserve' : 'Day ' + day.dayNumber
              }}</span>
              <span class="dash-day-date">{{ day.date ? formatDayDate(day.date) : '—' }}</span>
            </div>
            <div v-if="editingDayId === day.id" class="dash-day-edit" @click.stop>
              <TfInput
                v-model="dayEditCity"
                placeholder="City"
                style="flex: 1"
                @keyup.enter="saveDayCity(day.id)"
                @keyup.escape="editingDayId = null"
              />
              <TfIconButton variant="ghost" size="sm" @click="saveDayCity(day.id)"
                ><i class="pi pi-check"></i
              ></TfIconButton>
            </div>
            <div v-else class="dash-day-city" @click.stop="startDayEdit(day)">
              {{ day.city || 'Set city…' }}
            </div>
            <div class="dash-day-foot">
              <span>
                {{
                  day.activityCount
                    ? `${day.activityCount} stop${day.activityCount === 1 ? '' : 's'}`
                    : 'nothing planned'
                }}
                <template v-if="day.travelSeconds">
                  · {{ fmtDur(day.travelSeconds) }} on the move</template
                >
              </span>
              <span v-if="day.overnightStay" class="dash-day-night" v-tooltip="day.overnightStay"
                >🏨</span
              >
            </div>
          </button>
        </div>
      </template>
    </template>

    <!-- Edit Drawer -->
    <TfDrawer v-model="editing" title="Edit trip" :eyebrow="trip?.title">
      <form @submit.prevent="saveEdit" style="display: flex; flex-direction: column; gap: 16px">
        <TfInput label="Title *" v-model="editForm.title" required class="w-full" />
        <div class="field">
          <label>Destination</label>
          <TfCitySearch v-model="editForm.destination" placeholder="City or country" />
        </div>
        <div class="field">
          <label>Dates</label>
          <TfDatePicker v-model="editDateRange" mode="range" class="w-full" />
          <small
            v-if="days.length"
            style="color: var(--text-secondary); margin-top: 6px; display: block"
          >
            Moving the dates shifts the whole itinerary — days keep their order and plans.
          </small>
        </div>
        <TfSelect label="Status" v-model="editStatusLabel" :options="statusLabels" class="w-full" />
      </form>
      <template #footer>
        <TfButton variant="primary" style="flex: 1" @click="saveEdit" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </TfButton>
        <TfButton variant="ghost" @click="editing = false">Cancel</TfButton>
      </template>
    </TfDrawer>

    <!-- Reschedule confirmation -->
    <TfModal v-model="rescheduleConfirm" title="Move trip dates?">
      <div v-if="rescheduleImpact" style="display: flex; flex-direction: column; gap: 12px">
        <p style="margin: 0; color: var(--text-primary)">
          New dates:
          <strong
            >{{ formatDate(pendingEdit?.startDate) }} –
            {{ formatDate(pendingEdit?.endDate) }}</strong
          >
        </p>
        <ul
          style="
            margin: 0;
            padding-left: 18px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            color: var(--text-primary);
          "
        >
          <li v-if="rescheduleImpact.delta !== 0">
            The itinerary shifts
            <strong
              >{{ Math.abs(rescheduleImpact.delta) }} day{{
                Math.abs(rescheduleImpact.delta) === 1 ? '' : 's'
              }}
              {{ rescheduleImpact.delta > 0 ? 'later' : 'earlier' }}</strong
            >
            — day order and plans are kept.
          </li>
          <li v-else>Days keep their plans; only the end of the range changes.</li>
          <li v-if="rescheduleImpact.removed > 0" style="color: var(--danger-700)">
            <strong
              >{{ rescheduleImpact.removed }} day{{
                rescheduleImpact.removed === 1 ? '' : 's'
              }}</strong
            >
            now outside the range will be deleted, together with their activities.
          </li>
          <li v-if="rescheduleImpact.added > 0">
            <strong
              >{{ rescheduleImpact.added }} empty day{{
                rescheduleImpact.added === 1 ? '' : 's'
              }}</strong
            >
            will be added to fill the new range.
          </li>
        </ul>
      </div>
      <template #footer>
        <TfButton variant="ghost" @click="rescheduleConfirm = false">Cancel</TfButton>
        <TfButton variant="primary" @click="confirmReschedule" :disabled="saving">
          {{ saving ? 'Moving...' : 'Move trip' }}
        </TfButton>
      </template>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '@/stores/tripStore.js';
import {
  TfButton,
  TfBadge,
  TfIcon,
  TfIconButton,
  TfDrawer,
  TfCitySearch,
  TfInput,
  TfSelect,
  TfDatePicker,
  TfModal,
  toast,
} from '@tripyfull/ui';
import {
  baseCurrency as accountCurrency,
  bookingEmoji,
  MODE_LABEL,
  formatDuration as fmtDur,
} from '@tripyfull/core';
import { buildTripDocument, collectPhotoUrls, probeImages } from '@/print/tripDocument.js';
import { buildRouteMap } from '@/print/routeMap.js';
import { collectMapPoints } from '@/plan/routePoints.js';
import { api } from '@tripyfull/core';
import {
  toDateStr,
  parseDate,
  diffInDays,
  formatDateShort,
  formatDayDate,
  formatDateRange,
  tripStatusLabel as statusLabel,
  tripStatusTone as statusTone,
} from '@tripyfull/core';

const route = useRoute();
const router = useRouter();
const store = useTripStore();

const tripId = route.params.id;
const trip = ref(null);
const days = ref([]);
const budgetData = ref(null);
const editing = ref(false);
const saving = ref(false);
const editForm = ref({});
const editDateRange = ref(null);
const daysLoading = ref(false);
const rescheduleConfirm = ref(false);
const pendingEdit = ref(null);
const editingDayId = ref(null);
const dayEditCity = ref('');

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

const statusLabels = statusOptions.map((o) => o.label);
const editStatusLabel = computed({
  get: () => statusOptions.find((o) => o.value === editForm.value.status)?.label ?? null,
  set: (label) => {
    editForm.value.status = statusOptions.find((o) => o.label === label)?.value;
  },
});

const fmtMoney = (v) => Number(v || 0).toFixed(2);

/* ---- the rest of the trip, loaded alongside the days ---- */
const bookings = ref([]);
const todos = ref([]);
const places = ref([]);
const plannedPlaceIds = ref(new Set());
const currency = computed(() => budgetData.value?.baseCurrency || accountCurrency.value);

const todayStr = () => toDateStr(new Date());
const isToday = (d) => d === todayStr();

/* ---- where in time the trip is ---- */
const phase = computed(() => {
  if (!trip.value?.startDate) return 'before';
  const t = todayStr();
  if (t < trip.value.startDate) return 'before';
  if (t > trip.value.endDate) return 'after';
  return 'during';
});
const countdown = computed(() => {
  if (!trip.value?.startDate || !trip.value?.endDate) return null;
  const t = todayStr();
  if (phase.value === 'before') {
    const n = diffInDays(t, trip.value.startDate);
    return { num: n, text: n === 1 ? 'day to go' : 'days to go' };
  }
  if (phase.value === 'during') {
    return {
      num: diffInDays(trip.value.startDate, t) + 1,
      text: `of ${datedDays.value.length} days`,
    };
  }
  const n = diffInDays(trip.value.endDate, t);
  return { num: n, text: n === 1 ? 'day since' : 'days since' };
});

/* ---- itinerary ---- */
const datedDays = computed(() => days.value.filter((d) => d.date));
const reserveDays = computed(() => days.value.filter((d) => !d.date));
const plannedDays = computed(() => datedDays.value.filter((d) => d.activityCount > 0));
const emptyDays = computed(() => datedDays.value.filter((d) => !d.activityCount));
const pct = (a, b) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ---- nights: every dated day but the last is a night somewhere ---- */
const nightDays = computed(() => datedDays.value.slice(0, -1));
const nightsTotal = computed(() => nightDays.value.length);
const coveredNights = computed(() => nightDays.value.filter((d) => d.overnightStay).length);
// Consecutive nights at the same place fold into one row; nights with nothing
// booked fold into one gap, so the list reads like the trip does.
const stays = computed(() => {
  const out = [];
  for (const d of nightDays.value) {
    const name = d.overnightStay || null;
    const last = out[out.length - 1];
    if (last && last.name === name) {
      last.nights += 1;
      last.toDate = d.date;
    } else {
      out.push({ key: d.id, name, gap: !name, nights: 1, fromDate: d.date, toDate: d.date });
    }
  }
  return out.map((s) => ({
    ...s,
    range:
      s.nights === 1
        ? formatDateShort(s.fromDate)
        : `${formatDateShort(s.fromDate)} – ${formatDateShort(s.toDate)}`,
  }));
});
const gaps = computed(() => stays.value.filter((s) => s.gap));

/* ---- money (the budget endpoint does the converting) ---- */
const tripCost = computed(
  () => Number(budgetData.value?.bookingsTotal || 0) + Number(budgetData.value?.expensesTotal || 0),
);
const remaining = computed(() => Number(budgetData.value?.bookingsRemaining || 0));
const paidPct = computed(() =>
  pct(Number(budgetData.value?.bookingsPaid || 0), Number(budgetData.value?.bookingsTotal || 0)),
);

/* ---- to-dos ---- */
const todosDone = computed(() => todos.value.filter((t) => t.done).length);
const todoDays = (t) => diffInDays(todayStr(), t.dueDate);
const todosOverdue = computed(
  () => todos.value.filter((t) => !t.done && t.dueDate && todoDays(t) < 0).length,
);
const todosSoon = computed(
  () =>
    todos.value.filter((t) => !t.done && t.dueDate && todoDays(t) >= 0 && todoDays(t) <= 7).length,
);

/* ---- places against the rating strategy ---- */
const ratingCount = (r) => places.value.filter((p) => (p.rating || 3) === r).length;
const ratingColor = (r) =>
  ({ 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#78716c', 1: '#a8a29e' })[r];
const mustSeesLeft = computed(() =>
  places.value.filter((p) => p.rating === 5 && !plannedPlaceIds.value.has(p.id)),
);

/* ---- coming up: the three nearest things, to-dos and events together ----
   Events are what happens on a date: a payment falling due, the departure, a
   booking — a flight leaving, a check-in, a booked activity. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateParts = (iso) => {
  const d = parseDate(iso);
  return { dayNum: d.getDate(), mon: MON[d.getMonth()] };
};
const byDate = (a, b) => a.date.localeCompare(b.date);
const clock = (dt) => (dt ? ' ' + String(dt).slice(11, 16) : '');

/** The day a booking happens on: check-in for a stay, departure otherwise. */
const bookingDate = (b) =>
  b.category === 'ACCOMMODATION' ? b.checkIn : b.departureAt ? b.departureAt.slice(0, 10) : null;

const bookingSub = (b) => {
  if (b.category === 'ACCOMMODATION') {
    const time = b.checkInTime ? ' ' + String(b.checkInTime).slice(0, 5) : '';
    return `Check-in${time}${b.accommodationCity ? ` · ${b.accommodationCity}` : ''}`;
  }
  if (b.category === 'TRANSPORTATION') {
    const what = MODE_LABEL[b.transportMode] || 'Journey';
    const route = b.fromPlace && b.toPlace ? ` · ${b.fromPlace} → ${b.toPlace}` : '';
    return `${what}${clock(b.departureAt)}${route}`;
  }
  return `Activity${clock(b.departureAt)}${b.fromPlace ? ` · ${b.fromPlace}` : ''}`;
};

const agenda = computed(() => {
  const t = todayStr();
  const items = [];
  for (const td of todos.value) {
    if (td.done || !td.dueDate) continue;
    const n = diffInDays(t, td.dueDate);
    items.push({
      key: 'todo-' + td.id,
      date: td.dueDate,
      title: td.title,
      sub: td.groupName ? `To-do · ${td.groupName}` : 'To-do',
      icon: '\u2611\uFE0F',
      style: { background: 'var(--success-100)', color: 'var(--primary)' },
      late: n < 0,
      today: n === 0,
      to: `/trips/${tripId}/todos`,
    });
  }
  for (const p of budgetData.value?.upcomingPayments || []) {
    if (!p.dueDate) continue;
    const n = diffInDays(t, p.dueDate);
    items.push({
      key: 'pay-' + p.paymentId,
      date: p.dueDate,
      title: p.bookingName,
      sub: 'Payment due',
      icon: '\u{1F4B3}',
      style: { background: 'var(--warning-100)', color: 'var(--warning-500)' },
      amount: `${fmtMoney(p.amount)} ${currency.value}`,
      late: n < 0,
      today: n === 0,
      to: `/trips/${tripId}/bookings`,
    });
  }
  if (phase.value === 'before' && trip.value?.startDate) {
    items.push({
      key: 'departure',
      date: trip.value.startDate,
      title: 'Departure',
      sub: trip.value.destination ? `Off to ${trip.value.destination}` : 'The trip begins',
      icon: '\u2708\uFE0F',
      style: { background: 'var(--success-100)', color: 'var(--accent)' },
      to: `/trips/${tripId}/itinerary`,
    });
  }
  for (const b of bookings.value) {
    const date = bookingDate(b);
    if (!date || date < t) continue; // a booking that has happened is not coming up
    items.push({
      key: 'booking-' + b.id,
      date,
      title: b.name,
      sub: bookingSub(b),
      icon: bookingEmoji(b),
      style: { background: 'var(--success-100)', color: 'var(--accent)' },
      today: date === t,
      to: `/trips/${tripId}/bookings`,
    });
  }
  return items
    .sort(byDate)
    .slice(0, 3)
    .map((i) => ({ ...i, ...dateParts(i.date) }));
});

// What will happen to the itinerary if the edited dates are applied.
const rescheduleImpact = computed(() => {
  const start = editDateRange.value?.[0];
  const end = editDateRange.value?.[1];
  if (!start || !end || !trip.value?.startDate) return null;
  const delta = diffInDays(trip.value.startDate, start);
  const origLen = days.value.length;
  const rangeLen = diffInDays(start, end) + 1;
  const kept = Math.min(origLen, rangeLen);
  return { delta, rangeLen, origLen, removed: origLen - kept, added: rangeLen - kept };
});

const startEdit = () => {
  editForm.value = {
    title: trip.value.title,
    destination: trip.value.destination || '',
    status: trip.value.status,
  };
  editDateRange.value =
    trip.value.startDate && trip.value.endDate
      ? [parseDate(trip.value.startDate), parseDate(trip.value.endDate)]
      : null;
  editing.value = true;
};

const persistEdit = async (payload, smart) => {
  saving.value = true;
  try {
    const updated = smart
      ? await store.reschedule(tripId, payload)
      : await store.update(tripId, payload);
    trip.value = updated;
    // Plain updates can auto-generate days too (dates set on a day-less trip).
    await fetchDays();
    editing.value = false;
    rescheduleConfirm.value = false;
    pendingEdit.value = null;
    toast.success('Saved', smart ? 'Trip moved — itinerary updated' : 'Trip updated');
  } catch {
    toast.danger('Error', 'Failed to update trip');
  } finally {
    saving.value = false;
  }
};

const saveEdit = async () => {
  const payload = {
    ...editForm.value,
    startDate: toDateStr(editDateRange.value?.[0]),
    endDate: toDateStr(editDateRange.value?.[1]),
  };
  const datesChanged =
    payload.startDate !== (trip.value.startDate || null) ||
    payload.endDate !== (trip.value.endDate || null);

  // Shifting dates re-bases existing days — confirm first so the user knows
  // which days will be dropped/added.
  if (datesChanged && payload.startDate && payload.endDate && days.value.length) {
    pendingEdit.value = payload;
    rescheduleConfirm.value = true;
    return;
  }
  await persistEdit(payload, false);
};

const confirmReschedule = () => persistEdit(pendingEdit.value, true);

const printTrip = async () => {
  try {
    // Open the window first: browsers only allow it in the click's own turn,
    // and the photo check below takes a moment.
    const w = window.open('', '_blank');
    if (!w) {
      toast.danger('Blocked', 'The browser blocked the new window — allow pop-ups for this site');
      return;
    }
    w.document.write('<p style="font:14px sans-serif;padding:24px">Preparing the document…</p>');
    const apiBase = import.meta.env.VITE_API_URL || '';
    const res = await api.get(`/api/trips/${tripId}/export`);
    const [liveUrls, map] = await Promise.all([
      probeImages(collectPhotoUrls(res.data, apiBase)),
      buildRouteMap(collectMapPoints(res.data)).catch(() => null),
    ]);
    if (map?.tilesMissing) {
      const where = `${map.tilesMissing} of ${map.tilesTotal} map tiles did not load (${map.reason})`;
      toast.warning(
        'Route map',
        map.dataUrl ? `${where} — the map has gaps` : `${where} — the book goes without the map`,
      );
    }
    const doc = buildTripDocument(res.data, {
      apiBase,
      currency: accountCurrency.value,
      liveUrls,
      mapImage: map?.dataUrl ?? null,
    });
    w.document.open();
    w.document.write(doc.html(true));
    w.document.close();
    // Word opens an HTML file saved as .doc as a normal document, styles and all.
    w.__saveDoc = () => {
      const blob = new Blob(['\ufeff', doc.html(false)], { type: 'application/msword' });
      const a = w.document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(res.data.title || 'trip').replace(/[\\/:*?"<>|]+/g, ' ').trim()}.doc`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
  } catch {
    toast.danger('Error', 'Failed to export');
  }
};

// One-shot guard: only try the automatic backfill once per visit.
let autoGenerateTried = false;

const fetchDays = async () => {
  daysLoading.value = true;
  try {
    const res = await api.get(`/api/trips/${tripId}/days`);
    days.value = res.data;
    // Legacy trips: dates set but days never generated — create them automatically
    // (the endpoint only ever runs against an empty day list here).
    if (!days.value.length && trip.value?.startDate && trip.value?.endDate && !autoGenerateTried) {
      autoGenerateTried = true;
      const gen = await api.post(`/api/trips/${tripId}/days`);
      days.value = gen.data;
    }
  } catch {
    // no days yet
  } finally {
    daysLoading.value = false;
  }
};

const goToFirstDay = () => {
  if (days.value.length) {
    router.push(`/trips/${tripId}/days/${days.value[0].id}`);
  }
};

const startDayEdit = (day) => {
  editingDayId.value = day.id;
  dayEditCity.value = day.city || '';
};

const saveDayCity = async (dayId) => {
  try {
    const res = await api.patch(`/api/days/${dayId}`, { city: dayEditCity.value });
    const idx = days.value.findIndex((d) => d.id === dayId);
    if (idx !== -1) days.value[idx] = res.data;
    editingDayId.value = null;
  } catch {
    toast.danger('Error', 'Failed to update day');
  }
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

onMounted(async () => {
  try {
    trip.value = await store.fetchById(tripId);
    await fetchDays();
    // Each block of the dashboard fails on its own; one missing piece must not
    // blank the page.
    const quiet = (p, fallback) => p.then((r) => r.data).catch(() => fallback);
    const [budget, bk, td, pl, planned] = await Promise.all([
      quiet(api.get(`/api/trips/${tripId}/budget`), null),
      quiet(api.get(`/api/trips/${tripId}/bookings`), []),
      quiet(api.get(`/api/trips/${tripId}/todos`), []),
      quiet(api.get('/api/places', { params: { tripId } }), []),
      quiet(api.get(`/api/trips/${tripId}/planned-places`), []),
    ]);
    budgetData.value = budget;
    bookings.value = bk;
    todos.value = td;
    places.value = pl;
    plannedPlaceIds.value = new Set(planned.map((p) => p.placeId));
  } catch {
    toast.danger('Error', 'Failed to load trip');
  }
});
</script>
