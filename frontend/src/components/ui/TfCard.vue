<template>
  <div class="tf-card" :class="{ 'tf-card--interactive': interactive }">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  interactive: { type: Boolean, default: false },
});
</script>

<style scoped>
.tf-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 22px;
}
.tf-card--interactive {
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.tf-card--interactive:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
</style>
