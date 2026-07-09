<template>
  <label class="tf-switch" :class="{ 'tf-switch--disabled': disabled }">
    <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.checked)">
    <span class="tf-switch-track"></span>
    <span><slot /></span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  disabled: { type: Boolean, default: false },
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.tf-switch {
  display: flex; align-items: center; gap: 12px;
  font: var(--fw-regular) var(--text-sm)/1 var(--font-sans);
  color: var(--text-body); cursor: pointer; padding: 6px 0;
}
.tf-switch input { display: none; }
.tf-switch-track {
  width: 40px; height: 22px;
  background: var(--ink-300); border-radius: var(--radius-pill);
  position: relative; transition: background var(--dur-base); flex-shrink: 0;
}
.tf-switch-track::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; background: white; border-radius: 50%;
  transition: transform var(--dur-base) var(--ease-out); box-shadow: var(--shadow-xs);
}
.tf-switch input:checked + .tf-switch-track { background: var(--brand); }
.tf-switch input:checked + .tf-switch-track::after { transform: translateX(18px); }
.tf-switch--disabled { opacity: 0.5; cursor: not-allowed; }
</style>
