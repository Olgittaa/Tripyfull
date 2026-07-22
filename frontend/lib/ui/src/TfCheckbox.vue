<template>
  <label class="checkbox">
    <input
      class="checkbox-input"
      type="checkbox"
      :checked="modelValue"
      :indeterminate="indeterminate"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  indeterminate: Boolean,
  disabled: Boolean,
});
defineEmits(['update:modelValue']);
</script>
