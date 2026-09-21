<template>
  <span
    class="spinner"
    :style="{ width: size, height: size }"
    role="status"
    :aria-label="t('ui.loading')"
  />
</template>

<script setup>
import { t } from '@tripyfull/core';
defineProps({
  size: { type: String, default: '24px' },
});
</script>
