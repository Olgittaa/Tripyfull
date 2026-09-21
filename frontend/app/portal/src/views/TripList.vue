<template>
  <div class="page-content page-content--full">
    <!-- Page head -->
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">Tripyfull</div>
        <h1>{{ t('trips.title') }}</h1>
        <p>{{ t('trips.subtitle') }}</p>
      </div>
      <div class="page-head-actions">
        <TfButton
          variant="secondary"
          icon="pi-upload"
          :aria-label="t('trips.importAria')"
          :title="t('trips.importHint')"
          :loading="importing"
          @click="fileInput?.click()"
          >{{ t('trips.import') }}</TfButton
        >
        <input
          ref="fileInput"
          type="file"
          accept=".zip,application/zip"
          hidden
          data-testid="trip-file"
          @change="importTrip"
        />
        <TfButton icon="pi-plus" @click="openNewTrip">{{ t('trips.new') }}</TfButton>
      </div>
    </div>

    <!-- Filter -->
    <div style="margin-bottom: 20px">
      <TfSegmentedControl v-model="filterLabel" :options="filterLabels" class="status-filter" />
    </div>

    <!-- Loading skeleton -->
    <div v-if="store.loading" class="trip-gallery">
      <div
        v-for="i in 3"
        :key="i"
        style="
          background: var(--card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          overflow: hidden;
        "
      >
        <div class="skeleton" style="height: 130px; border-radius: 0"></div>
        <div style="padding: 18px">
          <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 10px"></div>
          <div class="skeleton" style="height: 14px; width: 50%"></div>
        </div>
      </div>
    </div>

    <!-- Trip cards grid -->
    <TransitionGroup v-else name="gallery" tag="div" class="trip-gallery">
      <div
        v-for="trip in filteredTrips"
        :key="trip.id"
        class="trip-card"
        @click="$router.push(`/trips/${trip.id}`)"
      >
        <!-- Card header with wash gradient -->
        <div class="trip-card-header" :class="washClass(trip.status)">
          <div class="trip-card-overlay"></div>
          <span class="trip-card-badge">
            <TfBadge :tone="statusTone(trip.status)" variant="solid">{{
              statusLabel(trip.status)
            }}</TfBadge>
          </span>
          <div class="trip-card-title-area">
            <h3>{{ trip.title }}</h3>
            <p v-if="trip.destination">{{ trip.destination }}</p>
          </div>
          <TfTooltip :text="t('trips.deleteTooltip')">
            <button class="trip-card-del" @click.stop="confirmDelete(trip)">
              <i class="pi pi-times"></i>
            </button>
          </TfTooltip>
        </div>

        <!-- Card body with dates + budget progress -->
        <div class="trip-card-body">
          <div class="trip-card-dates">
            <i class="pi pi-calendar" style="font-size: 13px"></i>
            {{ formatDate(trip.startDate) }} – {{ formatDate(trip.endDate) }}
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Empty state -->
    <div v-if="!filteredTrips.length && !store.loading" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-compass"></i></div>
      <h3>{{ filterStatus === 'ALL' ? t('trips.noneYet') : t('trips.noneHere') }}</h3>
      <p>
        {{ filterStatus === 'ALL' ? t('trips.addFirst') : t('trips.noneWithStatus') }}
      </p>
      <TfButton v-if="filterStatus === 'ALL'" icon="pi-plus" @click="openNewTrip">{{
        t('trips.new')
      }}</TfButton>
    </div>

    <!-- Add Trip Dialog -->
    <TfModal v-model="showDialog" :title="t('trips.new')" @update:model-value="onDialogToggle">
      <form @submit.prevent="addTrip" class="dialog-form">
        <TfInput
          :label="t('trips.form.title')"
          v-model="form.title"
          :placeholder="t('trips.form.titlePlaceholder')"
        />
        <div class="field">
          <label>{{ t('trips.form.destination') }}</label>
          <TfCitySearch
            v-model="form.destination"
            :placeholder="t('trips.form.destinationPlaceholder')"
          />
        </div>
        <div class="field">
          <label>{{ t('trips.form.dates') }}</label>
          <TfDatePicker v-model="dateRange" mode="range" />
        </div>
        <div class="field-pair">
          <TfSelect
            :label="t('trips.form.status')"
            v-model="statusLabelModel"
            :options="statusLabels"
          />
          <!-- The trip's money is counted in this; the account's currency is only
               where it starts. A client billed in dollars gets it here. -->
          <TfSelect
            :label="t('trips.form.currency')"
            v-model="form.baseCurrency"
            :options="CURRENCIES"
          />
        </div>
        <div
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 11px 14px;
            background: var(--success-100);
            border-radius: var(--radius-md);
            color: var(--success-500);
            font: var(--type-small);
          "
        >
          <i class="pi pi-info-circle"></i> Days will be generated automatically from your selected
          dates.
        </div>
        <div class="dialog-actions">
          <TfButton type="button" variant="ghost" @click="showDialog = false">{{
            t('common.cancel')
          }}</TfButton>
          <TfButton type="submit" icon="pi-plus" :loading="adding">{{
            t('common.create')
          }}</TfButton>
        </div>
      </form>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTripStore } from '@/stores/tripStore.js';
import { t } from '@tripyfull/core';
import { api } from '@tripyfull/core';
import {
  toDateStr,
  formatDateShort,
  tripStatusLabel as statusLabel,
  tripStatusTone as statusTone,
  baseCurrency,
  CURRENCIES,
} from '@tripyfull/core';
import {
  TfBadge,
  TfCitySearch,
  TfButton,
  TfSegmentedControl,
  TfModal,
  TfInput,
  TfSelect,
  TfDatePicker,
  TfTooltip,
  toast,
  confirm,
} from '@tripyfull/ui';

const store = useTripStore();

const adding = ref(false);
const showDialog = ref(false);
const filterStatus = ref('ALL');
const dateRange = ref(null);
const form = ref({ title: '', destination: '', status: 'DRAFT', baseCurrency: baseCurrency.value });

// Labels are read in computeds so a change of language re-labels them.
const STATUSES = ['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED'];
const statusOptions = computed(() =>
  STATUSES.map((value) => ({ label: statusLabel(value), value })),
);
const filterOptions = computed(() => [
  { label: t('trips.filterAll'), value: 'ALL' },
  ...statusOptions.value,
]);
// TfSegmentedControl / TfSelect use string options; map label <-> value here.
const filterLabels = computed(() => filterOptions.value.map((o) => o.label));
const filterLabel = computed({
  get: () =>
    filterOptions.value.find((o) => o.value === filterStatus.value)?.label ?? filterLabels.value[0],
  set: (label) => {
    filterStatus.value = filterOptions.value.find((o) => o.label === label)?.value ?? 'ALL';
  },
});
const statusLabels = computed(() => statusOptions.value.map((o) => o.label));
const statusLabelModel = computed({
  get: () => statusOptions.value.find((o) => o.value === form.value.status)?.label,
  set: (label) => {
    form.value.status = statusOptions.value.find((o) => o.label === label)?.value ?? 'DRAFT';
  },
});

const filteredTrips = computed(() => store.tripsByStatus(filterStatus.value));

const washClass = (status) =>
  ({
    DRAFT: 'wash-neutral',
    PLANNED: 'wash-gold',
    ACTIVE: 'wash-ocean',
    COMPLETED: 'wash-dusk',
  })[status] || 'wash-neutral';

const addTrip = async () => {
  adding.value = true;
  try {
    const payload = {
      ...form.value,
      startDate: toDateStr(dateRange.value?.[0]),
      endDate: toDateStr(dateRange.value?.[1]),
    };
    const trip = await store.create(payload);
    showDialog.value = false;
    toast.success(t('trips.created'), t('trips.createdMsg', { title: trip.title }));
  } catch {
    toast.danger(t('common.error'), t('trips.createFailed'));
  } finally {
    adding.value = false;
  }
};

const confirmDelete = (trip) => {
  confirm({
    title: t('trips.confirmDeleteTitle'),
    message: t('trips.confirmDeleteMsg', { title: trip.title }),
    tone: 'danger',
    confirmLabel: t('common.delete'),
    cancelLabel: t('common.cancel'),
  }).then((ok) => {
    if (ok) {
      deleteTrip(trip.id);
    }
  });
};

const deleteTrip = async (id) => {
  try {
    await store.remove(id);
    toast.success(t('common.deleted'), t('trips.deletedMsg'));
  } catch {
    toast.danger(t('common.error'), t('trips.deleteFailed'));
  }
};

const resetForm = () => {
  form.value = {
    title: '',
    destination: '',
    status: 'DRAFT',
    baseCurrency: baseCurrency.value,
  };
  dateRange.value = null;
};

// TfModal has no @hide; reset the form when it closes.
const onDialogToggle = (open) => {
  if (!open) resetForm();
};

/** Opening takes the account's currency, which may have arrived from the server
    after this screen was built. */
const openNewTrip = () => {
  form.value.baseCurrency = baseCurrency.value;
  showDialog.value = true;
};

const formatDate = formatDateShort;

/** A trip file made by Export — here or in another account — becomes a new trip. */
const router = useRouter();
const fileInput = ref(null);
const importing = ref(false);
const importTrip = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = ''; // so the same file can be chosen again after a failure
  if (!file) return;
  importing.value = true;
  try {
    const body = new FormData();
    body.append('file', file);
    const { data } = await api.post('/api/trips/import', body);
    await store.fetchAll();
    toast.success(t('trips.imported'), t('trips.createdMsg', { title: data.title }));
    router.push(`/trips/${data.id}`);
  } catch (e) {
    toast.danger(t('common.error'), e.response?.data?.error || t('trips.importFailed'));
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  store.fetchAll().catch(() => {
    toast.danger(t('common.error'), t('trips.loadFailed'));
  });
});
</script>
