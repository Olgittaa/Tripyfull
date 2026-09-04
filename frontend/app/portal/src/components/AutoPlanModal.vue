<template>
  <TfModal :modelValue="modelValue" @update:modelValue="close" title="Auto-plan the trip" size="lg">
    <!-- Step 1: what to plan and from where -->
    <div class="dialog-form">
      <p class="text-muted text-sm" style="margin: 0">
        Places are grouped by geography into days (buffer days are skipped), types are balanced so
        you don't get five temples in a row, and each day is ordered as a walkable route from your
        base point. Must-see places are seated first.
      </p>
      <div class="form-row">
        <div style="flex: 1">
          <TfSelect
            label="Places from"
            v-model="sourceLabel"
            :options="sourceLabels"
            placeholder="All my places"
          />
        </div>
        <div style="flex: 1">
          <TfSelect label="Base point (hotel)" v-model="baseLabel" :options="baseLabels" />
        </div>
        <div style="width: 120px">
          <div class="field">
            <label>Max per day</label>
            <TfNumberInput v-model="maxPerDay" type="plain" :precision="0" />
          </div>
        </div>
      </div>
      <div class="text-subtle text-xs">
        {{ selectedPlaces.length }} place{{ selectedPlaces.length === 1 ? '' : 's' }} selected
        <span v-if="noCoordsCount">
          · {{ noCoordsCount }} without coordinates (will stay unassigned)</span
        >
      </div>

      <!-- Step 2: preview -->
      <template v-if="plan">
        <div v-for="d in plan.days" :key="d.dayId" class="card" style="padding: 12px 14px">
          <div style="display: flex; justify-content: space-between; align-items: baseline">
            <span style="font: var(--fw-bold) 14px/1 var(--font-display)"
              >Day {{ d.dayNumber }} · {{ formatDateShort(d.date) }}</span
            >
            <span class="text-subtle text-xs" v-if="d.places.length"
              >{{ d.places.length }} stops · ~{{ d.totalKm }} km</span
            >
            <span class="text-subtle text-xs" v-else>empty</span>
          </div>
          <div
            v-if="d.places.length"
            style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px"
          >
            <TfBadge
              v-for="(p, i) in d.places"
              :key="p.placeId"
              :tone="p.rating === 5 ? 'gold' : 'neutral'"
              variant="soft"
            >
              {{ i + 1 }}. {{ p.rating === 5 ? '⭐ ' : '' }}{{ p.name
              }}{{ p.needsBooking ? ' 🎟' : '' }}
            </TfBadge>
          </div>
        </div>
        <div v-if="plan.unassigned.length" class="card" style="padding: 12px 14px">
          <div style="font: var(--fw-bold) 14px/1 var(--font-display)">
            Didn't fit / no coordinates
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px">
            <TfBadge v-for="p in plan.unassigned" :key="p.placeId" tone="neutral" variant="soft">
              {{ p.rating === 5 ? '⭐ ' : '' }}{{ p.name }}
            </TfBadge>
          </div>
        </div>
        <p class="text-subtle text-xs" style="margin: 0">
          🎟 — needs advance booking. Applying appends these as activities; nothing existing is
          removed. You can swap whole days afterwards from the itinerary.
        </p>
      </template>
    </div>

    <template #footer>
      <TfButton variant="ghost" @click="close(false)">Cancel</TfButton>
      <TfButton variant="secondary" :disabled="planning || !selectedPlaces.length" @click="runPlan">
        {{ planning ? 'Planning…' : plan ? 'Re-plan' : 'Build plan' }}
      </TfButton>
      <TfButton v-if="plan" variant="primary" :disabled="applying" @click="applyPlan">
        {{ applying ? 'Applying…' : 'Apply plan' }}
      </TfButton>
    </template>
  </TfModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { TfModal, TfSelect, TfNumberInput, TfButton, TfBadge, toast } from '@tripyfull/ui';
import { api, formatDateShort } from '@tripyfull/core';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tripId: { type: String, required: true },
});
const emit = defineEmits(['update:modelValue', 'applied']);

const folders = ref([]);
const places = ref([]);
const bookings = ref([]);
const sourceLabel = ref('All my places');
const baseLabel = ref('Center of selected places');
const maxPerDay = ref(4);
const plan = ref(null);
const planning = ref(false);
const applying = ref(false);

const close = (v) => {
  if (v === true) return; // TfModal opening from inside — ignore
  emit('update:modelValue', false);
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    plan.value = null;
    try {
      const [f, p, b] = await Promise.all([
        api.get('/api/folders'),
        api.get('/api/places'),
        api.get(`/api/trips/${props.tripId}/bookings`),
      ]);
      folders.value = f.data || [];
      places.value = (p.data || []).filter((x) => x.owned);
      bookings.value = (b.data || []).filter((x) => x.latitude != null && x.longitude != null);
      baseLabel.value = bookings.value.length
        ? `${bookings.value[0].name}`
        : 'Center of selected places';
    } catch {
      toast.danger('Error', 'Failed to load places');
    }
  },
);

const sourceLabels = computed(() => ['All my places', ...folders.value.map((f) => f.name)]);
const baseLabels = computed(() => [
  ...bookings.value.map((b) => b.name),
  'Center of selected places',
]);

const selectedPlaces = computed(() => {
  if (sourceLabel.value === 'All my places') return places.value;
  const folder = folders.value.find((f) => f.name === sourceLabel.value);
  return folder ? places.value.filter((p) => p.folderId === folder.id) : places.value;
});
const noCoordsCount = computed(
  () => selectedPlaces.value.filter((p) => p.latitude == null || p.longitude == null).length,
);

const runPlan = async () => {
  planning.value = true;
  try {
    const baseBooking = bookings.value.find((b) => b.name === baseLabel.value);
    const res = await api.post(`/api/trips/${props.tripId}/plan`, {
      placeIds: selectedPlaces.value.map((p) => p.id),
      baseLatitude: baseBooking ? baseBooking.latitude : null,
      baseLongitude: baseBooking ? baseBooking.longitude : null,
      maxPerDay: maxPerDay.value || null,
    });
    plan.value = res.data;
  } catch (e) {
    const msg = e.response?.data?.error || 'Failed to build a plan';
    toast.danger('Error', msg);
  } finally {
    planning.value = false;
  }
};

const applyPlan = async () => {
  applying.value = true;
  try {
    await api.post(`/api/trips/${props.tripId}/plan/apply`, {
      days: plan.value.days.map((d) => ({
        dayId: d.dayId,
        placeIds: d.places.map((p) => p.placeId),
      })),
    });
    toast.success('Planned', 'Activities added to the itinerary');
    emit('applied');
    emit('update:modelValue', false);
  } catch {
    toast.danger('Error', 'Failed to apply the plan');
  } finally {
    applying.value = false;
  }
};
</script>
