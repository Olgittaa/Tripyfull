<template>
  <div class="progress" :class="`progress--${state}`">
    <div class="progress-head">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-value">{{ Math.round(value) }}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: fillWidth }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  value: { type: Number, default: 0 },
});

const state = computed(() =>
  props.value > 100 ? 'over' : props.value === 100 ? 'full' : 'incomplete',
);
const fillWidth = computed(() => Math.min(Math.max(props.value, 0), 100) + '%');
</script>
