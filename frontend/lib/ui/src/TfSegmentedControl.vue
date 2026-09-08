<template>
  <div
    class="tf-segmented"
    :class="{ 'tf-segmented--sm': size === 'sm', 'tf-segmented--fill': fill }"
  >
    <button
      v-for="opt in options"
      :key="opt"
      type="button"
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
  // Fill the row and split it evenly — for a form's main choice.
  fill: Boolean,
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
  /* Five statuses don't fit a phone: the strip scrolls sideways instead of
     pushing the page wider. Nothing changes while it fits. */
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.tf-segmented::-webkit-scrollbar {
  display: none;
}
.tf-seg-btn {
  flex: none;
  white-space: nowrap;
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
.tf-segmented--fill {
  display: flex;
  width: 100%;
}
.tf-segmented--fill .tf-seg-btn {
  flex: 1;
  padding-left: 0;
  padding-right: 0;
}
.tf-segmented--sm .tf-seg-btn {
  padding: 6px 14px;
  font-size: var(--text-xs);
}
</style>
