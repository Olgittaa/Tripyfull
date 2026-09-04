<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="modelValue"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        @click.self="close"
      >
        <button type="button" class="lightbox-close" aria-label="Close" @click="close">
          <i class="pi pi-times" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="lightbox-nav lightbox-nav--prev"
          aria-label="Previous photo"
          @click.stop="step(-1)"
        >
          <i class="pi pi-chevron-left" />
        </button>

        <figure class="lightbox-figure">
          <img class="lightbox-img" :src="photos[current]" :alt="caption || 'Photo'" />
          <figcaption class="lightbox-caption">
            <span v-if="caption" class="lightbox-title">{{ caption }}</span>
            <span v-if="photos.length > 1" class="lightbox-count"
              >{{ current + 1 }} / {{ photos.length }}</span
            >
          </figcaption>
        </figure>

        <button
          v-if="photos.length > 1"
          type="button"
          class="lightbox-nav lightbox-nav--next"
          aria-label="Next photo"
          @click.stop="step(1)"
        >
          <i class="pi pi-chevron-right" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { pushOverlay, popOverlay, isTopOverlay } from './overlayStack.js';

const props = defineProps({
  modelValue: Boolean,
  /** Absolute image URLs, in display order. */
  photos: { type: Array, default: () => [] },
  /** Which photo opens first. */
  index: { type: Number, default: 0 },
  caption: String,
});
const emit = defineEmits(['update:modelValue', 'update:index']);

const token = Symbol('lightbox');
const current = ref(props.index);

watch(
  () => props.index,
  (i) => (current.value = i),
);

// Photos can be removed while the viewer is open — never point past the end.
watch(
  () => props.photos.length,
  (n) => {
    if (n === 0) close();
    else if (current.value >= n) current.value = n - 1;
  },
);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      current.value = props.index;
      pushOverlay(token);
    } else {
      popOverlay(token);
    }
  },
  { immediate: true },
);

function close() {
  emit('update:modelValue', false);
}

function step(delta) {
  const n = props.photos.length;
  if (!n) return;
  current.value = (current.value + delta + n) % n;
  emit('update:index', current.value);
}

function onKey(e) {
  if (!props.modelValue || !isTopOverlay(token)) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
}

onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  popOverlay(token);
});
</script>
