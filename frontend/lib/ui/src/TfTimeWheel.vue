<template>
  <div class="dp-wheel">
    <div class="dp-wheel-band"></div>
    <div class="dp-wheel-cols">
      <div
        ref="hCol"
        class="dp-wheel-col"
        @scroll="onScroll"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <div class="dp-wheel-pad"></div>
        <div v-for="h in hours" :key="h" class="dp-wheel-opt">{{ pad(h) }}</div>
        <div class="dp-wheel-pad"></div>
      </div>
      <span class="dp-wheel-sep">:</span>
      <div
        ref="mCol"
        class="dp-wheel-col"
        @scroll="onScroll"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <div class="dp-wheel-pad"></div>
        <div v-for="m in minutes" :key="m" class="dp-wheel-opt">{{ pad(m) }}</div>
        <div class="dp-wheel-pad"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({ modelValue: { default: null } });
const emit = defineEmits(['update']);

const ROW = 34;
const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n) => String(n).padStart(2, '0');

const hCol = ref(null);
const mCol = ref(null);
let suppress = false;
let dragging = false;
let drag = null; // { el, startY, startTop }
let timer = null;

const curH = () => (props.modelValue ? props.modelValue.getHours() : 0);
const curMIdx = () => (props.modelValue ? Math.round(props.modelValue.getMinutes() / 5) % 12 : 0);
const clamp = (v, max) => Math.min(Math.max(v, 0), max);

function center() {
  if (dragging) return;
  suppress = true;
  if (hCol.value) hCol.value.scrollTop = curH() * ROW;
  if (mCol.value) mCol.value.scrollTop = curMIdx() * ROW;
  nextTick(() => requestAnimationFrame(() => (suppress = false)));
}

function readEmit() {
  const hi = clamp(Math.round((hCol.value?.scrollTop || 0) / ROW), 23);
  const mi = clamp(Math.round((mCol.value?.scrollTop || 0) / ROW), 11);
  emit('update', hours[hi], minutes[mi]);
}

function onScroll() {
  if (suppress || dragging) return;
  clearTimeout(timer);
  timer = setTimeout(readEmit, 140);
}

/* pointer drag (mouse) — touch & wheel use native scroll */
function onDown(e) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  drag = { el, startY: e.clientY, startTop: el.scrollTop };
  dragging = true;
  el.classList.add('is-dragging');
  el.setPointerCapture?.(e.pointerId);
  e.preventDefault();
}
function onMove(e) {
  if (!dragging || !drag) return;
  drag.el.scrollTop = drag.startTop - (e.clientY - drag.startY);
}
function onUp() {
  if (!dragging || !drag) return;
  const el = drag.el;
  drag = null;
  dragging = false;
  el.classList.remove('is-dragging');
  el.scrollTop = clamp(Math.round(el.scrollTop / ROW), el === hCol.value ? 23 : 11) * ROW;
  readEmit();
}

onMounted(center);
watch(() => props.modelValue, center);
</script>
