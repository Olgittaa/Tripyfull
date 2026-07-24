<template>
  <div class="alert" :class="`alert--${tone}`" role="alert">
    <i class="alert-icon pi" :class="icon" />
    <div class="alert-content">
      <div class="alert-title">{{ title }}</div>
      <div v-if="$slots.default" class="alert-text"><slot /></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tone: { type: String, default: 'neutral' }, // success | warning | danger | neutral
  title: { type: String, required: true },
});

const ICONS = {
  success: 'pi-check-circle',
  warning: 'pi-exclamation-triangle',
  danger: 'pi-times-circle',
  neutral: 'pi-info-circle',
};
const icon = computed(() => ICONS[props.tone] || ICONS.neutral);
</script>
