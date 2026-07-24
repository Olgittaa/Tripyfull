<template>
  <div class="stat">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="delta != null" class="stat-delta" :class="delta >= 0 ? 'is-up' : 'is-down'">
      <i class="pi" :class="delta >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'" />{{ Math.abs(delta) }}%
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  delta: Number,
});
</script>
