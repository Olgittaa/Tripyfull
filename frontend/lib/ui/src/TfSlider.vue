<template>
  <div class="field">
    <label v-if="label" class="label">{{ label }}</label>
    <input
      class="slider"
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="$emit('update:modelValue', Number($event.target.value))"
    />
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: Boolean,
  hint: String,
});
defineEmits(['update:modelValue']);
</script>
