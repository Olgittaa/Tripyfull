<template>
  <div ref="root" class="field">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="multiselect" :class="{ 'is-open': open }">
      <div
        class="multiselect-control"
        tabindex="0"
        role="combobox"
        :aria-expanded="open"
        @click="toggleOpen"
        @keydown.enter.prevent="toggleOpen"
      >
        <div v-if="modelValue.length" class="multiselect-tags">
          <span v-for="v in modelValue" :key="v" class="multiselect-tag">
            {{ v }}
            <button type="button" class="multiselect-tag-remove" @click.stop="toggle(v)">
              <i class="pi pi-times" />
            </button>
          </span>
        </div>
        <span v-else class="multiselect-placeholder">{{ placeholder }}</span>
        <i class="pi pi-chevron-down multiselect-chevron" />
      </div>
      <ul v-if="open" class="select-menu" role="listbox">
        <li
          v-for="opt in options"
          :key="opt"
          class="select-option"
          :class="{ 'is-selected': modelValue.includes(opt) }"
          @click="toggle(opt)"
        >
          <span>{{ opt }}</span>
          <i v-if="modelValue.includes(opt)" class="pi pi-check select-check" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: String,
  placeholder: { type: String, default: 'Select…' },
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  disabled: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const open = ref(false);
function toggleOpen() {
  if (!props.disabled) open.value = !open.value;
}
function toggle(v) {
  const next = props.modelValue.includes(v)
    ? props.modelValue.filter((x) => x !== v)
    : [...props.modelValue, v];
  emit('update:modelValue', next);
}
function onDoc(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>
