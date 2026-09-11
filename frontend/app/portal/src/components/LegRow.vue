<template>
  <!-- The way from a stop to the next: the whole set of ways to get there, and the
       time and distance for the chosen one — with an honest note when it is an estimate. -->
  <div class="timeline-leg">
    <!-- Not everyone rents a car: the whole set of ways to get to the
         next stop, with an honest note when the time is an estimate. -->
    <div class="leg-modes">
      <button
        v-for="m in TRAVEL_MODES"
        :key="m.key"
        class="leg-mode"
        :class="{ 'is-on': info.mode === m.key }"
        v-tooltip="m.hint"
        @click="$emit('change', m.key)"
      >
        {{ m.icon }}
      </button>
    </div>
    <span v-if="info.data">
      <template v-if="info.data.estimated">~</template>{{ fmtDur(info.data.durationSec) }} ·
      {{ fmtDist(info.data.distanceM) }}
      {{ modeLabel(info.mode) }}<template v-if="info.data.note"> · {{ info.data.note }}</template>
      <span v-if="info.data.estimated" class="leg-estimate">estimate</span>
    </span>
    <span v-else-if="info.data === null">no route found</span>
    <span v-else>…</span>
  </div>
</template>

<script setup>
import { formatDistance as fmtDist, formatDuration as fmtDur } from '@tripyfull/core';
import { modeLabel, TRAVEL_MODES } from '@/plan/stops.js';

defineProps({
  /** { mode, data } — data: undefined while unknown, null when there is no route. */
  info: { type: Object, required: true },
});
defineEmits(['change']);
</script>

<style scoped>
/* Travel modes on a leg: small, always all of them, current one filled. */
.leg-modes {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  flex: none;
}
.leg-mode {
  width: 24px;
  height: 22px;
  /* see the phone override at the end of this block */
  border: none;
  background: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  opacity: 0.45;
  filter: grayscale(1);
}
.leg-mode:hover {
  opacity: 0.8;
  filter: none;
}
.leg-mode.is-on {
  background: var(--card);
  box-shadow: var(--shadow-sm);
  opacity: 1;
  filter: none;
}
.leg-estimate {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  font: var(--fw-medium) 10px/1.4 var(--font-sans);
  color: var(--text-disabled);
}
.timeline-leg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0 4px;
  color: var(--text-secondary);
  font: var(--fw-medium) 12px/1 var(--font-sans);
}
@media (max-width: 700px) {
  /* Five mode icons in a row need a finger's worth of space each; the leg's
     time and distance go under them rather than beside. */
  .timeline-leg {
    display: flex;
    flex-wrap: wrap;
    line-height: 1.35;
  }
  .leg-mode {
    width: 34px;
    height: 32px;
    font-size: 15px;
  }
}
</style>
