<template>
  <div ref="root" class="menu-wrap">
    <span @click="open = !open"><slot /></span>
    <div v-if="open" class="menu">
      <template v-for="(it, i) in items" :key="i">
        <div v-if="it.divider" class="menu-divider"></div>
        <button
          v-else
          type="button"
          class="menu-item"
          :class="{ 'menu-item--danger': it.danger }"
          @click="select(it)"
        >
          <i v-if="it.icon" class="pi menu-item-icon" :class="it.icon" />
          <span>{{ it.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({ items: { type: Array, default: () => [] } });
const emit = defineEmits(['select']);

const root = ref(null);
const open = ref(false);
function select(it) {
  emit('select', it);
  open.value = false;
}
function onDoc(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>
