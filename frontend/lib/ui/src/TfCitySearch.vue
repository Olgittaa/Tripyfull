<template>
  <div class="tf-city-search" ref="wrapper">
    <div style="position: relative">
      <PInputText
        :modelValue="displayValue"
        @update:modelValue="onInput"
        @focus="onFocus"
        :placeholder="placeholder"
        class="w-full"
        autocomplete="off"
      />
      <i
        v-if="searching"
        class="pi pi-spin pi-spinner"
        style="
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          font-size: 14px;
        "
      ></i>
    </div>
    <div v-if="open && (results.length || searching || noResults)" class="tf-city-dropdown">
      <div
        v-if="searching && !results.length"
        style="padding: 14px; text-align: center; font: var(--type-small); color: var(--text-secondary)"
      >
        Searching...
      </div>
      <div
        v-for="item in results"
        :key="item.id || item.name + item.countryCode"
        class="tf-city-option"
        @mousedown.prevent="select(item)"
      >
        <div class="tf-city-option-name">
          <i
            class="pi pi-map-marker"
            style="font-size: 12px; color: var(--accent); margin-right: 6px"
          ></i>
          {{ item.name }}
        </div>
        <div class="tf-city-option-meta">
          {{ item.country }}{{ item.countryCode ? ' · ' + item.countryCode : '' }}
        </div>
      </div>
      <div
        v-if="noResults && !searching"
        style="
          padding: 14px;
          text-align: center;
          font: var(--type-small);
          color: var(--text-secondary);
        "
      >
        No cities found. You can type a custom name.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { api } from '@tripyfull/core';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search city...' },
  country: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'select']);

const wrapper = ref(null);
const open = ref(false);
const results = ref([]);
const searching = ref(false);
const searchDone = ref(false);
const displayValue = ref(props.modelValue || '');
let debounceTimer = null;

const noResults = computed(
  () => searchDone.value && results.value.length === 0 && displayValue.value?.length >= 2,
);

watch(
  () => props.modelValue,
  (v) => {
    displayValue.value = v || '';
  },
);

const onInput = (val) => {
  displayValue.value = val;
  emit('update:modelValue', val);
  clearTimeout(debounceTimer);
  searchDone.value = false;
  if (!val || val.length < 2) {
    results.value = [];
    return;
  }
  debounceTimer = setTimeout(() => search(val), 300);
};

const onFocus = () => {
  open.value = true;
  if (displayValue.value?.length >= 2) search(displayValue.value);
};

const search = async (q) => {
  searching.value = true;
  try {
    const params = { q };
    if (props.country) params.country = props.country;
    const res = await api.get('/api/geo/cities', { params });
    results.value = res.data;
    open.value = true;
  } catch {
    results.value = [];
  } finally {
    searching.value = false;
    searchDone.value = true;
  }
};

const select = (item) => {
  displayValue.value = item.name;
  emit('update:modelValue', item.name);
  emit('select', item);
  open.value = false;
  results.value = [];
};

const onClickOutside = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = false;
  }
};

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));
</script>

<style scoped>
.tf-city-search {
  position: relative;
}

.tf-city-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 280px;
  overflow-y: auto;
  margin-top: 4px;
}

.tf-city-option {
  padding: 10px 14px;
  cursor: pointer;
  transition: background var(--dur-fast);
}

.tf-city-option:hover {
  background: var(--surface);
}

.tf-city-option-name {
  font: var(--fw-medium) 14px/1.2 var(--font-sans);
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.tf-city-option-meta {
  font: var(--fw-regular) 12px/1.2 var(--font-sans);
  color: var(--text-secondary);
  margin-top: 1px;
  margin-left: 18px;
}
</style>
