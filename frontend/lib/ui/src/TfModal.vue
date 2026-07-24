<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="onBackdrop">
        <div class="modal" :class="`modal--${size}`" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="modal-close" aria-label="Close" @click="close">
              <i class="pi pi-times" />
            </button>
          </div>
          <div v-if="$slots.default" class="modal-body"><slot /></div>
          <div v-if="$slots.footer" class="modal-foot"><slot name="footer" /></div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  subtitle: String,
  size: { type: String, default: 'md' }, // sm | md | lg
  closeOnBackdrop: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue']);

function close() {
  emit('update:modelValue', false);
}
function onBackdrop() {
  if (props.closeOnBackdrop) close();
}
function onKey(e) {
  if (e.key === 'Escape') close();
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    }
  },
);
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});
</script>
