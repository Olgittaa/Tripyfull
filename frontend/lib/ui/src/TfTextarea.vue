<template>
  <div class="field">
    <label v-if="label" class="label">{{ label }}</label>
    <textarea
      class="textarea"
      :class="[stateClass, { 'textarea--error': error }]"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  placeholder: String,
  modelValue: [String, Number],
  helper: String,
  error: String,
  disabled: Boolean,
  rows: { type: Number, default: 3 },
  // forces a visual state for docs/demos: 'hover' | 'focus'
  state: { type: String, default: '' },
});
defineEmits(['update:modelValue']);

const stateClass = computed(() => (props.state ? `is-${props.state}` : ''));
</script>
