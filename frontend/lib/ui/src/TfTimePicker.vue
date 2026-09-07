<template>
  <div class="field" ref="root">
    <label v-if="label" class="label"
      >{{ label }}<span v-if="required" class="label-req" aria-hidden="true">*</span></label
    >
    <div class="select" :class="{ 'is-open': open }">
      <button
        type="button"
        class="select-trigger"
        :class="{ 'is-error': error }"
        :disabled="disabled"
        @click="open = !open"
      >
        <span class="select-prefix"><i class="pi pi-clock" /></span>
        <span class="select-value" :class="{ 'is-placeholder': !modelValue }">{{
          modelValue || placeholder
        }}</span>
        <i class="pi pi-chevron-down select-chevron" />
      </button>
      <button
        v-if="clearable && modelValue && !disabled"
        type="button"
        class="dp-clear"
        aria-label="Clear time"
        @click.stop="$emit('update:modelValue', '')"
      >
        <i class="pi pi-times" />
      </button>

      <div v-if="open" class="dp-pop dp-pop--time">
        <TfTimeWheel :model-value="asDate" @update="pick" />
      </div>
    </div>
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import TfTimeWheel from './TfTimeWheel.vue';

// A clock time on its own — check-in, check-out, when the tour starts. The
// value is the "HH:mm" string the API stores, not a Date: a time of day has no
// business carrying a date with it.
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  placeholder: { type: String, default: '--:--' },
  helper: String,
  error: String,
  required: Boolean,
  disabled: Boolean,
  clearable: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const open = ref(false);

/** The wheel works in Dates; the day part is arbitrary and never leaves here. */
const asDate = computed(() => {
  const [h, m] = String(props.modelValue || '').split(':');
  const d = new Date(2000, 0, 1);
  d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
  return d;
});

const pad = (n) => String(n).padStart(2, '0');
const pick = (h, m) => emit('update:modelValue', `${pad(h)}:${pad(m)}`);

function onDoc(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>
