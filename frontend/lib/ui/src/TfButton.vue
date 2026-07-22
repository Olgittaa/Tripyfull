<template>
  <button
    class="btn"
    :class="classes"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn__spinner" />
    <i v-else-if="icon" class="btn__icon pi" :class="icon" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  icon: { type: String, default: '' },
});

defineEmits(['click']);

const classes = computed(() =>
  [
    `btn--${props.variant}`,
    props.size !== 'md' && `btn--${props.size}`,
    props.loading && 'is-loading',
  ].filter(Boolean),
);
</script>
