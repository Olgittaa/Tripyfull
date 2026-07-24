<template>
  <span class="spinner" :style="{ width: size, height: size }" role="status" aria-label="Loading" />
</template>

<script setup>
defineProps({
  size: { type: String, default: '24px' },
});
</script>
