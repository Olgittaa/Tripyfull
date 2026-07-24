<template>
  <span
    class="tooltip-wrap"
    @mouseenter="show = true"
    @mouseleave="show = false"
    @focusin="show = true"
    @focusout="show = false"
  >
    <slot />
    <span
      v-if="!disabled && (text || $slots.content)"
      class="tooltip"
      :class="`tooltip--${position}`"
      role="tooltip"
      :data-show="show"
    >
      <slot name="content">{{ text }}</slot>
    </span>
  </span>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  text: String,
  position: { type: String, default: 'top' }, // top | bottom | left | right
  disabled: Boolean,
});
const show = ref(false);
</script>
