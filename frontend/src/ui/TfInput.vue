<template>
  <div class="tf-field">
    <label v-if="label">{{ label }}</label>
    <input
      class="tf-input"
      :class="{ 'tf-input--error': error }"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="tf-helper tf-helper--error">{{ error }}</span>
    <span v-else-if="helper" class="tf-helper">{{ helper }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  modelValue: [String, Number],
  helper: String,
  error: String,
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

.tf-input {
  font: var(--fw-regular) var(--text-sm)/1.4 var(--font-sans);
  padding: 10px 14px;
  border: 1.5px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--field-bg);
  color: var(--text-body);
  outline: none;
  transition:
    border-color var(--dur-base),
    box-shadow var(--dur-base);
}
.tf-input::placeholder {
  color: var(--field-placeholder);
}
.tf-input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--ring-brand);
}
.tf-input--error {
  border-color: var(--danger-500);
}
.tf-input--error:focus {
  box-shadow: 0 0 0 3px rgba(210, 63, 44, 0.2);
}

.tf-helper {
  font: var(--fw-regular) var(--text-xs)/1.3 var(--font-sans);
  color: var(--text-subtle);
}
.tf-helper--error {
  color: var(--danger-500);
}
</style>
