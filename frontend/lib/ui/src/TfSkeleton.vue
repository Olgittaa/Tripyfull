<template>
  <span class="skeleton" :class="`skeleton--${variant}`" :style="style" />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'text' }, // text | rect | circle
  width: String,
  height: String,
});
const style = computed(() => ({ width: props.width, height: props.height }));
</script>
