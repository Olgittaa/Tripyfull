<template>
  <label class="radio">
    <input
      class="radio-input"
      type="radio"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      :name="name"
      @change="$emit('update:modelValue', value)"
    />
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: [String, Number, Boolean],
  value: [String, Number, Boolean],
  disabled: Boolean,
  name: String,
});
defineEmits(['update:modelValue']);
</script>
