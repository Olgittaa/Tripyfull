<template>
  <div class="toast" :class="`toast--${tone}`" role="status">
    <i class="toast-icon pi" :class="icon" />
    <div class="toast-content">
      <div class="toast-title">{{ title }}</div>
      <div v-if="message" class="toast-message">{{ message }}</div>
    </div>
    <button
      v-if="closable"
      type="button"
      class="toast-close"
      aria-label="Dismiss"
      @click="$emit('close')"
    >
      <i class="pi pi-times" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tone: { type: String, default: 'neutral' }, // success | warning | danger | neutral
  title: { type: String, required: true },
  message: String,
  closable: { type: Boolean, default: true },
});
defineEmits(['close']);

const ICONS = {
  success: 'pi-check-circle',
  warning: 'pi-exclamation-triangle',
  danger: 'pi-times-circle',
  neutral: 'pi-info-circle',
};
const icon = computed(() => ICONS[props.tone] || ICONS.neutral);
</script>
