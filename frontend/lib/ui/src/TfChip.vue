<template>
  <span class="chip" :class="{ 'chip--selected': selected }">
    <i v-if="icon" class="chip-icon pi" :class="icon" />
    <span><slot /></span>
    <button v-if="removable" type="button" class="chip-remove" @click="$emit('remove')">
      <i class="pi pi-times" />
    </button>
  </span>
</template>

<script setup>
defineProps({
  icon: String,
  removable: { type: Boolean, default: true },
  selected: Boolean,
});
defineEmits(['remove']);
</script>
