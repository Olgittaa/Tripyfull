<template>
  <div class="drawer-section">
    <span v-if="label" class="drawer-section-label">{{ label }}</span>
    <div class="drawer-section-content"><slot /></div>
  </div>
</template>

<script setup>
defineProps({ label: String });
</script>
