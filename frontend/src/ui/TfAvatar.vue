<template>
  <div class="tf-avatar" :class="`tf-avatar--${size}`" :style="{ background: bg, color: fg }">
    {{ initials }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'md' },
  bg: { type: String, default: 'var(--coral-200)' },
  fg: { type: String, default: 'var(--coral-700)' },
});

const initials = computed(() =>
  props.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
);
</script>

<style scoped>
.tf-avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans);
  flex-shrink: 0;
}
.tf-avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 10px;
}
.tf-avatar--md {
  width: 36px;
  height: 36px;
}
.tf-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: var(--text-sm);
}
.tf-avatar--xl {
  width: 56px;
  height: 56px;
  font-size: var(--text-base);
}
</style>
