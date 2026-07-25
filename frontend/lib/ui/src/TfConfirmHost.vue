<template>
  <TfConfirm
    :model-value="confirmState.open"
    :title="confirmState.options.title"
    :message="confirmState.options.message"
    :tone="confirmState.options.tone"
    :confirm-label="confirmState.options.confirmLabel"
    :cancel-label="confirmState.options.cancelLabel"
    @update:model-value="(v) => !v && resolveConfirm(false)"
    @confirm="resolveConfirm(true)"
    @cancel="resolveConfirm(false)"
  />
</template>

<script setup>
import TfConfirm from './TfConfirm.vue';
import { confirmState, resolveConfirm } from './confirm.js';
</script>
