<template>
  <!-- The trip's days in a row: buffer days stand in line with the rest, marked but
       not set apart, and can be flipped from here as the plan changes. -->
  <div ref="strip" class="day-picker">
    <button
      v-for="d in datedDays"
      :key="d.id"
      class="day-picker-btn"
      :class="d.id === currentId ? 'day-picker-btn--on' : 'day-picker-btn--off'"
      @click="$emit('select', d.id)"
    >
      <div class="day-picker-label">D{{ d.dayNumber }}</div>
      <div class="day-picker-date">{{ formatDayDate(d.date) }}</div>
      <div class="day-picker-note">{{ d.city || '' }}</div>
    </button>

    <!-- Reserve days: part of the trip, outside its dates. Nothing is planned
         on them until you swap one into a real day. -->
    <span v-if="reserveDays.length" class="day-picker-sep"></span>
    <button
      v-for="(d, i) in reserveDays"
      :key="d.id"
      class="day-picker-btn day-picker-btn--reserve"
      :class="d.id === currentId ? 'day-picker-btn--on' : 'day-picker-btn--off'"
      @click="$emit('select', d.id)"
    >
      <span
        class="day-picker-flag is-on"
        v-tooltip="'Remove this reserve day'"
        @click.stop="$emit('remove', d)"
      >
        <i class="pi pi-times"></i>
      </span>
      <div class="day-picker-label">R{{ i + 1 }}</div>
      <div class="day-picker-date">reserve</div>
      <div class="day-picker-note">{{ d.city || 'no date' }}</div>
    </button>
    <button
      class="day-picker-add"
      v-tooltip="'Add a buffer day outside the trip dates'"
      :disabled="adding"
      @click="$emit('add')"
    >
      <i class="pi pi-plus"></i>
      <span>Buffer</span>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { formatDayDate } from '@tripyfull/core';

const props = defineProps({
  /** All of the trip's days, dated and reserve. */
  days: { type: Array, required: true },
  currentId: { type: String, default: null },
  /** A buffer day is being added: the "+ Buffer" chip waits. */
  adding: { type: Boolean, default: false },
});
defineEmits(['select', 'remove', 'add']);

const datedDays = computed(() => props.days.filter((d) => d.date));
const reserveDays = computed(() => props.days.filter((d) => !d.date));

/* The strip scrolls sideways; whichever way the day changes (strip, arrows,
   dock), the current chip is brought to the middle — horizontally only, so the
   page itself never jumps. */
const strip = ref(null);
let settled = false; // the first positioning is a jump, later ones glide
watch(
  [() => props.currentId, () => props.days],
  async () => {
    await nextTick();
    const el = strip.value;
    const on = el?.querySelector('.day-picker-btn--on');
    if (!el || !on) return;
    el.scrollTo({
      left: on.offsetLeft - el.clientWidth / 2 + on.offsetWidth / 2,
      behavior: settled ? 'smooth' : 'auto',
    });
    settled = true;
  },
  { immediate: true },
);
</script>

<style scoped>
/* Reserve days live after a divider: same strip, outside the dates. */
.day-picker-sep {
  width: 1px;
  align-self: stretch;
  margin: 4px 6px;
  background: var(--border-default);
  flex: none;
}
.day-picker-btn--reserve .day-picker-date {
  font-style: italic;
}
.day-picker-add {
  flex: none;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 58px;
  padding: 8px 10px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: none;
  color: var(--text-secondary);
  font: var(--fw-medium) 11px/1.2 var(--font-sans);
  cursor: pointer;
}
.day-picker-add:hover {
  background: var(--surface);
  color: var(--text-primary);
}
.day-picker-add:disabled {
  opacity: 0.5;
  cursor: default;
}
/* Buffer days: same row, same size, just visibly held in reserve. */
.day-picker-btn {
  position: relative;
}
.day-picker-note {
  font: var(--fw-regular) 10px/1.2 var(--font-sans);
  color: var(--text-disabled);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 68px;
}
.day-picker-flag {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 10px;
  line-height: 1;
  color: var(--text-disabled);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.day-picker-flag.is-on {
  opacity: 1;
}
.day-picker-flag.is-on {
  color: var(--warning-700);
}
@media (max-width: 700px) {
  /* The dock switches days on a phone; the strip would be the same days a
     second time, 64px above the list. */
  .day-picker {
    display: none;
  }
}
</style>
