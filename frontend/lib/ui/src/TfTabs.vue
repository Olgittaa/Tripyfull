<template>
  <div class="tf-tabs">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="tf-tab"
      :class="{ 'tf-tab--active': modelValue === item.id }"
      @click="$emit('update:modelValue', item.id)"
    >
      {{ item.label }}
      <span v-if="item.badge" class="tf-tab-badge">{{ item.badge }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true },
  modelValue: String,
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.tf-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-default);
}
.tf-tab {
  padding: 12px 18px;
  border: none;
  background: none;
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: color var(--dur-base);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tf-tab:hover {
  color: var(--text-primary);
}
.tf-tab--active {
  color: var(--accent);
  font-weight: var(--fw-semibold);
}
.tf-tab--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
}
.tf-tab-badge {
  font: var(--fw-semibold) var(--text-2xs)/1 var(--font-mono);
  background: var(--danger-100);
  color: var(--accent);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
}
</style>
