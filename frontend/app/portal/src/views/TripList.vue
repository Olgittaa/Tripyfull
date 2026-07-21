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
        <PButton icon="pi pi-plus" label="New trip" @click="showDialog = true" />
      </div>
    </div>

    <!-- Filter -->
    <div style="margin-bottom: 20px">
      <PSelectButton
        v-model="filterStatus"
        :options="filterOptions"
        optionLabel="label"
        optionValue="value"
        class="status-filter"
      />
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
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
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
          <button class="trip-card-del" @click.stop="confirmDelete(trip)" v-tooltip="'Delete'">
            <i class="pi pi-times"></i>
          </button>
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
      <PButton
        v-if="filterStatus === 'ALL'"
        icon="pi pi-plus"
        label="New trip"
        @click="showDialog = true"
      />
    </div>

    <!-- Add Trip Dialog -->
    <PDialog
      v-model:visible="showDialog"
      header="New trip"
      modal
      :style="{ width: '480px' }"
      :draggable="false"
      @hide="resetForm"
    >
      <form @submit.prevent="addTrip" class="dialog-form">
        <div class="field">
          <label>Title *</label>
          <PInputText v-model="form.title" placeholder="e.g. Greece 2026" required class="w-full" />
        </div>
        <div class="field">
          <label>Destination</label>
          <TfCitySearch v-model="form.destination" placeholder="City or country" />
        </div>
        <div class="field">
          <label>Dates</label>
          <PDatePicker
            v-model="dateRange"
            selectionMode="range"
            placeholder="Select date range"
            showIcon
            dateFormat="dd/mm/yy"
            class="w-full"
            :manualInput="false"
          />
        </div>
        <div class="field">
          <label>Status</label>
          <PSelect
            v-model="form.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 11px 14px;
            background: var(--info-100);
            border-radius: var(--radius-md);
            color: var(--info-500);
            font: var(--type-small);
          "
        >
          <i class="pi pi-info-circle"></i> Days will be generated automatically from your selected
          dates.
        </div>
        <div class="dialog-actions">
          <PButton
            type="button"
            label="Cancel"
            severity="secondary"
            text
            @click="showDialog = false"
          />
          <PButton type="submit" label="Create" icon="pi pi-plus" :loading="adding" />
        </div>
      </form>
    </PDialog>

    <PConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useTripStore } from '@/stores/tripStore.js';
import { TfBadge, TfCitySearch } from '@tripyfull/ui';

const toast = useToast();
const confirm = useConfirm();
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

const filteredTrips = computed(() => store.tripsByStatus(filterStatus.value));

const washClass = (status) =>
  ({
    DRAFT: 'wash-neutral',
    PLANNED: 'wash-gold',
    ACTIVE: 'wash-ocean',
    COMPLETED: 'wash-dusk',
  })[status] || 'wash-neutral';

const statusTone = (status) =>
  ({
    DRAFT: 'neutral',
    PLANNED: 'gold',
    ACTIVE: 'brand',
    COMPLETED: 'success',
  })[status] || 'neutral';

const statusLabel = (s) =>
  ({ DRAFT: 'Draft', PLANNED: 'Planned', ACTIVE: 'Active', COMPLETED: 'Completed' })[s];

const toDateStr = (d) => {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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
    toast.add({
      severity: 'success',
      summary: 'Created',
      detail: `Trip "${trip.title}" added`,
      life: 3000,
    });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create trip', life: 3000 });
  } finally {
    adding.value = false;
  }
};

const confirmDelete = (trip) => {
  confirm.require({
    message: `Delete trip "${trip.title}"? This cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', text: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => deleteTrip(trip.id),
  });
};

const deleteTrip = async (id) => {
  try {
    await store.remove(id);
    toast.add({ severity: 'success', summary: 'Deleted', detail: 'Trip deleted', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete trip', life: 3000 });
  }
};

const resetForm = () => {
  form.value = { title: '', destination: '', status: 'DRAFT' };
  dateRange.value = null;
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const day = dt.getDate();
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
  return `${day} ${months[dt.getMonth()]}`;
};

onMounted(() => {
  store.fetchAll().catch(() => {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load trips', life: 3000 });
  });
});
</script>
