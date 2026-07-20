<template>
  <div class="tf-toast">
    <div v-if="icon" class="tf-toast-icon"><i :class="icon"></i></div>
    <div class="tf-toast-content">
      <b>{{ title }}</b>
      <span v-if="message" class="text-sm" style="color: var(--text-muted)">{{ message }}</span>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  message: String,
  icon: String,
});
</script>

<style scoped>
.tf-toast {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 12px;
}
.tf-toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.tf-toast-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tf-toast-content b {
  font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans);
  color: var(--text-strong);
}
</style>
