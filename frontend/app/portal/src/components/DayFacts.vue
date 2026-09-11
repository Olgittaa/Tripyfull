<template>
  <!-- A slim strip of facts about the day: how full it is, and where the night is
       spent when the plan does not already say so. -->
  <div class="card day-facts">
    <!-- How full the day is: places you go to, and time spent getting there -->
    <div v-if="load" class="fact">
      <i class="pi pi-clock fact-icon" title="Day"></i>
      <div class="day-load">
        <span
          ><b>{{ load.stops }}</b> stop{{ load.stops === 1 ? '' : 's' }}</span
        >
        <span
          ><span class="day-load-dot day-load-dot--visit"></span>{{ fmtMin(load.visitMin) }} at
          places<span v-if="load.untimed" class="text-subtle">
            · {{ load.untimed }} without a time</span
          ></span
        >
        <span
          ><span class="day-load-dot day-load-dot--travel"></span>{{ fmtMin(load.travelMin) }} on
          the move</span
        >
      </div>
    </div>

    <!-- Overnight stay — only when the plan does not show it already: a
         hotel's own row or an overnight flight says where the night is. -->
    <div v-if="!nightInPlan" class="fact">
      <i class="pi pi-moon fact-icon" title="Overnight"></i>

      <!-- Not editing -->
      <div v-if="!editingOvernight">
        <!-- Has overnight set -->
        <template v-if="day?.overnightStay">
          <div style="display: flex; align-items: center; gap: 8px">
            <span
              style="
                font: var(--fw-medium) 14px/18px var(--font-display);
                color: var(--text-primary);
              "
            >
              {{ day.overnightStay }}
            </span>
            <i
              class="pi pi-pencil"
              style="font-size: 11px; color: var(--text-secondary); cursor: pointer"
              @click="
                editingOvernight = true;
                overnightDraft = day.overnightStay;
              "
            ></i>
          </div>
          <!-- Linked booking badge -->
          <div
            v-if="linkedBooking"
            style="margin-top: 6px; display: flex; align-items: center; gap: 6px"
          >
            <TfBadge tone="accent" variant="soft">
              <i class="pi pi-link" style="font-size: 10px"></i>
              {{ linkedBooking.name
              }}{{ linkedBooking.accommodationCity ? ' · ' + linkedBooking.accommodationCity : '' }}
            </TfBadge>
            <TfTooltip text="Unlink booking">
              <button
                style="
                  background: none;
                  border: none;
                  color: var(--text-secondary);
                  font-size: 11px;
                  cursor: pointer;
                  padding: 2px;
                "
                @click="unlinkBooking"
              >
                <i class="pi pi-times"></i>
              </button>
            </TfTooltip>
          </div>
        </template>

        <!-- No overnight — show suggestion or placeholder -->
        <template v-else>
          <!-- Booking suggestion available -->
          <div v-if="overnightSuggestion">
            <button
              style="
                border: 1.5px dashed var(--border-default);
                background: transparent;
                border-radius: var(--radius-md);
                padding: 10px 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--text-secondary);
                font: var(--type-small);
                width: 100%;
                transition: all var(--dur-fast) var(--ease-out);
                text-align: left;
              "
              @click="applyOvernightSuggestion"
            >
              <i class="pi pi-sparkles" style="color: var(--warning-300); font-size: 16px"></i>
              <div>
                <div
                  style="
                    font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                    color: var(--text-primary);
                  "
                >
                  {{ overnightSuggestion.name }}
                </div>
                <div
                  style="
                    font: var(--fw-regular) 12px/1.2 var(--font-sans);
                    color: var(--text-secondary);
                    margin-top: 2px;
                  "
                >
                  {{ overnightSuggestion.accommodationCity }} · from booking
                </div>
              </div>
            </button>
            <div
              style="
                margin-top: 6px;
                font: var(--type-small);
                color: var(--text-secondary);
                cursor: pointer;
              "
              @click="
                editingOvernight = true;
                overnightDraft = '';
              "
            >
              or enter manually...
            </div>
          </div>
          <!-- No suggestion -->
          <div
            v-else
            style="display: flex; align-items: center; gap: 8px; cursor: pointer"
            @click="
              editingOvernight = true;
              overnightDraft = '';
            "
          >
            <span
              style="
                font: var(--fw-regular) 14px/1.2 var(--font-sans);
                color: var(--text-secondary);
              "
              >Not set — click to add</span
            >
          </div>
        </template>
      </div>

      <!-- Editing manually -->
      <div v-else style="display: flex; gap: 6px; align-items: center">
        <TfInput
          v-model="overnightDraft"
          placeholder="e.g. Friend's apartment, Airbnb..."
          style="flex: 1"
          @keyup.enter="saveOvernightManual"
          @keyup.escape="editingOvernight = false"
        />
        <TfIconButton variant="ghost" size="sm" @click="saveOvernightManual"
          ><i class="pi pi-check"></i
        ></TfIconButton>
        <TfIconButton variant="ghost" size="sm" @click="editingOvernight = false"
          ><i class="pi pi-times"></i
        ></TfIconButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { api, formatMinutes as fmtMin } from '@tripyfull/core';
import { TfBadge, TfIconButton, TfInput, TfTooltip, toast } from '@tripyfull/ui';

const props = defineProps({
  day: { type: Object, default: null },
  dayId: { type: String, required: true },
  /** { stops, visitMin, travelMin, untimed } — null while the day has no stops. */
  load: { type: Object, default: null },
  /** The plan already shows where the night is: the overnight fact stays out. */
  nightInPlan: { type: Boolean, default: false },
  /** The trip's bookings, for the hotel that covers this night. */
  bookings: { type: Array, default: () => [] },
});
const emit = defineEmits(['updated']);

const editingOvernight = ref(false);
const overnightDraft = ref('');
watch(
  () => props.dayId,
  () => (editingOvernight.value = false),
);

// Find accommodation booking that covers this day's date (for suggestion)
const overnightSuggestion = computed(() => {
  if (!props.day?.date || props.day?.linkedBookingId) return null;
  const dayDate = props.day.date;
  return (
    props.bookings.find(
      (b) =>
        b.category === 'ACCOMMODATION' &&
        b.checkIn &&
        b.checkOut &&
        dayDate >= b.checkIn &&
        dayDate < b.checkOut,
    ) || null
  );
});

// Find the linked booking (when day has linkedBookingId)
const linkedBooking = computed(() => {
  if (!props.day?.linkedBookingId) return null;
  return props.bookings.find((b) => b.id === props.day.linkedBookingId) || null;
});

// Manual overnight entry — no booking link
const saveOvernightManual = async () => {
  try {
    const res = await api.patch(`/api/days/${props.dayId}`, {
      overnightStay: overnightDraft.value,
      clearLinkedBooking: true,
    });
    emit('updated', res.data);
    editingOvernight.value = false;
  } catch {
    toast.danger('Error', 'Failed to update overnight');
  }
};

// Apply from booking — saves overnight + city + booking link
const applyOvernightSuggestion = async () => {
  if (!overnightSuggestion.value) return;
  const booking = overnightSuggestion.value;
  try {
    const res = await api.patch(`/api/days/${props.dayId}`, {
      overnightStay: booking.name,
      city: booking.accommodationCity,
      linkedBookingId: booking.id,
    });
    emit('updated', res.data);
  } catch {
    toast.danger('Error', 'Failed to link booking');
  }
};

// Unlink booking but keep the text
const unlinkBooking = async () => {
  try {
    const res = await api.patch(`/api/days/${props.dayId}`, { clearLinkedBooking: true });
    emit('updated', res.data);
  } catch {
    toast.danger('Error', 'Failed to unlink');
  }
};
</script>

<style scoped>
/* City, day load and overnight stay: a slim strip, side by side while they
   fit. Each fact is its icon and its value on one line; the icon stands for
   the title ("Visiting", "Day", "Overnight" are its tooltip). */
.day-facts {
  margin-bottom: 16px;
  padding: 10px 14px;
  display: flex;
  gap: 6px 24px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.fact {
  /* Natural widths: the city is short, the load is long, and the overnight
  stay with its booking badge takes the next line rather than squeezing. */
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
/* Icon and value share one 18px line, so the icon sits level with the first
   line of text whatever the fact is. */
.fact-icon {
  flex: none;
  color: var(--accent);
  font-size: 15px;
  line-height: 18px;
}
.fact > :not(.fact-icon) {
  flex: 1;
  min-width: 0;
}
.day-load {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  font: var(--fw-medium) 13px/18px var(--font-sans);
  color: var(--text-secondary);
}
.day-load b {
  color: var(--text-primary);
}
.day-load-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: 1px;
}
.day-load-dot--visit {
  background: var(--primary);
}
.day-load-dot--travel {
  background: var(--warning-500);
}
@media (max-width: 700px) {
  /* One fact per line on a phone. */
  .day-facts {
    margin: 0 0 12px;
    padding: 10px 12px;
  }
  .fact {
    flex-basis: 100%;
  }
}
</style>
