<template>
  <div class="field" ref="root">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="select" :class="{ 'is-open': open }">
      <button
        type="button"
        class="select-trigger"
        :class="{ 'is-error': error }"
        :disabled="disabled"
        @click="open = !open"
      >
        <span v-if="$slots.prefix" class="select-prefix"><slot name="prefix" /></span>
        <span class="select-value" :class="{ 'is-placeholder': !modelValue }">
          {{ modelValue || placeholder }}
        </span>
        <i class="pi pi-chevron-down select-chevron" />
      </button>
      <ul v-if="open" class="select-menu" role="listbox">
        <li
          v-for="opt in options"
          :key="opt"
          class="select-option"
          :class="{ 'is-selected': opt === modelValue }"
          role="option"
          :aria-selected="opt === modelValue"
          @click="choose(opt)"
        >
          <span>{{ opt }}</span>
          <i v-if="opt === modelValue" class="pi pi-check select-check" />
        </li>
      </ul>
    </div>
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  label: String,
  placeholder: String,
  options: { type: Array, default: () => [] },
  modelValue: String,
  helper: String,
  error: String,
  disabled: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const open = ref(false);

function choose(opt) {
  emit('update:modelValue', opt);
  open.value = false;
}
function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
</script>
