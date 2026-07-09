<template>
  <button class="tf-btn" :class="classes" :disabled="disabled" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
});

defineEmits(['click']);

const classes = computed(() => [
  `tf-btn--${props.variant}`,
  props.size !== 'md' && `tf-btn--${props.size}`,
].filter(Boolean));
</script>

<style scoped>
.tf-btn {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  padding: 10px 22px;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tf-btn:active { transform: scale(0.97); }
.tf-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.tf-btn--primary { background: var(--brand); color: var(--brand-on); box-shadow: var(--shadow-brand); }
.tf-btn--primary:hover:not(:disabled) { background: var(--brand-hover); filter: brightness(1.05); }
.tf-btn--accent { background: var(--accent); color: var(--accent-on); }
.tf-btn--accent:hover:not(:disabled) { background: var(--accent-hover); }
.tf-btn--secondary { background: var(--surface-card); color: var(--text-strong); border: 1px solid var(--border-default); box-shadow: var(--shadow-xs); }
.tf-btn--secondary:hover:not(:disabled) { background: var(--surface-sunken); border-color: var(--border-strong); }
.tf-btn--soft { background: var(--brand-soft); color: var(--brand); }
.tf-btn--soft:hover:not(:disabled) { background: var(--coral-100); }
.tf-btn--ghost { background: transparent; color: var(--text-body); }
.tf-btn--ghost:hover:not(:disabled) { background: var(--surface-sunken); color: var(--text-strong); }

.tf-btn--sm { padding: 7px 16px; font-size: var(--text-xs); }
.tf-btn--lg { padding: 14px 28px; font-size: var(--text-base); }
</style>
