<template>
  <div class="tf-segmented" :class="{ 'tf-segmented--sm': size === 'sm' }">
    <button
      v-for="opt in options"
      :key="opt"
      class="tf-seg-btn"
      :class="{ 'tf-seg-btn--active': modelValue === opt }"
      @click="$emit('update:modelValue', opt)"
    >
      {{ opt }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: { type: Array, required: true },
  modelValue: String,
  size: { type: String, default: 'md' },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.tf-segmented {
  display: inline-flex;
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: 4px;
  gap: 2px;
}
.tf-seg-btn {
  padding: 8px 18px;
  border: none;
  background: none;
  border-radius: var(--radius-pill);
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.tf-seg-btn:hover {
  color: var(--text-primary);
}
.tf-seg-btn--active {
  background: var(--white);
  color: var(--text-primary);
  font-weight: var(--fw-semibold);
  box-shadow: var(--shadow-sm);
}
.tf-segmented--sm .tf-seg-btn {
  padding: 6px 14px;
  font-size: var(--text-xs);
}
</style>
