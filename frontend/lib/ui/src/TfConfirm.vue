<template>
  <TfModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <p v-if="message" style="margin: 0">{{ message }}</p>
    <template #footer>
      <TfButton variant="secondary" @click="cancel">{{ cancelLabel || t('ui.cancel') }}</TfButton>
      <TfButton :variant="tone === 'danger' ? 'danger' : 'primary'" @click="confirm">
        {{ confirmLabel || t('ui.confirm') }}
      </TfButton>
    </template>
  </TfModal>
</template>

<script setup>
import { t } from '@tripyfull/core';
import TfModal from './TfModal.vue';
import TfButton from './TfButton.vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  message: String,
  tone: { type: String, default: 'primary' }, // primary | danger
  confirmLabel: { type: String, default: '' }, // empty: the app's language decides
  cancelLabel: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

function close() {
  emit('update:modelValue', false);
}
function confirm() {
  emit('confirm');
  close();
}
function cancel() {
  emit('cancel');
  close();
}
</script>
