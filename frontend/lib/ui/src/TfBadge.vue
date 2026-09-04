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
  // 'sm' for dense rows (card meta, table cells) where 14px text is too loud.
  size: { type: String, default: '' },
});

const classes = computed(() =>
  [
    `badge--${props.tone}`,
    props.variant === 'solid' && 'badge--solid',
    props.size === 'sm' && 'badge--sm',
  ].filter(Boolean),
);
</script>
