<template>
  <span class="tf-badge" :class="classes">
    <span v-if="dot" class="tf-badge-dot"></span>
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

const classes = computed(() => [
  `tf-badge--${props.tone}`,
  props.variant === 'solid' && 'tf-badge--solid',
].filter(Boolean));
</script>

<style scoped>
.tf-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: var(--radius-pill);
  font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans);
}
.tf-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.tf-badge--brand { background: var(--brand-soft); color: var(--brand); }
.tf-badge--accent { background: var(--accent-soft); color: var(--accent); }
.tf-badge--gold { background: var(--gold-50); color: var(--gold-500); }
.tf-badge--success { background: var(--success-100); color: var(--success-500); }
.tf-badge--warning { background: var(--warning-100); color: var(--warning-500); }
.tf-badge--danger { background: var(--danger-100); color: var(--danger-500); }
.tf-badge--neutral { background: var(--ink-200); color: var(--ink-700); }

.tf-badge--solid.tf-badge--brand { background: var(--brand); color: var(--brand-on); }
.tf-badge--solid.tf-badge--accent { background: var(--accent); color: var(--accent-on); }
.tf-badge--solid.tf-badge--gold { background: var(--gold-300); color: var(--ink-900); }
.tf-badge--solid.tf-badge--success { background: var(--success-500); color: #fff; }
.tf-badge--solid.tf-badge--danger { background: var(--danger-500); color: #fff; }
</style>
