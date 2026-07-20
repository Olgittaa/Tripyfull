<template>
  <div class="tf-field">
    <label v-if="label">{{ label }}</label>
    <select
      class="tf-select"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  placeholder: String,
  options: { type: Array, default: () => [] },
  modelValue: String,
  disabled: Boolean,
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.tf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tf-field label {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  color: var(--text-muted);
}

.tf-select {
  font: var(--fw-regular) var(--text-sm)/1.4 var(--font-sans);
  padding: 10px 14px;
  padding-right: 36px;
  border: 1.5px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--field-bg);
  color: var(--text-body);
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238c8077' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}
.tf-select:focus {
  border-color: var(--border-focus);
  box-shadow: var(--ring-brand);
}
</style>
