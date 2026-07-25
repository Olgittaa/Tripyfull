<template>
  <Teleport to="body">
    <Transition name="drawer-scrim">
      <div v-if="modelValue" class="drawer-backdrop" @click="close"></div>
    </Transition>
    <div
      class="drawer-panel"
      :class="[
        `drawer-panel--${position}`,
        `drawer-panel--${resolvedWidth}`,
        { 'is-open': modelValue },
      ]"
      role="dialog"
      aria-modal="true"
    >
      <div class="drawer-header">
        <slot name="header">
          <div>
            <div v-if="eyebrow" class="tf-eyebrow" style="margin-bottom: 6px">{{ eyebrow }}</div>
            <h2>{{ title }}</h2>
          </div>
        </slot>
        <button type="button" class="drawer-close" aria-label="Close" @click="close">
          <i class="pi pi-times"></i>
        </button>
      </div>
      <div class="drawer-body"><slot /></div>
      <div v-if="$slots.footer" class="drawer-footer"><slot name="footer" /></div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { pushOverlay, popOverlay, isTopOverlay } from './overlayStack.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  position: { type: String, default: 'right' }, // right | left
  width: { type: String, default: 'default' }, // narrow | default | wide
  wide: { type: Boolean, default: false }, // backward-compat → wide
});
const emit = defineEmits(['update:modelValue']);

// Shared overlay stack: a dialog opened above this drawer takes Escape priority,
// and closing it must not release the body scroll lock while the drawer is open.
const token = Symbol('drawer');

const resolvedWidth = computed(() => (props.wide ? 'wide' : props.width));
function close() {
  emit('update:modelValue', false);
}
function onKey(e) {
  if (e.key === 'Escape' && props.modelValue && isTopOverlay(token)) close();
}
watch(
  () => props.modelValue,
  (v) => {
    if (v) pushOverlay(token);
    else popOverlay(token);
  },
);
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  popOverlay(token);
});
</script>
