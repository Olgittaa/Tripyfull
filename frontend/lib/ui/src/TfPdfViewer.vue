<template>
  <div class="pdf-viewer">
    <div v-if="url" class="pdf-frame">
      <iframe class="pdf-iframe" :src="url" :title="title" loading="lazy" />
    </div>
    <div v-else class="pdf-empty">{{ emptyText || t('ui.noDocument') }}</div>
  </div>
</template>

<script setup>
import { t } from '@tripyfull/core';
import { ref, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  src: String, // URL string
  source: { default: null }, // Blob / File
  title: { type: String, default: 'PDF' },
  emptyText: { type: String, default: '' }, // empty: the app's language decides
});

const url = ref('');
let objectUrl = null;

function apply() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
  if (props.source) {
    objectUrl = URL.createObjectURL(props.source);
    url.value = objectUrl;
  } else {
    url.value = props.src || '';
  }
}
watch(() => [props.source, props.src], apply, { immediate: true });
onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>
