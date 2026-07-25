<template>
  <div class="field">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="num-control" :class="[`num-control--${type}`, { 'is-disabled': disabled }]">
      <button
        v-if="type === 'split'"
        type="button"
        class="num-btn"
        tabindex="-1"
        :disabled="disabled || !canDec"
        @click="nudge(-1)"
      >
        <i class="pi pi-minus" />
      </button>

      <span v-if="prefix" class="num-prefix">{{ prefix }}</span>

      <input
        class="num-field"
        type="text"
        inputmode="decimal"
        :size="fieldSize"
        :value="display"
        :disabled="disabled"
        @focus="onFocus"
        @input="onInput"
        @change="commit"
        @blur="onBlur"
      />

      <div v-if="type === 'stacked'" class="num-stack">
        <button
          type="button"
          class="num-btn"
          tabindex="-1"
          :disabled="disabled || !canInc"
          @click="nudge(1)"
        >
          <i class="pi pi-chevron-up" />
        </button>
        <button
          type="button"
          class="num-btn"
          tabindex="-1"
          :disabled="disabled || !canDec"
          @click="nudge(-1)"
        >
          <i class="pi pi-chevron-down" />
        </button>
      </div>
      <button
        v-else-if="type === 'split'"
        type="button"
        class="num-btn"
        tabindex="-1"
        :disabled="disabled || !canInc"
        @click="nudge(1)"
      >
        <i class="pi pi-plus" />
      </button>
    </div>
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  label: String,
  modelValue: { type: Number, default: null },
  type: { type: String, default: 'plain' }, // 'split' | 'stacked' | 'plain'
  prefix: String,
  precision: { type: Number, default: 0 },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  disabled: Boolean,
  hint: String,
});
const emit = defineEmits(['update:modelValue']);

const focused = ref(false);
const draft = ref('');

function clamp(v) {
  if (props.min != null && v < props.min) v = props.min;
  if (props.max != null && v > props.max) v = props.max;
  return v;
}
function round(v) {
  const f = 10 ** props.precision;
  return Math.round(v * f) / f;
}
function format(v) {
  if (v == null) return '';
  const s = v.toFixed(props.precision);
  return props.precision > 0 ? s.replace('.', ',') : s;
}

const current = computed(() => props.modelValue ?? 0);
const canDec = computed(() => props.min == null || current.value > props.min);
const canInc = computed(() => props.max == null || current.value < props.max);
const display = computed(() => (focused.value ? draft.value : format(props.modelValue)));
const fieldSize = computed(() => Math.max((display.value || '0').length, 1));

function nudge(dir) {
  emit('update:modelValue', clamp(round(current.value + dir * props.step)));
}
function onFocus() {
  focused.value = true;
  draft.value = props.modelValue == null ? '' : format(props.modelValue);
}
function onInput(e) {
  draft.value = e.target.value;
}
function commit(e) {
  const raw = e.target.value.trim().replace(',', '.');
  if (raw === '') {
    emit('update:modelValue', null);
    return;
  }
  const n = Number(raw);
  if (Number.isNaN(n)) return;
  emit('update:modelValue', clamp(round(n)));
}
function onBlur() {
  focused.value = false;
}
</script>
