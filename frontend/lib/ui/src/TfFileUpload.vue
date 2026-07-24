<template>
  <div class="field">
    <label v-if="label" class="label">{{ label }}</label>
    <label
      class="dropzone"
      :class="[`dropzone--${variant}`, { 'is-drag': dragging }]"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <input
        class="dropzone-input"
        type="file"
        :multiple="multiple"
        :accept="accept"
        @change="onChange"
      />
      <span v-if="variant === 'full'" class="dropzone-badge"><i class="pi pi-cloud-upload" /></span>
      <i v-else class="pi pi-cloud-upload dropzone-cicon" />
      <div class="dropzone-title">Drag &amp; drop or <span class="dropzone-link">browse</span></div>
      <div v-if="hint && variant === 'full'" class="hint">{{ hint }}</div>
    </label>
    <div v-if="hint && variant === 'compact'" class="hint" style="margin-top: 6px">{{ hint }}</div>

    <ul
      v-if="items.length"
      class="dropzone-files"
      :class="{ 'dropzone-files--compact': variant === 'compact' }"
    >
      <li v-for="it in items" :key="it.id" class="dropzone-file">
        <template v-if="variant === 'full'">
          <span class="dropzone-file-icon">
            <img
              v-if="it.preview"
              class="dropzone-file-thumb"
              :src="it.preview"
              :alt="it.file.name"
            />
            <i v-else class="pi" :class="iconFor(it.file)" />
          </span>
          <div class="dropzone-file-main">
            <span class="dropzone-file-name">{{ it.file.name }}</span>
            <span class="dropzone-file-size">{{ fmtSize(it.file.size) }}</span>
          </div>
        </template>
        <template v-else>
          <i class="pi dropzone-file-mini" :class="iconFor(it.file)" />
          <span class="dropzone-file-name">{{ it.file.name }}</span>
        </template>
        <button type="button" class="dropzone-file-remove" aria-label="Remove" @click="remove(it.id)">
          <i class="pi pi-times" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  label: String,
  hint: String,
  accept: String,
  multiple: Boolean,
  variant: { type: String, default: 'full' }, // full | compact
});
const emit = defineEmits(['change']);

const items = ref([]);
const dragging = ref(false);
let seq = 0;

function fmtSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function iconFor(file) {
  if (file.type.startsWith('image/')) return 'pi-image';
  if (file.type === 'application/pdf') return 'pi-file-pdf';
  return 'pi-file';
}
function add(list) {
  const next = Array.from(list).map((file) => {
    const item = { id: ++seq, file, preview: null };
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => (item.preview = e.target.result);
      reader.readAsDataURL(file);
    }
    return item;
  });
  items.value = props.multiple ? [...items.value, ...next] : next.slice(-1);
  emit(
    'change',
    items.value.map((i) => i.file),
  );
}
function onChange(e) {
  add(e.target.files);
  e.target.value = '';
}
function onDrop(e) {
  dragging.value = false;
  add(e.dataTransfer.files);
}
function remove(id) {
  items.value = items.value.filter((i) => i.id !== id);
  emit(
    'change',
    items.value.map((i) => i.file),
  );
}
</script>
