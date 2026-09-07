<template>
  <div class="field">
    <label v-if="label" class="label"
      >{{ label }}<span v-if="required" class="label-req" aria-hidden="true">*</span></label
    >
    <div
      class="input-wrap"
      :class="{ 'input-wrap--prefix': $slots.prefix, 'input-wrap--suffix': $slots.suffix }"
    >
      <span v-if="$slots.prefix" class="input-affix input-affix--prefix"
        ><slot name="prefix"
      /></span>
      <input
        class="input"
        :class="[stateClass, { 'input--error': error }]"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <span v-if="$slots.suffix" class="input-affix input-affix--suffix"
        ><slot name="suffix"
      /></span>
    </div>
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  modelValue: [String, Number],
  helper: String,
  error: String,
  // Marks the label; validation itself stays with the form.
  required: Boolean,
  disabled: Boolean,
  // forces a visual state for docs/demos: 'hover' | 'focus'
  state: { type: String, default: '' },
});
defineEmits(['update:modelValue']);

const stateClass = computed(() => (props.state ? `is-${props.state}` : ''));
</script>
