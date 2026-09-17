<template>
  <div class="field">
    <label v-if="label" class="label" :for="inputId">{{ label }}</label>
    <textarea
      :id="inputId"
      class="textarea"
      :class="[stateClass, { 'textarea--error': error }]"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :rows="rows"
      v-bind="$attrs"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { computed, useAttrs, useId } from 'vue';

defineOptions({ inheritAttrs: false });

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

// A label has to point at its control — for a screen reader, for a click on the
// label, and for a test that asks for a field by the name a person reads. An id
// passed in from outside wins; otherwise Vue hands out a stable one.
const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => attrs.id || generatedId);
</script>
