<template>
  <!-- inline: sits next to the content instead of covering it (no scrim, no teleport) -->
  <Teleport to="body" :disabled="inline">
    <Transition name="drawer-scrim">
      <div v-if="modelValue && !inline" class="drawer-backdrop" @click="close"></div>
    </Transition>
    <!-- Only the inline panel mounts and unmounts, so only it animates; the
         modal one stays in the DOM and slides via .is-open. -->
    <Transition name="drawer-inline">
      <div
        v-if="!inline || modelValue"
        class="drawer-panel"
        :class="[
          `drawer-panel--${position}`,
          `drawer-panel--${resolvedWidth}`,
          { 'is-open': modelValue, 'drawer-panel--inline': inline },
        ]"
        role="dialog"
        :aria-modal="inline ? undefined : 'true'"
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
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { pushOverlay, popOverlay, isTopOverlay, hasOverlays } from './overlayStack.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  position: { type: String, default: 'right' }, // right | left
  width: { type: String, default: 'default' }, // narrow | default | wide
  wide: { type: Boolean, default: false }, // backward-compat → wide
  // Inline drawers share space with the page: they push content instead of
  // overlaying it, so surrounding chrome (top bar) stays usable.
  inline: { type: Boolean, default: false },
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
  if (e.key !== 'Escape' || !props.modelValue) return;
  if (props.inline ? !hasOverlays() : isTopOverlay(token)) close();
}
watch(
  () => props.modelValue,
  (v) => {
    if (props.inline) return;
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
