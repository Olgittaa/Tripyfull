<template>
  <div class="page-content page-content--full">
    <!-- Page head -->
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">
          {{ tripTitle }}{{ tripDates ? ' · ' + tripDates : '' }}
        </div>
        <h1>Budget</h1>
        <p>Am I within budget, what payments are due, and where the money goes.</p>
      </div>
      <div class="page-head-actions">
        <TfButton variant="secondary" @click="openExpenseDialog(null)">
          <i class="pi pi-plus" style="font-size: 14px"></i> Expense
        </TfButton>
      </div>
    </div>

    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px">
        <div v-for="i in 4" :key="i" class="skeleton" style="height: 120px"></div>
      </div>
      <div class="skeleton" style="height: 200px"></div>
      <div class="skeleton" style="height: 260px"></div>
    </div>

    <template v-else-if="budget">
      <!-- Missing exchange rate warning -->
      <div
        v-if="missingRateCount > 0"
        style="
          margin-bottom: 18px;
          padding: 14px 18px;
          background: var(--warning-100);
          border: 1px solid var(--warning-500);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--warning-500);
            font: var(--type-body);
          "
        >
          <i class="pi pi-exclamation-triangle" style="font-size: 16px; flex: none"></i>
          <span
            ><strong
              >{{ missingRateCount }} booking{{ missingRateCount > 1 ? 's' : '' }} missing exchange
              rate</strong
            >
            — amounts shown in original currency, not {{ currency }}. Go to Bookings and press
            "Update rates".</span
          >
        </div>
        <TfButton
          size="sm"
          variant="secondary"
          style="flex: none"
          @click="$router.push(`/trips/${tripId}/bookings`)"
        >
          Update rates
        </TfButton>
      </div>

      <!-- Overspend alert -->
      <div
        v-if="overCategories.length"
        style="
          margin-bottom: 18px;
          padding: 14px 18px;
          background: var(--warning-100);
          border: 1px solid var(--warning-500);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--warning-500);
          font: var(--type-body);
        "
      >
        <i class="pi pi-exclamation-triangle" style="font-size: 16px"></i>
        <span
          ><strong>Overspend:</strong> {{ overCategories.map((c) => catLabel(c.cat)).join(', ') }}.
          Actual exceeded plan.</span
        >
      </div>

      <!-- 4 Metric tiles -->
      <div
        style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px"
      >
        <div class="metric-tile">
          <div class="metric-label">Planned</div>
          <span class="money money--xl"
            >{{ fmt(totalPlanned) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">bookings + activity estimates</div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Paid</div>
          <span class="money money--xl" style="color: var(--success-500)"
            >{{ fmt(paidTotal) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ paidPct }}% of plan</div>
        </div>
        <div
          class="metric-tile"
          :class="{ 'metric-tile--active': activeMetric === 'remaining' }"
          @click="toggleMetric('remaining')"
          style="cursor: pointer"
        >
          <div class="metric-label">
            Remaining to pay <i class="pi pi-chevron-right" style="font-size: 11px"></i>
          </div>
          <span class="money money--xl" style="color: var(--danger-700)"
            >{{ fmt(bookingsRemaining) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ upcomingPayments.length }} payments ahead</div>
        </div>
        <div class="metric-tile">
          <div class="metric-label">Spent in trip</div>
          <span class="money money--xl"
            >{{ fmt(budget.expensesTotal) }} <span class="money-cur">{{ currency }}</span></span
          >
          <div class="metric-sub">{{ expenseCount }} expenses recorded</div>
        </div>
      </div>

      <!-- Main progress bar -->
      <div class="card" style="margin-bottom: 24px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          "
        >
          <span
            style="font: var(--fw-semibold) 15px/1 var(--font-display); color: var(--text-primary)"
            >Overall progress</span
          >
          <TfBadge :tone="paidTotal > totalPlanned ? 'danger' : 'accent'" variant="soft">
            {{ paidTotal > totalPlanned ? 'over budget' : fmt(totalPlanned) + ' ' + currency }}
          </TfBadge>
        </div>
        <div class="tf-progress" style="height: 10px">
          <div
            class="tf-progress-fill"
            :style="{
              width: progressPct(paidTotal, totalPlanned) + '%',
              background: paidTotal > totalPlanned ? 'var(--danger-500)' : 'var(--accent)',
            }"
          ></div>
        </div>
        <div
          style="
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font: var(--fw-medium) 12px/1 var(--font-mono);
            color: var(--text-secondary);
          "
        >
          <span>paid {{ fmt(paidTotal) }} {{ currency }} · {{ paidPct }}%</span>
          <span
            :style="{
              color: paidTotal > totalPlanned ? 'var(--danger-500)' : 'var(--success-500)',
            }"
          >
            {{
              paidTotal > totalPlanned
                ? 'overspend ' + fmt(paidTotal - totalPlanned)
                : 'remaining ' + fmt(totalPlanned - paidTotal)
            }}
            {{ currency }}
          </span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start">
        <!-- Due payments -->
        <div
          class="card"
          :style="
            activeMetric === 'remaining'
              ? 'border:1.5px solid var(--accent);box-shadow:var(--shadow-md)'
              : ''
          "
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 14px;
            "
          >
            <h3 style="font: var(--type-h3); margin: 0">Due payments</h3>
            <TfBadge v-if="activeMetric === 'remaining'" tone="brand" variant="soft"
              >unpaid only</TfBadge
            >
          </div>
          <div
            v-if="!upcomingPayments.length"
            style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 14px 0;
              color: var(--success-500);
              font: var(--type-body);
            "
          >
            <i class="pi pi-check-circle" style="font-size: 16px"></i> All payments settled
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 10px">
            <div
              v-for="p in upcomingPayments"
              :key="p.paymentId"
              style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 11px 12px;
                background: var(--bg);
                border: 1px solid var(--border-default);
                border-radius: var(--radius-md);
              "
            >
              <div class="cat-icon cat-icon--sm" :style="catStyle(p.category)">
                {{ catEmoji(p.category) }}
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
                    color: var(--danger-700);
                    margin-top: 3px;
                  "
                >
                  due {{ formatDateShort(p.dueDate) }}
                </div>
              </div>
              <span class="money money--sm">{{ Number(p.amount).toFixed(2) }} {{ currency }}</span>
              <TfButton size="sm" variant="secondary" @click="markPaymentPaid(p)">
                <i class="pi pi-check" style="font-size: 12px"></i> Mark paid
              </TfButton>
            </div>
          </div>
        </div>

        <!-- By category -->
        <div class="card">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              gap: 12px;
              flex-wrap: wrap;
            "
          >
            <h3 style="font: var(--type-h3); margin: 0">Where money goes</h3>
            <div class="segmented-control">
              <button
                v-for="m in ['Actual', 'Plan', 'Both']"
                :key="m"
                class="segmented-btn"
                :class="catMode === m ? 'segmented-btn--on' : ''"
                @click="catMode = m"
              >
                {{ m }}
              </button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px">
            <div v-for="c in categoryBreakdown" :key="c.cat">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <div class="cat-icon cat-icon--sm" :style="catStyle(c.cat)">
                  {{ catEmoji(c.cat) }}
                </div>
                <span
                  style="
                    font: var(--fw-medium) 14px/1 var(--font-sans);
                    color: var(--text-primary);
                    flex: 1;
                  "
                  >{{ catLabel(c.cat) }}</span
                >
                <span
                  style="font: var(--fw-medium) 12px/1 var(--font-mono)"
                  :style="{ color: c.over ? 'var(--danger-500)' : 'var(--text-secondary)' }"
                >
                  {{
                    catMode === 'Actual'
                      ? fmt(c.fact)
                      : catMode === 'Plan'
                        ? fmt(c.plan)
                        : fmt(c.fact) + ' / ' + fmt(c.plan)
                  }}
                  {{ currency }}
                </span>
              </div>
              <div class="tf-progress" style="height: 7px">
                <div
                  class="tf-progress-fill"
                  :style="{
                    width: progressPct(c.fact, c.plan || 1) + '%',
                    background: c.over ? 'var(--danger-500)' : catColor(c.cat),
                  }"
                ></div>
              </div>
              <div
                v-if="c.over"
                style="
                  font: var(--fw-medium) 11px/1 var(--font-mono);
                  color: var(--danger-500);
                  margin-top: 4px;
                "
              >
                overspend {{ fmt(Number(c.fact) - Number(c.plan)) }} {{ currency }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- By-day detail (expandable) -->
      <div class="card" style="margin-top: 20px">
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            gap: 12px;
            flex-wrap: wrap;
          "
        >
          <h3 style="font: var(--type-h3); margin: 0">Day-by-day detail</h3>
          <div class="segmented-control">
            <button
              v-for="f in ['All', 'Food', 'Transport', 'Activity']"
              :key="f"
              class="segmented-btn"
              :class="filterCat === f ? 'segmented-btn--on' : ''"
              @click="filterCat = f"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <!-- Table header -->
        <div class="budget-day-header">
          <span style="flex: 1">Day</span>
          <span class="budget-day-col">Plan</span>
          <span class="budget-day-col">Actual</span>
          <span class="budget-day-col">&Delta;</span>
          <span style="width: 28px"></span>
        </div>

        <!-- Day rows (accordion) -->
        <div
          v-for="d in budget.days"
          :key="d.dayId"
          style="border-bottom: 1px dashed var(--border-default)"
        >
          <button
            class="budget-day-row-btn"
            :style="expandedDay === d.dayId ? 'background:var(--bg)' : ''"
            @click="toggleDay(d.dayId)"
          >
            <span class="budget-day-label">Day {{ d.dayNumber }} · {{ d.city || '' }}</span>
            <span class="budget-day-col" style="color: var(--text-secondary)">{{
              fmt(d.planned)
            }}</span>
            <span class="budget-day-col" style="color: var(--text-primary); font-weight: 600">{{
              fmt(d.actual)
            }}</span>
            <span
              class="budget-day-col"
              :style="{
                color:
                  Number(d.actual) > Number(d.planned) && Number(d.planned) > 0
                    ? 'var(--danger-500)'
                    : 'var(--success-500)',
              }"
            >
              {{ delta(d.actual, d.planned) }}
            </span>
            <span
              style="
                width: 28px;
                display: inline-flex;
                justify-content: flex-end;
                color: var(--text-secondary);
                transition: transform var(--dur-fast) var(--ease-out);
              "
              :style="{ transform: expandedDay === d.dayId ? 'rotate(90deg)' : 'none' }"
            >
              <i class="pi pi-chevron-right" style="font-size: 13px"></i>
            </span>
          </button>

          <!-- Expanded content -->
          <div v-if="expandedDay === d.dayId" style="padding: 4px 6px 16px">
            <template v-if="filteredDayExpenses(d.dayId).length">
              <div
                style="
                  font: var(--fw-medium) 11px/1 var(--font-mono);
                  letter-spacing: 0.08em;
                  text-transform: uppercase;
                  color: var(--text-secondary);
                  margin: 8px 0;
                "
              >
                Expenses
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px">
                <div
                  v-for="e in filteredDayExpenses(d.dayId)"
                  :key="e.id"
                  style="display: flex; align-items: center; gap: 10px"
                >
                  <div class="cat-icon cat-icon--sm" :style="catStyle(e.category)">
                    {{ catEmoji(e.category) }}
                  </div>
                  <span
                    style="flex: 1; font: 400 13px/1.3 var(--font-sans); color: var(--text-primary)"
                    >{{ e.description || e.category || 'Expense' }}</span
                  >
                  <span class="money money--sm" style="color: var(--text-secondary)">
                    {{ Number(e.amount).toFixed(2) }}
                    {{ e.currency && e.currency !== currency ? e.currency : currency }}
                  </span>
                  <TfTooltip text="Delete">
                    <button class="del-btn" @click.stop="deleteExpense(d.dayId, e.id)">
                      <i class="pi pi-times" style="font-size: 10px"></i>
                    </button>
                  </TfTooltip>
                </div>
              </div>
            </template>

            <div
              v-if="!filteredDayExpenses(d.dayId).length"
              style="font: var(--type-small); color: var(--text-secondary); padding: 8px 0"
            >
              No expenses for this day{{ filterCat !== 'All' ? ' in this category' : '' }}.
            </div>

            <TfButton
              size="sm"
              variant="ghost"
              style="margin-top: 12px"
              @click.stop="openExpenseDialog(d.dayId)"
            >
              <i class="pi pi-plus" style="font-size: 14px"></i> Expense for this day
            </TfButton>
          </div>
        </div>
      </div>

      <!-- Multi-currency note -->
      <div
        style="
          font: var(--type-small);
          color: var(--text-secondary);
          margin-top: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        "
      >
        <i class="pi pi-info-circle" style="font-size: 13px"></i>
        Multi-currency: all amounts are shown in {{ currency }} — bookings use the rate saved on
        each booking, activity estimates and expenses are converted at live rates.
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
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px">
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
import {
  TfButton,
  TfBadge,
  TfModal,
  TfSelect,
  TfInput,
  TfNumberInput,
  TfTooltip,
  toast,
} from '@tripyfull/ui';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { api, formatDateShort } from '@tripyfull/core';

const route = useRoute();

const tripId = route.params.tripId;
const tripTitle = ref('');
const tripDates = ref('');
// Use the currency returned by the backend (= user's baseCurrency at time of calculation)
// Falls back to accountCurrency while budget is loading
const currency = computed(() => budget.value?.baseCurrency || accountCurrency.value);
const budget = ref(null);
const dayExpenses = ref({});
const loading = ref(false);
const showExpenseDialog = ref(false);
const savingExpense = ref(false);
const expenseDayId = ref(null);
const expenseDayIdSelect = ref(null);
const expenseForm = ref({ category: null, amount: null, currency: '', description: '' });

const catMode = ref('Both');
const activeMetric = ref(null);
const filterCat = ref('All');
const expandedDay = ref(null);
const bookings = ref([]);

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
      label: `Day ${d.dayNumber}${d.city ? ' · ' + d.city : ''} (${formatDateShort(d.date)})`,
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

const catEmoji = (c) =>
  ({
    FOOD: '\u{1F37D}',
    TRANSPORT: '\u{1F68C}',
    ACTIVITY: '\u{1F3AB}',
    ACCOMMODATION: '\u{1F3E8}',
    TRANSPORTATION: '\u{1F68C}',
    OTHER: '\u{1F4CC}',
  })[c] ?? '\u{1F4CC}';
const catLabel = (c) =>
  ({
    FOOD: 'Food',
    TRANSPORT: 'Transport',
    TRANSPORTATION: 'Transportation',
    ACTIVITY: 'Activity',
    ACCOMMODATION: 'Accommodation',
    OTHER: 'Other',
  })[c] ?? c;
const catColor = (c) =>
  ({
    FOOD: 'var(--warning-300)',
    TRANSPORT: 'var(--accent)',
    TRANSPORTATION: 'var(--accent)',
    ACTIVITY: 'var(--success-300)',
    ACCOMMODATION: 'var(--accent)',
    OTHER: 'var(--ink-400)',
  })[c] || 'var(--accent)';
const catStyle = (c) =>
  ({
    FOOD: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    TRANSPORT: { background: 'var(--success-100)', color: 'var(--accent)' },
    TRANSPORTATION: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACTIVITY: { background: 'var(--success-100)', color: 'var(--success-300)' },
    ACCOMMODATION: { background: 'var(--danger-100)', color: 'var(--accent)' },
    OTHER: { background: 'var(--surface)', color: 'var(--ink-500)' },
  })[c] || { background: 'var(--surface)', color: 'var(--ink-500)' };

// Bookings where priceCurrency differs from base but exchangeRate is missing
const missingRateCount = computed(
  () =>
    bookings.value.filter(
      (b) =>
        b.priceCurrency &&
        b.priceCurrency !== (budget.value?.baseCurrency || accountCurrency.value) &&
        !b.exchangeRate,
    ).length,
);

// Server-computed budget: the backend converts everything to the base currency
// (stored booking rates → live rates → raw pass-through, incl. activity estimates
// and expense currencies), so the Overview card and this screen always agree.
const totalPlanned = computed(() => Number(budget.value?.totalPlanned || 0));
const bookingsRemaining = computed(() => Number(budget.value?.bookingsRemaining || 0));
const upcomingPayments = computed(() => budget.value?.upcomingPayments || []);

const paidTotal = computed(
  () => Number(budget.value?.bookingsPaid || 0) + Number(budget.value?.expensesTotal || 0),
);

const paidPct = computed(() => {
  if (!totalPlanned.value) return 0;
  return Math.round((paidTotal.value / totalPlanned.value) * 100);
});

const expenseCount = computed(() => {
  return Object.values(dayExpenses.value).reduce((s, arr) => s + arr.length, 0);
});

const allCategories = computed(() => {
  const cats = new Set([
    ...Object.keys(budget.value?.actualByCategory || {}),
    ...Object.keys(budget.value?.plannedByCategory || {}),
  ]);
  return [...cats];
});

const categoryBreakdown = computed(() => {
  return allCategories.value
    .map((cat) => {
      const plan = Number(budget.value?.plannedByCategory?.[cat] || 0);
      const actualCat = Number(budget.value?.actualByCategory?.[cat] || 0);
      return { cat, plan, fact: actualCat, over: actualCat > plan && plan > 0 };
    })
    .filter((c) => c.plan > 0 || c.fact > 0);
});

const overCategories = computed(() => categoryBreakdown.value.filter((c) => c.over));

const filterCatMap = { Food: 'FOOD', Transport: 'TRANSPORT', Activity: 'ACTIVITY' };

const filteredDayExpenses = (dayId) => {
  const exps = dayExpenses.value[dayId] || [];
  const catKey = filterCatMap[filterCat.value];
  if (!catKey) return exps;
  return exps.filter((e) => e.category === catKey);
};

const progressPct = (value, max) =>
  max > 0 ? Math.min(100, Math.round((Number(value) / Number(max)) * 100)) : 0;
const fmt = (v) => `${Number(v || 0).toFixed(2)}`;
const delta = (actual, planned) => {
  const d = Number(actual) - Number(planned);
  return (d > 0 ? '+' : '') + d.toFixed(2);
};

const toggleMetric = (m) => {
  activeMetric.value = activeMetric.value === m ? null : m;
};
const toggleDay = (dayId) => {
  expandedDay.value = expandedDay.value === dayId ? null : dayId;
};

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
  const [budgetRes, bookingsRes] = await Promise.all([
    api.get(`/api/trips/${tripId}/budget`),
    api.get(`/api/trips/${tripId}/bookings`),
  ]);
  budget.value = budgetRes.data;
  bookings.value = bookingsRes.data;
};

onMounted(async () => {
  loading.value = true;
  try {
    const [tripRes, budgetRes, bookingsRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get(`/api/trips/${tripId}/budget`),
      api.get(`/api/trips/${tripId}/bookings`),
    ]);
    tripTitle.value = tripRes.data.title;
    if (tripRes.data.startDate && tripRes.data.endDate) {
      tripDates.value =
        formatDateShort(tripRes.data.startDate) + ' – ' + formatDateShort(tripRes.data.endDate);
    }
    budget.value = budgetRes.data;
    bookings.value = bookingsRes.data;

    const dayIds = budgetRes.data.days.map((d) => d.dayId);
    const results = await Promise.all(
      dayIds.map((id) =>
        api
          .get(`/api/days/${id}/expenses`)
          .then((r) => ({ id, data: r.data }))
          .catch(() => ({ id, data: [] })),
      ),
    );
    const map = {};
    results.forEach((r) => {
      map[r.id] = r.data;
    });
    dayExpenses.value = map;

    if (budgetRes.data.days.length) {
      expandedDay.value = budgetRes.data.days[0].dayId;
    }
  } catch {
    toast.danger('Error', 'Failed to load budget');
  } finally {
    loading.value = false;
  }
});
</script>
