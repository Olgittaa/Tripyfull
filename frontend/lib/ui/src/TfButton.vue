<template>
  <button
    class="btn"
    :class="classes"
    :type="type"
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
  // Native buttons default to type="submit" inside a <form>; an action button
  // in a drawer/dialog form must not submit it, so default to "button".
  type: { type: String, default: 'button' },
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
