<template>
  <label class="switch">
    <input
      class="switch-input"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="switch-track"></span>
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  disabled: Boolean,
});
defineEmits(['update:modelValue']);
</script>
