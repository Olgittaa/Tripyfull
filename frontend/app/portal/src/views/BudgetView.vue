<template>
  <div class="page-content page-content--full">
    <div class="page-head">
      <div>
        <h1>Budget</h1>
        <p>
          What the trip costs, what is paid, what is still to pay — and what you spend on the way.
        </p>
      </div>
      <div class="page-head-actions">
        <TfButton variant="secondary" @click="openExpenseDialog(null)">
          <i class="pi pi-plus" style="font-size: 14px"></i> Expense
        </TfButton>
      </div>
    </div>

    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="metric-grid">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 120px"></div>
      </div>
      <div class="skeleton" style="height: 200px"></div>
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

      <!-- Four figures, each answering one question -->
      <div class="metric-grid">
        <div class="metric-tile">
          <div class="metric-label">Trip cost so far</div>
          <span class="money money--xl"
            >{{ fmt(tripCost) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">
            {{ fmt(budget.bookingsTotal) }} booked · {{ fmt(budget.expensesTotal) }} spent
          </div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Paid</div>
          <span class="money money--xl" style="color: var(--success-500)"
            >{{ fmt(budget.bookingsPaid) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ paidPct }}% of bookings</div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Left to pay</div>
          <span
            class="money money--xl"
            :style="{ color: remaining > 0 ? 'var(--danger-700)' : 'var(--text-primary)' }"
            >{{ fmt(remaining) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ remainingSub }}</div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Estimated on the way</div>
          <span class="money money--xl"
            >{{ fmt(budget.estimatesTotal) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ estimateSub }}</div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Spent on the way</div>
          <span class="money money--xl"
            >{{ fmt(budget.expensesTotal) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ spentSub }}</div>
        </div>
      </div>

      <div v-if="Number(budget.bookingsTotal) > 0" class="card" style="margin-bottom: 24px">
        <TfProgress label="Bookings paid" :value="paidPct" />
        <div class="budget-progress-foot">
          <span
            >{{ fmt(budget.bookingsPaid) }} of {{ fmt(budget.bookingsTotal) }} {{ currency }}</span
          >
          <span v-if="remaining > 0" style="color: var(--danger-700)"
            >{{ fmt(remaining) }} {{ currency }} to go</span
          >
          <span v-else style="color: var(--success-700)">Everything is paid</span>
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

        <!-- Where the money goes, in the same categories for booked and spent -->
        <div class="card">
          <h3 class="card-title">By category</h3>
          <div v-if="!budget.byCategory.length" class="text-muted text-sm">
            Nothing booked or spent yet.
          </div>
          <div v-else class="budget-cats">
            <div class="budget-cat-head">
              <span style="flex: 1"></span>
              <span class="budget-cat-col">Planned</span>
              <span class="budget-cat-col">Spent</span>
            </div>
            <div v-for="c in budget.byCategory" :key="c.category" class="budget-cat">
              <div class="budget-cat-row">
                <div class="cat-icon cat-icon--sm" :style="catStyle(c.category)">
                  {{ catEmoji(c.category) }}
                </div>
                <span class="budget-cat-name">{{ catLabel(c.category) }}</span>
                <span class="budget-cat-col">{{ planned(c) ? fmt(planned(c)) : '—' }}</span>
                <span class="budget-cat-col">{{ fmt(spentAll(c)) }}</span>
              </div>
              <!-- Plan against reality. Planned is everything this category is
                   expected to cost: the bookings' prices plus the estimates in the
                   day plans. Spent is what is gone: the paid part of the bookings
                   plus the expenses. An unpaid booking is a plan until it is paid. -->
              <div v-if="planned(c)" class="budget-cat-plan">
                <div class="progress-track" style="height: 6px; flex: 1">
                  <div
                    class="progress-fill"
                    :style="{
                      width: planPct(c) + '%',
                      background: over(c) ? 'var(--danger-500)' : 'var(--primary)',
                    }"
                  ></div>
                </div>
                <span class="budget-cat-plan-label" :class="{ 'is-over': over(c) }">
                  {{ planLabel(c) }}
                </span>
              </div>
              <div v-else class="budget-cat-plan budget-cat-plan--none">
                nothing planned to compare with
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per day: what the bookings cost for that day, what the plan estimates, what was spent -->
      <div class="card" style="margin-top: 20px">
        <div class="card-head-row">
          <h3 class="card-title" style="margin: 0">Day by day</h3>
          <span v-if="!daysWithMoney.length" class="text-subtle text-sm"
            >Amounts appear here once bookings have dates or expenses are recorded.</span
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
            <span class="budget-day-col">Spent</span>
            <span style="width: 28px"></span>
          </div>
          <div v-for="d in daysWithMoney" :key="d.dayId" class="budget-day">
            <button class="budget-day-row-btn" @click="toggleDay(d.dayId)">
              <span class="budget-day-label">
                Day {{ d.dayNumber }}
                <span class="text-subtle"> · {{ formatDayDate(d.date) }}</span>
                <span v-if="d.city" class="text-subtle"> · {{ d.city }}</span>
              </span>
              <span class="budget-day-col text-subtle">{{ dash(d.booked) }}</span>
              <span class="budget-day-col text-subtle">{{ dash(d.estimated) }}</span>
              <span class="budget-day-col" style="font-weight: 600">{{ dash(d.spent) }}</span>
              <span
                class="budget-day-chevron"
                :style="{ transform: expandedDay === d.dayId ? 'rotate(90deg)' : 'none' }"
              >
                <i class="pi pi-chevron-right" style="font-size: 13px"></i>
              </span>
            </button>
            <div v-if="expandedDay === d.dayId" class="budget-day-detail">
              <template v-if="(dayExpenses[d.dayId] || []).length">
                <div class="budget-list-label">Expenses</div>
                <div class="budget-list">
                  <div v-for="e in dayExpenses[d.dayId]" :key="e.id" class="budget-exp-row">
                    <div class="cat-icon cat-icon--sm" :style="catStyle(e.category)">
                      {{ catEmoji(e.category) }}
                    </div>
                    <span style="flex: 1; min-width: 0">{{
                      e.description || catLabel(e.category) || 'Expense'
                    }}</span>
                    <span class="money money--sm text-subtle">
                      {{ Number(e.amount).toFixed(2) }} {{ e.currency || currency }}
                    </span>
                    <TfTooltip text="Delete">
                      <button class="del-btn" @click.stop="deleteExpense(d.dayId, e.id)">
                        <i class="pi pi-times" style="font-size: 10px"></i>
                      </button>
                    </TfTooltip>
                  </div>
                </div>
              </template>
              <div v-else class="text-subtle text-sm">
                No expenses recorded for this day
                {{ Number(d.booked) ? '— the booked amount comes from your bookings' : '' }}.
              </div>
              <TfButton
                size="sm"
                variant="ghost"
                style="margin-top: 10px"
                @click.stop="openExpenseDialog(d.dayId)"
              >
                <i class="pi pi-plus" style="font-size: 14px"></i> Expense for this day
              </TfButton>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Add Expense Dialog -->
    <TfModal v-model="showExpenseDialog" title="Add expense" size="sm">
      <form @submit.prevent="saveExpense" class="dialog-form">
        <TfSelect
          v-if="!expenseDayId"
          label="Day"
          v-model="expenseDaySelectLabel"
          :options="dayOptions.map((o) => o.label)"
          placeholder="Select day"
        />
        <TfSelect
          label="Category"
          v-model="expenseCategoryLabel"
          :options="expCategoryOptions.map((o) => o.label)"
          placeholder="Select"
        />
        <div class="field-pair field-pair--wide">
          <TfNumberInput
            label="Amount *"
            v-model="expenseForm.amount"
            type="plain"
            :precision="2"
          />
          <TfInput label="Currency" v-model="expenseForm.currency" :placeholder="currency" />
        </div>
        <TfInput
          label="Description"
          v-model="expenseForm.description"
          placeholder="e.g. Lunch at taverna"
        />
        <div class="dialog-actions">
          <TfButton type="button" variant="ghost" @click="showExpenseDialog = false">
            Cancel
          </TfButton>
          <TfButton type="submit" icon="pi-plus" :loading="savingExpense">Add</TfButton>
        </div>
      </form>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api, formatDateShort, formatDayDate, toDateStr } from '@tripyfull/core';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import {
  TfButton,
  TfInput,
  TfSelect,
  TfNumberInput,
  TfModal,
  TfProgress,
  TfTooltip,
  toast,
} from '@tripyfull/ui';

const route = useRoute();
const tripId = route.params.tripId;

const tripTitle = ref('');
const tripDates = ref('');
const loading = ref(false);
const budget = ref(null);
const dayExpenses = ref({});
const expandedDay = ref(null);

// The backend converts everything into the owner's base currency; this is it.
const currency = computed(() => budget.value?.baseCurrency || accountCurrency.value);

/* ---- headline figures ---- */
const tripCost = computed(
  () => Number(budget.value?.bookingsTotal || 0) + Number(budget.value?.expensesTotal || 0),
);
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
const expenseCount = computed(() =>
  Object.values(dayExpenses.value).reduce((s, arr) => s + arr.length, 0),
);
// Estimates are the cost fields on the day plans' stops — what the days are
// expected to cost before anything is spent.
const estimateSub = computed(() => {
  const days = (budget.value?.days || []).filter((d) => Number(d.estimated)).length;
  if (!days) return 'no stop in the plan carries a cost yet';
  return `stops with a cost on ${days} day${days === 1 ? '' : 's'}`;
});
const spentSub = computed(() => {
  const est = Number(budget.value?.estimatesTotal || 0);
  const spent = Number(budget.value?.expensesTotal || 0);
  if (!expenseCount.value) return 'add expenses as you go';
  const parts = [`${expenseCount.value} expense${expenseCount.value === 1 ? '' : 's'}`];
  if (est)
    parts.push(
      spent > est
        ? `${fmt(spent - est)} over the estimate`
        : `${Math.round((spent / est) * 100)}% of the estimate`,
    );
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
const catColor = (c) =>
  ({
    FOOD: 'var(--warning-300)',
    TRANSPORT: 'var(--accent)',
    ACTIVITY: 'var(--success-300)',
    ACCOMMODATION: 'var(--primary)',
    OTHER: 'var(--ink-400)',
  })[c] || 'var(--accent)';
const catStyle = (c) =>
  ({
    FOOD: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    TRANSPORT: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACTIVITY: { background: 'var(--success-100)', color: 'var(--success-300)' },
    ACCOMMODATION: { background: 'var(--danger-100)', color: 'var(--accent)' },
    OTHER: { background: 'var(--surface)', color: 'var(--ink-500)' },
  })[c] || { background: 'var(--surface)', color: 'var(--ink-500)' };

/* Plan against reality, per category. A booking's price is part of the plan;
   the paid part of it is money gone, same as an expense on the way. */
const planned = (c) => Number(c.booked) + Number(c.estimated);
const spentAll = (c) => Number(c.paid) + Number(c.spent);
const planPct = (c) =>
  planned(c) ? Math.min(100, Math.round((spentAll(c) / planned(c)) * 100)) : 0;
const over = (c) => planned(c) > 0 && spentAll(c) > planned(c);
const planLabel = (c) => {
  const plan = planned(c),
    done = spentAll(c);
  if (done > plan) return `${fmt(done - plan)} ${currency.value} over`;
  return `${Math.round((done / plan) * 100)}%`;
};

/* ---- days ---- */
const daysWithMoney = computed(() =>
  (budget.value?.days || []).filter(
    (d) => Number(d.booked) || Number(d.estimated) || Number(d.spent),
  ),
);
const toggleDay = (dayId) => {
  expandedDay.value = expandedDay.value === dayId ? null : dayId;
};

const fmt = (v) => Number(v || 0).toFixed(2);
const dash = (v) => (Number(v) ? fmt(v) : '—');
const isLate = (d) => d && d < toDateStr(new Date());

/* ---- expenses ---- */
const showExpenseDialog = ref(false);
const savingExpense = ref(false);
const expenseDayId = ref(null);
const expenseDayIdSelect = ref(null);
const expenseForm = ref({ category: null, amount: null, currency: '', description: '' });
const expCategoryOptions = [
  { label: 'Food', value: 'FOOD' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Activity', value: 'ACTIVITY' },
  { label: 'Accommodation', value: 'ACCOMMODATION' },
  { label: 'Other', value: 'OTHER' },
];
// TfSelect works with string arrays; bridge label<->value while preserving stored values
const dayOptions = computed(
  () =>
    budget.value?.days?.map((d) => ({
      label: `Day ${d.dayNumber}${d.city ? ' · ' + d.city : ''} (${formatDayDate(d.date)})`,
      value: d.dayId,
    })) || [],
);
const expenseDaySelectLabel = computed({
  get: () => dayOptions.value.find((o) => o.value === expenseDayIdSelect.value)?.label || null,
  set: (label) => {
    expenseDayIdSelect.value = dayOptions.value.find((o) => o.label === label)?.value ?? null;
  },
});
const expenseCategoryLabel = computed({
  get: () => expCategoryOptions.find((o) => o.value === expenseForm.value.category)?.label || null,
  set: (label) => {
    expenseForm.value.category = expCategoryOptions.find((o) => o.label === label)?.value ?? null;
  },
});

const openExpenseDialog = (dayId) => {
  expenseDayId.value = dayId;
  expenseDayIdSelect.value = dayId;
  expenseForm.value = {
    category: null,
    amount: null,
    currency: accountCurrency.value,
    description: '',
  };
  showExpenseDialog.value = true;
};

const saveExpense = async () => {
  const targetDayId = expenseDayId.value || expenseDayIdSelect.value;
  if (!targetDayId) return;
  savingExpense.value = true;
  try {
    const res = await api.post(`/api/days/${targetDayId}/expenses`, expenseForm.value);
    if (!dayExpenses.value[targetDayId]) dayExpenses.value[targetDayId] = [];
    dayExpenses.value[targetDayId].push(res.data);
    showExpenseDialog.value = false;
    expandedDay.value = targetDayId;
    await refreshBudget();
    toast.success('Added', 'Expense recorded');
  } catch {
    toast.danger('Error', 'Failed to add expense');
  } finally {
    savingExpense.value = false;
  }
};

const deleteExpense = async (dayId, expenseId) => {
  try {
    await api.delete(`/api/expenses/${expenseId}`);
    dayExpenses.value[dayId] = (dayExpenses.value[dayId] || []).filter((e) => e.id !== expenseId);
    await refreshBudget();
    toast.success('Deleted');
  } catch {
    toast.danger('Error', 'Failed to delete expense');
  }
};

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
    const results = await Promise.all(
      budgetRes.data.days.map((d) =>
        api
          .get(`/api/days/${d.dayId}/expenses`)
          .then((r) => ({ id: d.dayId, data: r.data }))
          .catch(() => ({ id: d.dayId, data: [] })),
      ),
    );
    const map = {};
    results.forEach((r) => (map[r.id] = r.data));
    dayExpenses.value = map;
  } catch {
    toast.danger('Error', 'Failed to load budget');
  } finally {
    loading.value = false;
  }
});
</script>
