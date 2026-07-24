<template>
  <div ref="root" class="menu-wrap">
    <span @click="open = !open"><slot /></span>
    <div v-if="open" class="popover" :class="`popover--${position}`">
      <slot name="content" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({ position: { type: String, default: 'bottom' } });

const root = ref(null);
const open = ref(false);
function onDoc(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>
