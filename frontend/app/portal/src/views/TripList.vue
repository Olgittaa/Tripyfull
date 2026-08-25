<template>
  <div class="page-content">
    <!-- Page head -->
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">Tripyfull</div>
        <h1>My trips</h1>
        <p>Everything you planned — beautifully in order.</p>
      </div>
      <div class="page-head-actions">
        <TfButton icon="pi-plus" @click="showDialog = true">New trip</TfButton>
      </div>
    </div>

    <!-- Filter -->
    <div style="margin-bottom: 20px">
      <TfSegmentedControl v-model="filterLabel" :options="filterLabels" class="status-filter" />
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="store.loading"
      style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px"
    >
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
          <TfTooltip text="Delete">
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
      <h3>{{ filterStatus === 'ALL' ? 'No trips yet' : 'No trips here' }}</h3>
      <p>
        {{
          filterStatus === 'ALL'
            ? 'Add your first trip and start planning.'
            : 'No trips with this status.'
        }}
      </p>
      <TfButton v-if="filterStatus === 'ALL'" icon="pi-plus" @click="showDialog = true"
        >New trip</TfButton
      >
    </div>

    <!-- Add Trip Dialog -->
    <TfModal v-model="showDialog" title="New trip" @update:model-value="onDialogToggle">
      <form @submit.prevent="addTrip" class="dialog-form">
        <TfInput label="Title *" v-model="form.title" placeholder="e.g. Greece 2026" />
        <div class="field">
          <label>Destination</label>
          <TfCitySearch v-model="form.destination" placeholder="City or country" />
        </div>
        <div class="field">
          <label>Dates</label>
          <TfDatePicker v-model="dateRange" mode="range" />
        </div>
        <TfSelect label="Status" v-model="statusLabelModel" :options="statusLabels" />
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
          <TfButton type="button" variant="ghost" @click="showDialog = false">Cancel</TfButton>
          <TfButton type="submit" icon="pi-plus" :loading="adding">Create</TfButton>
        </div>
      </form>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTripStore } from '@/stores/tripStore.js';
import {
  toDateStr,
  formatDateShort,
  tripStatusLabel as statusLabel,
  tripStatusTone as statusTone,
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
const form = ref({ title: '', destination: '', status: 'DRAFT' });

const filterOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
];

// TfSegmentedControl / TfSelect use string options; map label <-> value here.
const filterLabels = filterOptions.map((o) => o.label);
const filterLabel = computed({
  get: () => filterOptions.find((o) => o.value === filterStatus.value)?.label ?? filterLabels[0],
  set: (label) => {
    filterStatus.value = filterOptions.find((o) => o.label === label)?.value ?? 'ALL';
  },
});

const statusLabels = statusOptions.map((o) => o.label);
const statusLabelModel = computed({
  get: () => statusOptions.find((o) => o.value === form.value.status)?.label,
  set: (label) => {
    form.value.status = statusOptions.find((o) => o.label === label)?.value ?? 'DRAFT';
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
    toast.success('Created', `Trip "${trip.title}" added`);
  } catch {
    toast.danger('Error', 'Failed to create trip');
  } finally {
    adding.value = false;
  }
};

const confirmDelete = (trip) => {
  confirm({
    title: 'Confirm Delete',
    message: `Delete trip "${trip.title}"? This cannot be undone.`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }).then((ok) => {
    if (ok) {
      deleteTrip(trip.id);
    }
  });
};

const deleteTrip = async (id) => {
  try {
    await store.remove(id);
    toast.success('Deleted', 'Trip deleted');
  } catch {
    toast.danger('Error', 'Failed to delete trip');
  }
};

const resetForm = () => {
  form.value = { title: '', destination: '', status: 'DRAFT' };
  dateRange.value = null;
};

// TfModal has no @hide; reset the form when it closes.
const onDialogToggle = (open) => {
  if (!open) resetForm();
};

const formatDate = formatDateShort;

onMounted(() => {
  store.fetchAll().catch(() => {
    toast.danger('Error', 'Failed to load trips');
  });
});
</script>
