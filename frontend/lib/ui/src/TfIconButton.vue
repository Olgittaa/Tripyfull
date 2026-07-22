<template>
  <button class="tf-icon-btn" :class="classes" :title="label" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'solid' },
  size: { type: String, default: 'md' },
  label: { type: String, default: '' },
});

defineEmits(['click']);

const classes = computed(() =>
  [`tf-icon-btn--${props.variant}`, props.size !== 'md' && `tf-icon-btn--${props.size}`].filter(
    Boolean,
  ),
);
</script>

<style scoped>
.tf-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-base) var(--ease-out);
  font-size: 18px;
}
.tf-icon-btn:active {
  transform: scale(0.92);
}

.tf-icon-btn--solid {
  background: var(--accent);
  color: var(--ink-0);
  box-shadow: var(--shadow-brand);
}
.tf-icon-btn--solid:hover {
  filter: brightness(1.08);
}
.tf-icon-btn--soft {
  background: var(--danger-100);
  color: var(--accent);
}
.tf-icon-btn--soft:hover {
  background: var(--danger-100);
}
.tf-icon-btn--outline {
  background: transparent;
  color: var(--text-primary);
  border: 1.5px solid var(--border-default);
}
.tf-icon-btn--outline:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--danger-100);
}
.tf-icon-btn--ghost {
  background: transparent;
  color: var(--text-primary);
}
.tf-icon-btn--ghost:hover {
  background: var(--surface);
  color: var(--text-primary);
}

.tf-icon-btn--sm {
  width: 32px;
  height: 32px;
  font-size: 14px;
}
.tf-icon-btn--lg {
  width: 48px;
  height: 48px;
  font-size: 22px;
}
</style>
