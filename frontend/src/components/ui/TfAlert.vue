<template>
  <div class="tf-alert" :class="`tf-alert--${tone}`">
    <div class="tf-alert-title">{{ title }}</div>
    <div v-if="$slots.default" class="tf-alert-body"><slot /></div>
  </div>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'info' },
  title: { type: String, required: true },
});
</script>

<style scoped>
.tf-alert { padding: 14px 18px; border-radius: var(--radius-md); border-left: 3px solid; }
.tf-alert-title { font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans); margin-bottom: 4px; }
.tf-alert-body { font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); color: var(--text-body); }

.tf-alert--success { background: var(--success-100); border-color: var(--success-500); }
.tf-alert--success .tf-alert-title { color: var(--success-500); }
.tf-alert--warning { background: var(--warning-100); border-color: var(--warning-500); }
.tf-alert--warning .tf-alert-title { color: var(--warning-500); }
.tf-alert--danger { background: var(--danger-100); border-color: var(--danger-500); }
.tf-alert--danger .tf-alert-title { color: var(--danger-500); }
.tf-alert--info { background: var(--info-100); border-color: var(--info-500); }
.tf-alert--info .tf-alert-title { color: var(--info-500); }
</style>
