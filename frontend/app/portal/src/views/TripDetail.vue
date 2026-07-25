<template>
  <div class="page-content">
    <div v-if="store.loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 40px; width: 280px"></div>
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px">
        <div class="skeleton" style="height: 200px"></div>
        <div class="skeleton" style="height: 200px"></div>
      </div>
    </div>

    <template v-else-if="trip">
      <!-- Page head -->
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
          <TfButton variant="secondary" @click="startEdit">
            <i class="pi pi-pencil" style="font-size: 14px"></i> Edit
          </TfButton>
          <TfButton variant="ghost" @click="printTrip">
            <i class="pi pi-print" style="font-size: 14px"></i> Print
          </TfButton>
        </div>
      </div>

      <!-- Budget + Upcoming payments -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px">
        <!-- Budget summary -->
        <div class="card">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 18px;
            "
          >
            <h3 style="font: var(--type-h3); margin: 0">Budget</h3>
            <TfButton size="sm" variant="ghost" @click="$router.push(`/trips/${tripId}/budget`)">
              Details <i class="pi pi-chevron-right" style="font-size: 12px"></i>
            </TfButton>
          </div>
          <div v-if="budgetData" style="display: flex; gap: 26px; margin-bottom: 18px">
            <div>
              <div
                style="
                  font: 400 12px/1 var(--font-sans);
                  color: var(--text-secondary);
                  margin-bottom: 6px;
                "
              >
                Planned
              </div>
              <span class="money money--lg">{{ fmtMoney(budgetData.totalPlanned) }}</span>
            </div>
            <div>
              <div
                style="
                  font: 400 12px/1 var(--font-sans);
                  color: var(--text-secondary);
                  margin-bottom: 6px;
                "
              >
                Paid
              </div>
              <span class="money money--lg" style="color: var(--success-500)">{{
                fmtMoney(
                  Number(budgetData.bookingsPaid || 0) + Number(budgetData.expensesTotal || 0),
                )
              }}</span>
            </div>
            <div>
              <div
                style="
                  font: 400 12px/1 var(--font-sans);
                  color: var(--text-secondary);
                  margin-bottom: 6px;
                "
              >
                Remaining
              </div>
              <span class="money money--lg" style="color: var(--danger-700)">{{
                fmtMoney(budgetData.bookingsRemaining)
              }}</span>
            </div>
          </div>
          <template v-if="budgetData && Number(budgetData.totalPlanned) > 0">
            <div class="tf-progress">
              <div
                class="tf-progress-fill"
                :style="{
                  width:
                    Math.min(
                      100,
                      Math.round(
                        ((Number(budgetData.bookingsPaid || 0) +
                          Number(budgetData.expensesTotal || 0)) /
                          Number(budgetData.totalPlanned)) *
                          100,
                      ),
                    ) + '%',
                }"
              ></div>
            </div>
            <div
              style="
                font: var(--fw-medium) 12px/1 var(--font-mono);
                color: var(--text-secondary);
                margin-top: 8px;
              "
            >
              {{
                Math.round(
                  ((Number(budgetData.bookingsPaid || 0) + Number(budgetData.expensesTotal || 0)) /
                    Number(budgetData.totalPlanned)) *
                    100,
                )
              }}% paid
            </div>
          </template>
          <div
            v-else-if="!budgetData"
            style="font: var(--type-small); color: var(--text-secondary)"
          >
            <TfBadge :tone="statusTone(trip.status)" variant="solid">{{
              statusLabel(trip.status)
            }}</TfBadge>
          </div>
        </div>

        <!-- Upcoming payments -->
        <div class="card">
          <h3 style="font: var(--type-h3); margin: 0 0 14px">Upcoming payments</h3>
          <div
            v-if="upcomingPayments.length"
            style="display: flex; flex-direction: column; gap: 10px"
          >
            <div
              v-for="p in upcomingPayments"
              :key="p.paymentId"
              style="display: flex; align-items: center; gap: 11px"
            >
              <div class="cat-icon cat-icon--sm" :style="catIconStyle(p.category)">
                {{ catIcon(p.category) }}
              </div>
              <div style="flex: 1; min-width: 0">
                <div
                  style="
                    font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                >
                  {{ p.bookingName }}
                </div>
                <div
                  style="
                    font: var(--fw-medium) 11px/1 var(--font-mono);
                    color: var(--text-secondary);
                    margin-top: 2px;
                  "
                >
                  {{ formatDateShort(p.dueDate) }}
                </div>
              </div>
              <span class="money money--sm"
                >{{ Number(p.amount).toFixed(2) }}
                {{ budgetData?.baseCurrency || accountCurrency.value }}</span
              >
            </div>
          </div>
          <div v-else style="font: var(--type-small); color: var(--text-secondary)">
            No upcoming payments
          </div>
        </div>
      </div>

      <!-- Trip info -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 14px">Trip info</h3>
        <div style="display: flex; gap: 24px; flex-wrap: wrap">
          <div style="display: flex; align-items: center; gap: 11px">
            <i class="pi pi-map-marker" style="color: var(--accent); font-size: 16px"></i>
            <div>
              <div
                style="
                  font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                  color: var(--text-primary);
                "
              >
                {{ trip.destination || 'Not set' }}
              </div>
              <div
                style="
                  font: var(--fw-medium) 11px/1 var(--font-mono);
                  color: var(--text-secondary);
                  margin-top: 2px;
                "
              >
                Destination
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 11px">
            <i class="pi pi-calendar" style="color: var(--accent); font-size: 16px"></i>
            <div>
              <div
                style="
                  font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                  color: var(--text-primary);
                "
              >
                {{ formatDate(trip.startDate) }} – {{ formatDate(trip.endDate) }}
              </div>
              <div
                style="
                  font: var(--fw-medium) 11px/1 var(--font-mono);
                  color: var(--text-secondary);
                  margin-top: 2px;
                "
              >
                Dates
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Days section -->
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        "
      >
        <h3 style="font: var(--type-h3); margin: 0">Trip days</h3>
        <TfButton v-if="days.length" size="sm" variant="ghost" @click="goToFirstDay">
          Open itinerary <i class="pi pi-chevron-right" style="font-size: 12px"></i>
        </TfButton>
      </div>

      <div
        v-if="daysLoading"
        style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px"
      >
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 100px"></div>
      </div>

      <div
        v-else-if="days.length"
        class="dashboard-grid dashboard-grid--4col"
        style="margin-bottom: 24px"
      >
        <TfCard
          v-for="day in days"
          :key="day.id"
          interactive
          @click="$router.push(`/trips/${tripId}/days/${day.id}`)"
          style="cursor: pointer"
        >
          <div style="display: flex; justify-content: space-between; align-items: baseline">
            <span
              style="font: var(--fw-bold) 15px/1 var(--font-display); color: var(--text-primary)"
              >Day {{ day.dayNumber }}</span
            >
            <span
              style="font: var(--fw-medium) 11px/1 var(--font-mono); color: var(--text-secondary)"
              >{{ formatDateShort(day.date) }}</span
            >
          </div>
          <div
            v-if="editingDayId === day.id"
            style="margin-top: 8px; display: flex; gap: 6px; align-items: center"
            @click.stop
          >
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
          <div
            v-else
            style="
              font: var(--fw-medium) 13px/1.2 var(--font-sans);
              color: var(--accent);
              margin: 8px 0 0;
              cursor: pointer;
            "
            @click.stop="startDayEdit(day)"
          >
            {{ day.city || 'Set city...' }}
          </div>
        </TfCard>
      </div>

      <div
        v-else-if="!daysLoading && !(trip.startDate && trip.endDate)"
        class="empty-state"
        style="margin-bottom: 24px"
      >
        <div class="empty-state-icon"><i class="pi pi-calendar"></i></div>
        <h3>No days yet</h3>
        <p>Set the trip dates — the days will appear automatically.</p>
        <TfButton variant="primary" @click="startEdit">
          <i class="pi pi-calendar-plus" style="font-size: 14px"></i> Set dates
        </TfButton>
      </div>

      <!-- Quick links -->
      <div class="dashboard-grid dashboard-grid--2col">
        <TfCard
          interactive
          @click="$router.push(`/trips/${tripId}/bookings`)"
          style="cursor: pointer"
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <div
              class="cat-icon cat-icon--lg"
              style="background: var(--success-100); color: var(--accent)"
            >
              <i class="pi pi-ticket"></i>
            </div>
            <div style="flex: 1">
              <div
                style="
                  font: var(--fw-bold) 17px/1.15 var(--font-display);
                  color: var(--text-primary);
                "
              >
                Bookings
              </div>
              <div style="font: var(--type-small); color: var(--text-secondary); margin-top: 2px">
                Flights, hotels, activities
              </div>
            </div>
            <i class="pi pi-chevron-right" style="color: var(--text-secondary)"></i>
          </div>
        </TfCard>
        <TfCard
          interactive
          @click="$router.push(`/trips/${tripId}/budget`)"
          style="cursor: pointer"
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <div
              class="cat-icon cat-icon--lg"
              style="background: var(--warning-100); color: var(--warning-500)"
            >
              <i class="pi pi-dollar"></i>
            </div>
            <div style="flex: 1">
              <div
                style="
                  font: var(--fw-bold) 17px/1.15 var(--font-display);
                  color: var(--text-primary);
                "
              >
                Budget
              </div>
              <div style="font: var(--type-small); color: var(--text-secondary); margin-top: 2px">
                Plan vs actual spending
              </div>
            </div>
            <i class="pi pi-chevron-right" style="color: var(--text-secondary)"></i>
          </div>
        </TfCard>
      </div>
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
  TfCard,
  TfIconButton,
  TfDrawer,
  TfCitySearch,
  TfInput,
  TfSelect,
  TfDatePicker,
  TfModal,
  toast,
} from '@tripyfull/ui';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { api } from '@tripyfull/core';

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

const statusLabel = (s) =>
  ({ DRAFT: 'Draft', PLANNED: 'Planned', ACTIVE: 'Active', COMPLETED: 'Completed' })[s];
const statusTone = (s) =>
  ({ DRAFT: 'neutral', PLANNED: 'gold', ACTIVE: 'brand', COMPLETED: 'success' })[s] || 'neutral';

const upcomingPayments = computed(() => (budgetData.value?.upcomingPayments || []).slice(0, 3));
const fmtMoney = (v) => Number(v || 0).toFixed(2);
const catIcon = (c) =>
  ({ TRANSPORTATION: '\u{1F68C}', ACCOMMODATION: '\u{1F3E8}', ACTIVITY: '\u{1F3AB}' })[c] ??
  '\u{1F4CC}';
const catIconStyle = (c) =>
  ({
    TRANSPORTATION: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACCOMMODATION: { background: 'var(--danger-100)', color: 'var(--accent)' },
    ACTIVITY: { background: 'var(--success-100)', color: 'var(--success-300)' },
  })[c] || { background: 'var(--surface)', color: 'var(--ink-500)' };

const toDateStr = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse a Date or 'YYYY-MM-DD' string into a local-midnight Date (timezone-safe).
const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};
const diffInDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);

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
    const res = await api.get(`/api/trips/${tripId}/export`);
    const d = res.data;
    const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-GB') : '');
    // User-entered text (incl. names of public places adopted from other users)
    // goes into a same-origin document — escape it.
    const esc = (s) =>
      String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    let html = `<html><head><title>${esc(d.title)}</title><style>body{font-family:'Hanken Grotesk',sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#322a24}h1{margin-bottom:4px;font-family:'Bricolage Grotesque',sans-serif}h2{margin-top:24px;border-bottom:2px solid #e4ddd2;padding-bottom:4px;font-family:'Bricolage Grotesque',sans-serif}.activity{padding:4px 0;border-bottom:1px solid #efe9de}.booking{padding:6px 0;border-bottom:1px solid #efe9de}.muted{color:#6b5f56;font-size:0.85em}</style></head><body>`;
    html += `<h1>${esc(d.title)}</h1><p class="muted">${esc(d.destination || '')} &middot; ${fmtDate(d.startDate)} – ${fmtDate(d.endDate)} &middot; ${accountCurrency.value}</p>`;
    d.days.forEach((day) => {
      html += `<h2>Day ${day.dayNumber} — ${fmtDate(day.date)}${day.city ? ' — ' + esc(day.city) : ''}</h2>`;
      if (day.activities.length) {
        day.activities.forEach((a) => {
          html += `<div class="activity"><strong>${esc(a.name)}</strong>`;
          if (a.startTime)
            html += ` <span class="muted">${a.startTime.slice(0, 5)}${a.endTime ? '–' + a.endTime.slice(0, 5) : ''}</span>`;
          if (a.address) html += ` <span class="muted">@ ${esc(a.address)}</span>`;
          if (a.costEstimate)
            html += ` <span class="muted">${a.costEstimate} ${accountCurrency.value}</span>`;
          if (a.notes) html += `<br><span class="muted">${esc(a.notes)}</span>`;
          html += `</div>`;
        });
      } else {
        html += `<p class="muted">No activities</p>`;
      }
    });
    if (d.bookings.length) {
      html += `<h2>Bookings</h2>`;
      d.bookings.forEach((b) => {
        html += `<div class="booking"><strong>${esc(b.name)}</strong>`;
        if (b.category) html += ` <span class="muted">[${b.category}]</span>`;
        if (b.vendor) html += ` — ${esc(b.vendor)}`;
        if (b.fullPrice) html += ` <strong>${b.fullPrice} ${accountCurrency.value}</strong>`;
        html += `</div>`;
      });
    }
    html += `</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
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
const formatDateShort = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${dt.getDate()} ${months[dt.getMonth()]}`;
};
const formatDateRange = (start, end) => {
  if (!start) return '';
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
};

onMounted(async () => {
  try {
    trip.value = await store.fetchById(tripId);
    await fetchDays();
    try {
      budgetData.value = (await api.get(`/api/trips/${tripId}/budget`)).data;
    } catch {
      /* no budget yet */
    }
  } catch {
    toast.danger('Error', 'Failed to load trip');
  }
});
</script>
