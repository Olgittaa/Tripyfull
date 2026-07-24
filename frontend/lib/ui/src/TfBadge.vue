<template>
  <span class="badge" :class="classes">
    <span v-if="dot" class="badge-dot"></span>
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tone: { type: String, default: 'brand' },
  variant: { type: String, default: 'soft' },
  dot: { type: Boolean, default: false },
});

const classes = computed(() =>
  [`badge--${props.tone}`, props.variant === 'solid' && 'badge--solid'].filter(Boolean),
);
</script>
