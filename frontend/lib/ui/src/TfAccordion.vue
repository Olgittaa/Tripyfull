<template>
  <div class="accordion">
    <div
      v-for="(it, i) in items"
      :key="i"
      class="accordion-item"
      :class="{ 'is-open': isOpen(i) }"
    >
      <button type="button" class="accordion-head" @click="toggle(i)">
        <span>{{ it.title }}</span>
        <i class="pi pi-chevron-down accordion-caret" />
      </button>
      <div v-show="isOpen(i)" class="accordion-body">{{ it.text }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  multiple: Boolean,
});
const open = ref(new Set());
const isOpen = (i) => open.value.has(i);
function toggle(i) {
  const s = new Set(open.value);
  if (s.has(i)) s.delete(i);
  else {
    if (!props.multiple) s.clear();
    s.add(i);
  }
  open.value = s;
}
</script>
