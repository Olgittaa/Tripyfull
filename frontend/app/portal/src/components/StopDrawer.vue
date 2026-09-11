<template>
  <TfDrawer
    v-model="open"
    :title="isBookingStop ? 'From a booking' : editingActivity ? 'Edit stop' : 'New stop'"
    :eyebrow="day ? `Day ${day.dayNumber} · ${day.city || ''}` : ''"
  >
    <!-- A stop written by the booking sync belongs to its booking: the next
       "Update plan" rewrites it, so there is nothing to edit here. -->
    <template v-if="isBookingStop">
      <TfDrawerSection label="Stop">
        <div class="booking-stop">
          <div class="booking-stop-name">{{ editingActivity.name }}</div>
          <div v-if="editingActivity.startTime" class="booking-stop-line">
            🕘 {{ editingActivity.startTime.slice(0, 5)
            }}<template v-if="editingActivity.endTime">
              – {{ editingActivity.endTime.slice(0, 5) }}</template
            >
          </div>
          <div v-if="editingActivity.address" class="booking-stop-line">
            {{ editingActivity.address }}
          </div>
          <div v-if="editingActivity.notes" class="booking-stop-line">
            {{ editingActivity.notes }}
          </div>
        </div>
        <p class="hint" style="margin: 4px 0 0">
          This stop comes from a booking. Times, names and places are taken from there — change the
          booking and press <strong>Update plan</strong> on the Bookings page; editing it here would
          be undone by the next update.
        </p>
      </TfDrawerSection>
    </template>

    <form v-else @submit.prevent="saveActivity">
      <!-- What: a name is enough; a place adds the map pin and the library's facts -->
      <TfDrawerSection label="What">
        <TfInput
          v-model="form.name"
          label="Name"
          required
          :error="attempted && !form.name.trim() ? 'Say what the stop is' : ''"
          placeholder="e.g. White Temple, lunch at the market, beach afternoon"
          class="w-full"
        />

        <div v-if="linkedPlace" class="linked-place">
          <i class="pi pi-bookmark" style="color: var(--accent)"></i>
          <span class="linked-name">{{ linkedPlaceName }}</span>
          <button type="button" class="link-edit" @click="goEditPlace">
            Edit place <i class="pi pi-arrow-up-right" style="font-size: 10px"></i>
          </button>
          <TfTooltip text="Unlink the place (the stop stays)">
            <button type="button" class="del-btn" @click="unlinkPlace">
              <i class="pi pi-times"></i>
            </button>
          </TfTooltip>
        </div>
        <template v-else>
          <TfSelect
            label="Place"
            :modelValue="selectedPlaceLabel"
            @update:modelValue="onPlaceLabelPicked"
            :options="placeLabelOptions"
            placeholder="Pick one of your places…"
            helper="Optional. Links the stop to a place: it gets a pin on the map and its rating, time and notes."
            class="w-full"
          />
          <div v-if="FEATURES.geoPlaceSearch" class="field">
            <label class="label">Not saved yet? Search a place or an address</label>
            <TfPlaceSearch
              placeholder="A landmark, a café… or a street address"
              @select="onActivityGeoPicked"
            />
            <span class="hint">Pins this stop on the map. Nothing is added to your places.</span>
            <!-- A venue (not a street or a town) can also go to the library, but only if asked. -->
            <TfCheckbox v-if="pickedVenue" v-model="saveVenueToPlaces" style="margin-top: 8px">
              Also save “{{ pickedVenue.name || pickedVenue.displayName }}” to my places
            </TfCheckbox>
          </div>
          <!-- When the map search draws a blank: a pin can still be placed by hand. -->
          <TfInput
            v-model="coordsText"
            label="Coordinates"
            placeholder="19.906, 99.835 — if the search can't find it"
            :error="coordsText.trim() && !parsedCoords ? 'Two numbers: latitude, longitude' : ''"
            :helper="
              parsedCoords
                ? `Pinned at ${parsedCoords.lat.toFixed(5)}, ${parsedCoords.lon.toFixed(5)}`
                : 'Right-click a spot in Google Maps and copy what it shows.'
            "
            class="w-full"
          />
        </template>
        <!-- Where the pin lands, whatever put it there. -->
        <BookingMap v-if="stopPreviewMarkers.length" :markers="stopPreviewMarkers" :height="160" />

        <TfSelect
          label="Type"
          :modelValue="selectedTypeLabel"
          @update:modelValue="onTypeLabelPicked"
          :options="typeLabelOptions"
          placeholder="Select type"
          class="w-full"
        />
        <p v-if="!linkedPlace && form.address" class="stop-address">
          <i class="pi pi-map-marker"></i> {{ form.address }}
          <button type="button" class="link-btn" @click="form.address = ''">clear</button>
        </p>
      </TfDrawerSection>

      <!-- When -->
      <TfDrawerSection label="When">
        <TfSelect
          v-if="editingActivity && moveDayLabels.length > 1"
          label="Day"
          v-model="moveDayLabel"
          :options="moveDayLabels"
          class="w-full"
          helper="Pick another day to move this stop there"
        />
        <div class="field-pair">
          <TfTimePicker
            v-model="form.startTime"
            label="Start"
            :placeholder="
              editingActivity && derivedTimes[editingActivity.id]
                ? `≈ ${derivedTimes[editingActivity.id]}`
                : '09:00'
            "
            clearable
          />
          <TfTimePicker v-model="form.endTime" label="End" placeholder="11:00" clearable />
        </div>
      </TfDrawerSection>

      <!-- Details -->
      <TfDrawerSection label="Details">
        <div class="field-pair field-pair--wide">
          <TfNumberInput
            v-model="form.costEstimate"
            type="plain"
            :precision="2"
            label="Cost estimate"
            class="w-full"
          />
          <TfSelect
            label="Currency"
            v-model="form.costCurrency"
            :options="currencyOptions"
            class="w-full"
          />
        </div>
        <!-- Same box as on a booking: the rate into the home currency and what
           the estimate comes to. Live rate — an estimate is not a receipt. -->
        <div v-if="showCostRate" class="rate-box">
          <div style="flex: 1">
            <div class="rate-label">1 {{ form.costCurrency }} = ? {{ accountCurrency }}</div>
            <div class="rate-value">
              {{ costRate ? Number(costRate).toFixed(4) : '—' }}
              <span class="rate-unit">{{ accountCurrency }}</span>
            </div>
            <div v-if="form.costEstimate && costRate" class="hint">
              {{ Number(form.costEstimate).toFixed(2) }} {{ form.costCurrency }} ≈
              {{ (Number(form.costEstimate) * Number(costRate)).toFixed(2) }}
              {{ accountCurrency }}
            </div>
          </div>
          <TfButton
            size="sm"
            variant="secondary"
            @click="fetchCostRate"
            :disabled="fetchingCostRate"
          >
            <i
              class="pi pi-sync"
              :style="fetchingCostRate ? 'animation:spin 1s linear infinite' : ''"
              style="font-size: 13px"
            ></i>
            {{ fetchingCostRate ? '' : 'Update rate' }}
          </TfButton>
        </div>
        <TfTextarea
          label="Notes"
          v-model="form.notes"
          :rows="4"
          placeholder="What to see here, tickets, opening hours, what to watch out for"
          class="w-full"
        />
        <label class="save-place-toggle">
          <input type="checkbox" v-model="form.needsBooking" />
          <span
            ><i class="pi pi-ticket" style="font-size: 13px"></i> Needs advance booking (tour, show,
            popular spot)</span
          >
        </label>
        <!-- What you already wrote about this place in the library, so the day
           can be planned without leaving for the place editor. -->
        <div v-if="linkedPlace" class="linked-facts">
          <div class="linked-facts-head">
            <span>From your places</span>
            <button type="button" class="link-edit" @click="goEditPlace">Edit place</button>
          </div>
          <div class="linked-facts-row">
            <span>Rating</span>
            <span class="linked-facts-val"
              >★ {{ linkedPlace.rating || 3 }}
              <span class="text-subtle">{{ RATING_HINTS[linkedPlace.rating || 3] }}</span></span
            >
          </div>
          <div v-if="linkedPlace.visitMinutes" class="linked-facts-row">
            <span>Time to visit</span>
            <span class="linked-facts-val">{{ linkedPlace.visitMinutes }} min</span>
          </div>
          <div v-if="linkedPlace.ratingComment" class="linked-facts-row">
            <span>Why this rating</span>
            <span class="linked-facts-val">{{ linkedPlace.ratingComment }}</span>
          </div>
          <p v-if="linkedPlace.description" class="linked-facts-desc">
            {{ linkedPlace.description }}
          </p>
        </div>
      </TfDrawerSection>
    </form>
    <template #footer>
      <template v-if="isBookingStop">
        <TfButton variant="secondary" @click="$router.push(`/trips/${tripId}/bookings`)">
          <i class="pi pi-ticket" style="font-size: 13px"></i> Open bookings
        </TfButton>
        <span style="flex: 1"></span>
        <TfButton variant="ghost" @click="confirmDelete(editingActivity)"
          >Remove from this day</TfButton
        >
      </template>
      <template v-else>
        <TfButton variant="primary" style="flex: 1" @click="saveActivity" :disabled="saving">
          {{ saving ? 'Saving...' : editingActivity ? 'Save' : 'Add stop' }}
        </TfButton>
        <TfButton v-if="editingActivity" variant="ghost" @click="confirmDelete(editingActivity)"
          >Delete</TfButton
        >
      </template>
    </template>
  </TfDrawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api, baseCurrency as accountCurrency, CURRENCIES, formatDayDate } from '@tripyfull/core';
import {
  TfButton,
  TfCheckbox,
  TfDrawer,
  TfDrawerSection,
  TfInput,
  TfNumberInput,
  TfPlaceSearch,
  TfSelect,
  TfTextarea,
  TfTimePicker,
  TfTooltip,
  confirm,
  toast,
} from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import { FEATURES } from '@/config.js';
import { ACTIVITY_TYPES as typeOptions, placeToActivityType } from '@/plan/activityTypes.js';

/**
 * The stop editor: a new stop, an existing one, or one started from a saved
 * place. It owns the form and the saving; the screen opens it (openNew /
 * openEdit / openFromPlace) and hears "saved", "deleted" and "place-added" to
 * keep the day's list and the place library in step.
 */
const props = defineProps({
  tripId: { type: String, required: true },
  dayId: { type: String, required: true },
  day: { type: Object, default: null },
  /** All of the trip's days: an existing stop can be moved to another. */
  days: { type: Array, default: () => [] },
  /** The place library, for the place picker and the linked place's facts. */
  places: { type: Array, default: () => [] },
  /** activity id -> a start time worked out from the previous stop, shown as a placeholder. */
  derivedTimes: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['saved', 'deleted', 'place-added']);
const router = useRouter();
const currencyOptions = CURRENCIES;

const open = ref(false);
const saving = ref(false);
const editingActivity = ref(null);

const emptyForm = {
  name: '',
  type: null,
  startTime: '',
  endTime: '',
  address: '',
  costEstimate: null,
  costCurrency: null,
  notes: '',
  placeId: null,
  latitude: null,
  longitude: null,
  needsBooking: false,
};
const form = ref({ ...emptyForm });

/* Coordinates typed by hand, as one field: "lat, lon". Parsed live; the form
   only ever holds numbers or nothing. */
const coordsText = ref('');
const parsedCoords = computed(() => {
  const m = coordsText.value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]),
    lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
});
watch(parsedCoords, (c) => {
  form.value.latitude = c ? c.lat : null;
  form.value.longitude = c ? c.lon : null;
});

/* Cost in another currency: show the rate and the converted amount, like the
   booking editor does. Activities store no rate of their own — the budget
   converts estimates live — so this is a live lookup too. */
const costRate = ref(null);
const fetchingCostRate = ref(false);
const showCostRate = computed(
  () => !!form.value.costCurrency && form.value.costCurrency !== accountCurrency.value,
);
const fetchCostRate = async () => {
  if (!showCostRate.value) return;
  fetchingCostRate.value = true;
  try {
    const res = await api.get('/api/exchange-rate', {
      params: { from: form.value.costCurrency, to: accountCurrency.value },
    });
    costRate.value = res.data.rate;
  } catch {
    costRate.value = null;
    toast.warning('Rate unavailable', `Could not fetch a rate for ${form.value.costCurrency}`);
  } finally {
    fetchingCostRate.value = false;
  }
};
watch(
  () => form.value.costCurrency,
  (cur) => {
    costRate.value = null;
    if (cur && cur !== accountCurrency.value && open.value) fetchCostRate();
  },
);
// The form is filled before the drawer opens, so an existing foreign-currency
// estimate needs its rate looked up on open as well.
watch(open, (open) => {
  if (open && showCostRate.value && costRate.value == null) fetchCostRate();
});

/** The library place this activity points at, if any. */
const linkedPlace = computed(() =>
  form.value.placeId ? props.places.find((p) => p.id === form.value.placeId) || null : null,
);

/** The pin this stop will get: the linked place's, else its own. */
const stopPreviewMarkers = computed(() => {
  const p = linkedPlace.value;
  const lat = p?.latitude ?? form.value.latitude;
  const lon = p?.longitude ?? form.value.longitude;
  return lat != null && lon != null
    ? [{ lat: Number(lat), lon: Number(lon), label: form.value.name || p?.name || '' }]
    : [];
});
// Field errors appear only after a save attempt, as in the booking editor.
const attempted = ref(false);
/** A stop the booking sync wrote; it is shown, not edited. */
const isBookingStop = computed(() => !!editingActivity.value?.fromBooking);

const linkedPlaceName = computed(() => {
  const p = props.places.find((x) => x.id === form.value.placeId);
  return p?.name || form.value.name || 'Linked place';
});
const unlinkPlace = () => {
  form.value.placeId = null;
};
const goEditPlace = () => {
  if (!form.value.placeId) return;
  open.value = false;
  router.push({ path: '/places', query: { edit: form.value.placeId } });
};

const placeOptions = computed(() =>
  props.places.map((p) => ({ label: p.city ? `${p.name} · ${p.city}` : p.name, value: p.id })),
);
// TfSelect works with string options; map label <-> place id.
const placeLabelOptions = computed(() => placeOptions.value.map((o) => o.label));
const selectedPlaceLabel = computed(
  () => placeOptions.value.find((o) => o.value === form.value.placeId)?.label || '',
);
const onPlaceLabelPicked = (label) => {
  const id = placeOptions.value.find((o) => o.label === label)?.value ?? null;
  onPlacePicked(id);
};

const onPlacePicked = (id) => {
  form.value.placeId = id;
  const p = props.places.find((x) => x.id === id);
  if (p && !form.value.name && p.name) form.value.name = p.name;
  if (p && !form.value.address && p.address) form.value.address = p.address;
  if (p && !form.value.type && p.type) form.value.type = placeToActivityType(p.type);
};

/* A search result pins the stop; it does not touch the place library. When
   the result is a venue, the drawer offers to save it as a place too — that
   happens on Save, so an unticked box costs nothing. */
const pickedVenue = ref(null);
const saveVenueToPlaces = ref(false);
// Result types that describe a location rather than a venue: for these the
// offer makes no sense, a street is not a place to visit.
const ADDRESS_TYPES = new Set([
  'address',
  'street',
  'road',
  'city',
  'town',
  'village',
  'locality',
  'region',
  'country',
  'postcode',
]);
const onActivityGeoPicked = (geo) => {
  if (!geo) return;
  // 6 decimals ≈ 10 cm; also hides float noise like 13.743865200000002
  coordsText.value = `${Number(geo.lat).toFixed(6)}, ${Number(geo.lon).toFixed(6)}`;
  if (ADDRESS_TYPES.has(String(geo.placeType || '').toLowerCase())) {
    form.value.address = geo.displayName || geo.name || '';
    pickedVenue.value = null;
    return;
  }
  if (!form.value.name && geo.name) form.value.name = geo.name;
  if (!form.value.address) form.value.address = shortAddress(geo);
  pickedVenue.value = geo;
  saveVenueToPlaces.value = false;
};
// "Wat Arun, Arun Amarin Road, Bangkok, Thailand" → the part after the venue itself.
const shortAddress = (geo) => {
  const full = geo.displayName || '';
  const parts = full.split(',').map((x) => x.trim());
  return parts[0] === geo.name ? parts.slice(1).join(', ') : full;
};

/** Save the picked venue as a place when asked. The stop keeps its pin either
    way; returns the place id or null. */
const savePickedVenue = async () => {
  if (!pickedVenue.value || !saveVenueToPlaces.value) return null;
  try {
    const res = await api.post('/api/places/geocode', {
      text: pickedVenue.value.displayName || pickedVenue.value.name,
      country: null,
    });
    const place = res.data;
    emit('place-added', place); // the library is the screen's to keep
    return place.id;
  } catch {
    toast.warning('Place not saved', 'The stop is saved with its pin only');
    return null;
  }
};

// TfSelect works with string options; map label <-> type value.
const typeLabelOptions = typeOptions.map((o) => o.label);
const selectedTypeLabel = computed(
  () => typeOptions.find((o) => o.value === form.value.type)?.label || '',
);
const onTypeLabelPicked = (label) => {
  form.value.type = typeOptions.find((o) => o.label === label)?.value ?? null;
};

const moveTargetDayId = ref(null);
const moveDayOptions = computed(() =>
  props.days.map((d) => ({
    label: `Day ${d.dayNumber} · ${formatDayDate(d.date)}`,
    value: d.id,
  })),
);
const moveDayLabels = computed(() => moveDayOptions.value.map((o) => o.label));
const moveDayLabel = computed({
  get: () => moveDayOptions.value.find((o) => o.value === moveTargetDayId.value)?.label || '',
  set: (label) => {
    moveTargetDayId.value = moveDayOptions.value.find((o) => o.label === label)?.value ?? null;
  },
});

const RATING_HINTS = {
  5: 'worth the whole trip',
  4: 'big detour OK',
  3: 'small detour',
  2: 'only if on the way',
  1: 'maybe skip',
};

const reset = (values) => {
  form.value = { ...emptyForm, costCurrency: accountCurrency.value, ...values };
  attempted.value = false;
  coordsText.value = '';
  pickedVenue.value = null;
};

/** A blank stop for this day. */
const openNew = () => {
  editingActivity.value = null;
  reset({});
  moveTargetDayId.value = null;
  open.value = true;
};

/** A stop pre-filled from a saved place. */
const openFromPlace = (p) => {
  editingActivity.value = null;
  reset({
    placeId: p.id,
    name: p.name,
    address: p.address || '',
    type: placeToActivityType(p.type),
  });
  moveTargetDayId.value = null;
  open.value = true;
};

/** An existing stop, as it stands. */
const openEdit = (a) => {
  editingActivity.value = a;
  reset({
    name: a.name,
    type: a.type,
    startTime: a.startTime?.slice(0, 5) || '',
    endTime: a.endTime?.slice(0, 5) || '',
    address: a.address || '',
    costEstimate: a.costEstimate,
    notes: a.notes || '',
    placeId: a.placeId || null,
    costCurrency: a.costCurrency || accountCurrency.value,
    needsBooking: !!a.needsBooking,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
  });
  coordsText.value =
    a.latitude != null && a.longitude != null ? `${a.latitude}, ${a.longitude}` : '';
  moveTargetDayId.value = props.dayId; // preselect the current day in the move select
  open.value = true;
};
defineExpose({ openNew, openEdit, openFromPlace });

const saveActivity = async () => {
  attempted.value = true;
  if (!String(form.value.name || '').trim()) return;
  saving.value = true;
  try {
    if (!form.value.placeId) {
      const placeId = await savePickedVenue();
      if (placeId) form.value.placeId = placeId;
    }
    const payload = {
      ...form.value,
      startTime: form.value.startTime || null,
      endTime: form.value.endTime || null,
      costEstimate: form.value.costEstimate || null,
      costCurrency: form.value.costCurrency || accountCurrency.value,
      placeId: form.value.placeId || null,
      clearPlace: !form.value.placeId,
      latitude: form.value.placeId ? null : form.value.latitude,
      longitude: form.value.placeId ? null : form.value.longitude,
      clearCoords: !!form.value.placeId || form.value.latitude == null,
      // On edit: a different day here moves the activity (appended at its end).
      dayId: editingActivity.value ? moveTargetDayId.value || undefined : undefined,
    };

    if (editingActivity.value) {
      const res = await api.patch(`/api/activities/${editingActivity.value.id}`, payload);
      const moved = !!moveTargetDayId.value && moveTargetDayId.value !== props.dayId;
      if (moved) toast.success('Moved', `Activity moved to ${moveDayLabel.value}`);
      else toast.success('Updated', 'Activity updated');
      emit('saved', { activity: res.data, created: false, moved });
    } else {
      const res = await api.post(`/api/days/${props.dayId}/activities`, payload);
      toast.success('Added', `"${res.data.name}" added`);
      emit('saved', { activity: res.data, created: true, moved: false });
    }
    open.value = false;
  } catch {
    toast.danger('Error', 'Failed to save activity');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (a) => {
  confirm({
    title: 'Confirm',
    message: `Delete "${a.name}"?`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }).then(async (ok) => {
    if (!ok) return;
    try {
      await api.delete(`/api/activities/${a.id}`);
      open.value = false;
      toast.success('Deleted', 'Activity deleted');
      emit('deleted', a);
    } catch {
      toast.danger('Error', 'Failed to delete');
    }
  });
};
</script>

<style scoped>
/* The linked place's own words, read-only inside the activity drawer. */
.linked-facts {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--surface);
}
.linked-facts-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font: var(--type-code);
  text-transform: uppercase;
  letter-spacing: var(--ls-caps);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}
.linked-facts-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 3px 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.linked-facts-val {
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  text-align: right;
}
.linked-facts-desc {
  margin: var(--space-2) 0 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.stop-address {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.stop-address .pi {
  color: var(--accent);
  font-size: 12px;
}
.rate-box {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
}
.rate-label {
  font: var(--fw-medium) 12px/1 var(--font-mono);
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.rate-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font: var(--fw-bold) 20px/1 var(--font-display);
  color: var(--text-primary);
}
.rate-unit {
  font: var(--fw-medium) 13px/1 var(--font-sans);
  color: var(--text-secondary);
}
.booking-stop {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.booking-stop-name {
  font: var(--fw-semibold) 15px/1.3 var(--font-sans);
  color: var(--text-primary);
}
.booking-stop-line {
  font: var(--type-small);
  color: var(--text-secondary);
}
.linked-place {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card);
  border: 1.5px solid var(--success-100);
  border-radius: var(--radius-md);
}
.linked-place .linked-name {
  flex: 1;
  min-width: 0;
  font: var(--fw-semibold) 15px/1.2 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-edit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-link);
  font: var(--fw-semibold) 13px/1 var(--font-sans);
  white-space: nowrap;
}
.link-edit:hover {
  text-decoration: underline;
}
.save-place-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  font: var(--fw-medium) 14px/1.3 var(--font-sans);
  color: var(--text-primary);
}
.save-place-toggle input {
  accent-color: var(--accent);
  width: 18px;
  height: 18px;
}
.save-place-toggle span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
