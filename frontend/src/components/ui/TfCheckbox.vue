<template>
  <label class="tf-check">
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)">
    <span><slot /></span>
  </label>
  <span v-if="helper" class="tf-helper" style="margin-left:28px">{{ helper }}</span>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  helper: String,
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.tf-check {
  display: flex; align-items: center; gap: 10px;
  font: var(--fw-regular) var(--text-sm)/1 var(--font-sans);
  color: var(--text-body); cursor: pointer; padding: 6px 0;
}
.tf-check input { accent-color: var(--brand); width: 18px; height: 18px; cursor: pointer; }
.tf-helper { font: var(--fw-regular) var(--text-xs)/1.3 var(--font-sans); color: var(--text-subtle); }
</style>
