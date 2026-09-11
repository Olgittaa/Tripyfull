<template>
  <!-- Phones only (CSS): previous · day · next, then the map and "add", within a thumb's reach. -->
  <nav class="day-dock" aria-label="Day controls">
    <button
      type="button"
      class="dock-btn"
      aria-label="Previous day"
      :disabled="dayIndex <= 0"
      @click="$emit('prev')"
    >
      <i class="pi pi-chevron-left"></i>
    </button>
    <div class="dock-day">
      <span class="dock-day-num">{{ title }}</span>
      <span class="dock-day-date">{{ day?.date ? formatDayDate(day.date) : 'no date' }}</span>
    </div>
    <button
      type="button"
      class="dock-btn"
      aria-label="Next day"
      :disabled="dayIndex >= dayCount - 1"
      @click="$emit('next')"
    >
      <i class="pi pi-chevron-right"></i>
    </button>
    <span class="dock-sep"></span>
    <button
      type="button"
      class="dock-btn"
      :class="{ 'is-on': mapOpen }"
      aria-label="Day route on the map"
      @click="$emit('update:mapOpen', !mapOpen)"
    >
      <i class="pi pi-map"></i>
      <span v-if="pins" class="dock-badge">{{ pins }}</span>
    </button>
    <button
      type="button"
      class="dock-btn dock-btn--primary"
      aria-label="Add a stop"
      @click="$emit('add')"
    >
      <i class="pi pi-plus"></i>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { formatDayDate } from '@tripyfull/core';

const props = defineProps({
  day: { type: Object, default: null },
  dayIndex: { type: Number, required: true },
  dayCount: { type: Number, required: true },
  /** Which reserve day this is, when the day has no date. */
  reserveIndex: { type: Number, default: 0 },
  /** Pins on the day's map, shown on the map button. */
  pins: { type: Number, default: 0 },
  mapOpen: { type: Boolean, default: false },
});
defineEmits(['prev', 'next', 'add', 'update:mapOpen']);

const title = computed(() =>
  props.day && !props.day.date
    ? `Reserve ${props.reserveIndex}`
    : `Day ${props.day?.dayNumber ?? ''}`,
);
</script>

<style scoped>
/* The dock and the sheet's close button exist for phones; see the block below. */
.day-dock {
  display: none;
}
/* ---- Phones: last in the file, so these win over the rules above ---- */
@media (max-width: 700px) {
  /* The dock: previous · day · next, then the map and "add". */
  .day-dock {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 75;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    background: var(--card);
    border-top: 1px solid var(--border-default);
  }
  .dock-btn {
    position: relative;
    flex: none;
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-default);
    border-radius: 50%;
    background: var(--card);
    color: var(--text-primary);
    font-size: 16px;
    cursor: pointer;
  }
  .dock-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .dock-btn.is-on {
    background: var(--surface);
    border-color: var(--border-strong);
  }
  .dock-btn--primary {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
  .dock-day {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .dock-day-num {
    font: var(--fw-semibold) 14px/1.15 var(--font-sans);
    color: var(--text-primary);
  }
  .dock-day-date {
    font: var(--fw-medium) 11px/1.3 var(--font-mono);
    color: var(--text-secondary);
  }
  .dock-sep {
    width: 1px;
    height: 26px;
    background: var(--border-default);
    margin: 0 2px;
  }
  .dock-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: #fff;
    font: var(--fw-semibold) 10px/18px var(--font-mono);
  }
}
</style>
