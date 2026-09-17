<template>
  <div class="page-content page-content--full">
    <div class="page-head">
      <div>
        <h1>Budget</h1>
        <p>What the trip costs, what is paid, and what is still to pay.</p>
      </div>
    </div>

    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 150px"></div>
      <div class="skeleton" style="height: 260px"></div>
    </div>

    <template v-else-if="budget">
      <!-- The one warning worth a banner: figures that could not be converted. -->
      <div v-if="budget.missingRates" class="budget-alert">
        <i class="pi pi-exclamation-triangle" style="font-size: 16px; flex: none"></i>
        <span
          ><strong
            >{{ budget.missingRates }} booking{{ budget.missingRates > 1 ? 's' : '' }} without an
            exchange rate</strong
          >
          — shown in its own currency, not {{ currency }}.</span
        >
        <TfButton
          size="sm"
          variant="secondary"
          style="flex: none; margin-left: auto"
          @click="$router.push(`/trips/${tripId}/bookings`)"
        >
          Update rates
        </TfButton>
      </div>

      <!-- The figure the page leads with, and the payment story under it. The
           bookings' own progress lives here rather than in a card of its own,
           where it only repeated these numbers. -->
      <div class="card budget-hero">
        <div class="budget-hero-main">
          <div class="metric-label">Trip cost</div>
          <span class="money budget-hero-value"
            >{{ fmt(tripCost) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">
            {{ fmt(budget.bookingsTotal) }} booked · {{ fmt(budget.estimatesTotal) }} estimated in
            the day plans
          </div>
        </div>

        <div v-if="Number(budget.bookingsTotal) > 0" class="budget-hero-pay">
          <TfProgress label="Bookings paid" :value="paidPct" />
          <div class="budget-hero-facts">
            <div class="budget-fact">
              <span class="budget-fact-label">Paid</span>
              <span class="money money--md" style="color: var(--success-500)">{{
                fmt(budget.bookingsPaid)
              }}</span>
              <span class="budget-fact-sub">{{ paidPct }}% of bookings</span>
            </div>
            <div class="budget-fact">
              <span class="budget-fact-label">Left to pay</span>
              <span
                class="money money--md"
                :style="{ color: remaining > 0 ? 'var(--danger-700)' : 'var(--text-primary)' }"
                >{{ fmt(remaining) }}</span
              >
              <span class="budget-fact-sub">{{ remainingSub }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="budget-columns">
        <!-- What still has to be paid, and when -->
        <div class="card">
          <h3 class="card-title">Payments</h3>

          <div v-if="!upcoming.length && !unscheduled.length" class="budget-settled">
            <i class="pi pi-check-circle" style="font-size: 16px"></i> Nothing left to pay
          </div>

          <template v-if="upcoming.length">
            <div class="budget-list-label">Scheduled</div>
            <div class="budget-list">
              <div v-for="p in upcoming" :key="p.paymentId" class="budget-pay-row">
                <div class="cat-icon cat-icon--sm" :style="catStyle(p.category)">
                  {{ catEmoji(p.category) }}
                </div>
                <div style="flex: 1; min-width: 0">
                  <div class="budget-pay-name">{{ p.bookingName }}</div>
                  <div class="budget-pay-due" :class="{ 'is-late': isLate(p.dueDate) }">
                    {{ p.dueDate ? 'due ' + formatDateShort(p.dueDate) : 'no date' }}
                  </div>
                </div>
                <span class="money money--sm">{{ fmt(p.amount) }} {{ currency }}</span>
                <TfButton size="sm" variant="secondary" @click="markPaymentPaid(p)">
                  <i class="pi pi-check" style="font-size: 12px"></i> Paid
                </TfButton>
              </div>
            </div>
          </template>

          <template v-if="unscheduled.length">
            <div class="budget-list-label" style="margin-top: 14px">
              Owed, no date yet
              <span class="text-subtle" style="text-transform: none; letter-spacing: 0"
                >— schedule instalments or tick «Paid in full» on the booking</span
              >
            </div>
            <div class="budget-list">
              <div
                v-for="u in unscheduled"
                :key="u.bookingId"
                class="budget-pay-row budget-pay-row--link"
                @click="$router.push(`/trips/${tripId}/bookings`)"
              >
                <div class="cat-icon cat-icon--sm" :style="catStyle(u.category)">
                  {{ catEmoji(u.category) }}
                </div>
                <div class="budget-pay-name" style="flex: 1; min-width: 0">{{ u.bookingName }}</div>
                <span class="money money--sm">{{ fmt(u.remaining) }} {{ currency }}</span>
                <i class="pi pi-chevron-right text-subtle" style="font-size: 12px"></i>
              </div>
            </div>
          </template>
        </div>

        <!-- Where the money goes, and how much of it is settled -->
        <div class="card">
          <h3 class="card-title">By category</h3>
          <div v-if="!budget.byCategory.length" class="text-muted text-sm">
            Nothing booked or planned yet.
          </div>
          <div v-else class="budget-cats">
            <div class="budget-cat-head">
              <span style="flex: 1"></span>
              <span class="budget-cat-col">Planned</span>
              <span class="budget-cat-col">Paid</span>
            </div>
            <div v-for="c in budget.byCategory" :key="c.category" class="budget-cat">
              <div class="budget-cat-row">
                <div class="cat-icon cat-icon--sm" :style="catStyle(c.category)">
                  {{ catEmoji(c.category) }}
                </div>
                <span class="budget-cat-name">{{ catLabel(c.category) }}</span>
                <span class="budget-cat-col">{{ planned(c) ? fmt(planned(c)) : '—' }}</span>
                <span class="budget-cat-col">{{ fmt(paidOf(c)) }}</span>
              </div>
              <!-- Plan against what is settled. Planned is everything this category
                   is expected to cost: the bookings' prices plus the estimates in the
                   day plans. Paid is the part of the bookings already gone. An unpaid
                   booking is a plan until it is paid. -->
              <div v-if="planned(c)" class="budget-cat-plan">
                <div
                  class="progress-track"
                  :class="{ 'progress-track--over': over(c) }"
                  style="height: 6px; flex: 1"
                >
                  <div
                    class="progress-fill"
                    :style="{
                      width: planPct(c) + '%',
                      background: over(c) ? 'var(--danger-500)' : 'var(--primary)',
                    }"
                  ></div>
                </div>
                <span class="budget-cat-plan-label" :class="{ 'is-over': over(c) }">
                  <!-- Over budget is a state, so it carries a mark and a word,
                       never colour alone. -->
                  <i
                    v-if="over(c)"
                    class="pi pi-exclamation-triangle"
                    style="font-size: 11px; margin-right: 3px"
                  ></i
                  >{{ planLabel(c) }}
                </span>
              </div>
              <div v-else class="budget-cat-plan budget-cat-plan--none">
                nothing planned to compare with
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per day: what the bookings cost for that day and what the plan estimates -->
      <div class="card budget-days-card" style="margin-top: 20px">
        <div class="card-head-row">
          <h3 class="card-title" style="margin: 0">Day by day</h3>
          <span v-if="!daysWithMoney.length" class="text-subtle text-sm"
            >Amounts appear here once bookings have dates or stops carry a cost.</span
          >
          <span v-else class="text-subtle text-sm"
            >{{ daysWithMoney.length }} of {{ budget.days.length }} days carry an amount</span
          >
        </div>

        <template v-if="daysWithMoney.length">
          <div class="budget-day-header">
            <span style="flex: 1">Day</span>
            <span class="budget-day-col">Booked</span>
            <span class="budget-day-col">Estimated</span>
          </div>
          <div v-for="d in daysWithMoney" :key="d.dayId" class="budget-day">
            <div class="budget-day-row">
              <span class="budget-day-label">
                Day {{ d.dayNumber }}
                <span class="text-subtle"> · {{ formatDayDate(d.date) }}</span>
                <span v-if="d.city" class="budget-day-city text-subtle"
                  ><span class="budget-day-sep"> · </span>{{ d.city }}</span
                >
              </span>
              <!-- The label rides each amount; on a phone the header row is gone
                   and these become the only thing that names them. -->
              <span class="budget-day-col text-subtle" :class="{ 'is-empty': !Number(d.booked) }">
                <span class="budget-day-col-label">Booked</span>{{ dash(d.booked) }}
              </span>
              <span
                class="budget-day-col"
                :class="{ 'is-empty': !Number(d.estimated) }"
                style="font-weight: 600"
              >
                <span class="budget-day-col-label">Est.</span>{{ dash(d.estimated) }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api, formatDateShort, formatDayDate, toDateStr } from '@tripyfull/core';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { TfButton, TfProgress, toast } from '@tripyfull/ui';

const route = useRoute();
const tripId = route.params.tripId;

const tripTitle = ref('');
const tripDates = ref('');
const loading = ref(false);
const budget = ref(null);

// The backend converts everything into the owner's base currency; this is it.
const currency = computed(() => budget.value?.baseCurrency || accountCurrency.value);

/* ---- headline figures ---- */
// Everything the trip is expected to cost: the bookings plus the day plans' estimates.
const tripCost = computed(() => Number(budget.value?.totalPlanned || 0));
const remaining = computed(() => Number(budget.value?.bookingsRemaining || 0));
const paidPct = computed(() => {
  const total = Number(budget.value?.bookingsTotal || 0);
  return total ? Math.round((Number(budget.value.bookingsPaid) / total) * 100) : 0;
});
const upcoming = computed(() => budget.value?.upcomingPayments || []);
const unscheduled = computed(() => budget.value?.unscheduled || []);
const remainingSub = computed(() => {
  if (!(remaining.value > 0)) return 'all bookings settled';
  const parts = [];
  if (upcoming.value.length)
    parts.push(
      `${upcoming.value.length} scheduled payment${upcoming.value.length === 1 ? '' : 's'}`,
    );
  if (unscheduled.value.length) parts.push(`${unscheduled.value.length} without a date`);
  return parts.join(' · ');
});
/* ---- categories ---- */
const catEmoji = (c) =>
  ({
    FOOD: '\u{1F37D}',
    TRANSPORT: '\u{1F68C}',
    ACTIVITY: '\u{1F3AB}',
    ACCOMMODATION: '\u{1F3E8}',
    OTHER: '\u{1F4CC}',
  })[c] ?? '\u{1F4CC}';
const catLabel = (c) =>
  ({
    FOOD: 'Food',
    TRANSPORT: 'Transport',
    ACTIVITY: 'Activities',
    ACCOMMODATION: 'Accommodation',
    OTHER: 'Other',
  })[c] ?? c;
const catStyle = (c) =>
  ({
    FOOD: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    TRANSPORT: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACTIVITY: { background: 'var(--success-100)', color: 'var(--success-300)' },
    ACCOMMODATION: { background: 'var(--danger-100)', color: 'var(--accent)' },
    OTHER: { background: 'var(--surface)', color: 'var(--ink-500)' },
  })[c] || { background: 'var(--surface)', color: 'var(--ink-500)' };

/* Plan against what is settled, per category. A booking's price is part of the
   plan; the paid part of it is money already gone. */
const planned = (c) => Number(c.booked) + Number(c.estimated);
const paidOf = (c) => Number(c.paid);
const planPct = (c) => (planned(c) ? Math.min(100, Math.round((paidOf(c) / planned(c)) * 100)) : 0);
const over = (c) => planned(c) > 0 && paidOf(c) > planned(c);
const planLabel = (c) => {
  const plan = planned(c),
    done = paidOf(c);
  if (done > plan) return `${fmt(done - plan)} ${currency.value} over`;
  return `${Math.round((done / plan) * 100)}%`;
};

/* ---- days ---- */
const daysWithMoney = computed(() =>
  (budget.value?.days || []).filter((d) => Number(d.booked) || Number(d.estimated)),
);

const fmt = (v) => Number(v || 0).toFixed(2);
const dash = (v) => (Number(v) ? fmt(v) : '—');
const isLate = (d) => d && d < toDateStr(new Date());

const markPaymentPaid = async (p) => {
  try {
    await api.patch(`/api/payments/${p.paymentId}/paid`);
    await refreshBudget();
    toast.success('Marked paid', p.bookingName);
  } catch {
    toast.danger('Error', 'Failed to mark payment');
  }
};

const refreshBudget = async () => {
  budget.value = (await api.get(`/api/trips/${tripId}/budget`)).data;
};

onMounted(async () => {
  loading.value = true;
  try {
    const [tripRes, budgetRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get(`/api/trips/${tripId}/budget`),
    ]);
    tripTitle.value = tripRes.data.title;
    if (tripRes.data.startDate && tripRes.data.endDate) {
      tripDates.value =
        formatDateShort(tripRes.data.startDate) + ' – ' + formatDateShort(tripRes.data.endDate);
    }
    budget.value = budgetRes.data;
  } catch {
    toast.danger('Error', 'Failed to load budget');
  } finally {
    loading.value = false;
  }
});
</script>
