<template>
  <!-- One stop of the day: what it is, when, where, what it costs. Click to edit. -->
  <TfCard interactive style="cursor: pointer" @click="$emit('open')">
    <div class="stop-card-row">
      <div class="cat-icon cat-icon--lg" :style="catStyle(activity.type)">
        {{ stopIcon(activity) }}
      </div>
      <div style="flex: 1; min-width: 0">
        <div class="stop-title-row">
          <span class="stop-name">{{ activity.name }}</span>
          <TfBadge v-if="activity.type" tone="neutral" variant="soft">{{
            typeLabel(activity.type)
          }}</TfBadge>
          <TfBadge v-if="activity.needsBooking" tone="gold" variant="soft" dot>Book ahead</TfBadge>
          <!-- Written by the booking sync, which owns it: the next
                   run rewrites it, so edits here do not survive. -->
          <TfBadge
            v-if="activity.fromBooking"
            tone="success"
            variant="soft"
            v-tooltip="'From a booking — rewritten when you update the plan'"
            >Booked</TfBadge
          >
        </div>
        <div
          style="
            font: var(--fw-regular) 13px/1.3 var(--font-sans);
            color: var(--text-secondary);
            margin-top: 3px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          "
        >
          <span
            v-if="activity.startTime && activity.endTime"
            style="display: inline-flex; align-items: center; gap: 4px"
          >
            <i class="pi pi-clock" style="font-size: 12px"></i>
            {{ activity.startTime.slice(0, 5) }} – {{ activity.endTime.slice(0, 5) }}
          </span>
          <span v-if="activity.address" style="display: inline-flex; align-items: center; gap: 4px">
            <i class="pi pi-map-marker" style="font-size: 12px"></i>
            {{ activity.address }}
          </span>
          <span
            v-if="activity.placeName"
            style="display: inline-flex; align-items: center; gap: 4px; color: var(--accent)"
          >
            <i class="pi pi-bookmark" style="font-size: 12px"></i>
            {{ activity.placeName }}
          </span>
          <span v-if="mapNumber" class="onmap-pill">
            <span class="onmap-dot">{{ mapNumber }}</span> on map
          </span>
        </div>
        <div
          v-if="activity.notes"
          style="
            font: var(--type-small);
            color: var(--text-secondary);
            margin-top: 4px;
            font-style: italic;
          "
        >
          {{ activity.notes }}
        </div>
      </div>
      <span v-if="activity.costEstimate" class="money money--md stop-cost">
        {{ activity.costEstimate }} {{ activity.costCurrency || currency }}
        <span v-if="approxBase != null" class="money-approx"
          >≈ {{ approxBase.toFixed(2) }} {{ currency }}</span
        >
      </span>
    </div>
  </TfCard>
</template>

<script setup>
import { TfBadge, TfCard } from '@tripyfull/ui';
import { catStyle, stopIcon, typeLabel } from '@/plan/activityTypes.js';

defineProps({
  activity: { type: Object, required: true },
  /** The stop's number on the day's map, when it is pinned. */
  mapNumber: { type: Number, default: null },
  /** The trip's currency, for a cost written in it. */
  currency: { type: String, required: true },
  /** A cost in another currency, converted — null when it is already the trip's. */
  approxBase: { type: Number, default: null },
});
defineEmits(['open']);
</script>

<style scoped>
/* Icon, facts and cost on one line; on a phone the cost steps under the facts. */
.stop-card-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.stop-cost {
  flex: none;
  text-align: right;
}
/* A stop's name and its badges: the badges drop to the next line on a phone
   instead of dragging the card past the screen. */
.stop-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.stop-name {
  font: var(--fw-semibold) 16px/1.2 var(--font-sans);
  color: var(--text-primary);
}
.onmap-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--success-700);
  font: var(--fw-semibold) 12px/1 var(--font-mono);
}
.onmap-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--success-500);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}
.money-approx {
  display: block;
  font: var(--fw-medium) 11px/1.3 var(--font-mono);
  color: var(--text-secondary);
}
@media (max-width: 700px) {
  /* The cost was a right-hand column that left the name about 150px and wrapped
     "Lunch at the riverside" over five lines; it takes a line of its own,
     aligned with the text. */
  .stop-card-row {
    flex-wrap: wrap;
  }
  .stop-cost {
    flex: 1 1 100%;
    text-align: left;
    padding-left: 52px;
  }
}
</style>
