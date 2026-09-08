<template>
  <div class="tf-place-search" ref="wrapper">
    <div style="position: relative">
      <i class="pi pi-map-marker tf-place-pin"></i>
      <input
        :value="displayValue"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeydown"
        :placeholder="placeholder"
        autocomplete="off"
        class="tf-place-input"
        :class="{ 'is-error': error }"
        style="padding-left: 34px"
      />
      <i
        v-if="searching"
        class="pi pi-spin pi-spinner"
        style="
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          font-size: 13px;
        "
      ></i>
      <button
        v-else-if="displayValue"
        class="tf-place-clear-btn"
        @click.prevent="clear"
        type="button"
      >
        <i class="pi pi-times" style="font-size: 10px"></i>
      </button>
    </div>

    <div v-if="open && (results.length || noResults || searching)" class="tf-place-dropdown">
      <div
        v-if="searching && !results.length"
        style="
          padding: 14px;
          text-align: center;
          font: var(--type-small);
          color: var(--text-secondary);
        "
      >
        Searching...
      </div>
      <div
        v-for="r in results"
        :key="r.lat + '|' + r.lon + '|' + r.name"
        class="tf-place-option"
        @mousedown.prevent="select(r)"
      >
        <div class="tf-place-type-icon">{{ typeEmoji(r.placeType) }}</div>
        <div style="min-width: 0; flex: 1">
          <div class="tf-place-name">{{ r.name }}</div>
          <div class="tf-place-sub">{{ shortAddr(r.displayName, r.name) }}</div>
        </div>
        <div class="tf-place-badge">{{ typeBadge(r.placeType) }}</div>
      </div>
      <div
        v-if="noResults"
        style="
          padding: 14px;
          text-align: center;
          font: var(--type-small);
          color: var(--text-secondary);
        "
      >
        Not found — try a different spelling or language
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { api } from '@tripyfull/core';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search place, hotel, airport...' },
  error: String,
});

const emit = defineEmits(['update:modelValue', 'select']);

const wrapper = ref(null);
const open = ref(false);
const results = ref([]);
const searching = ref(false);
const searched = ref(false);
const displayValue = ref(props.modelValue || '');
let timer = null;
let searchSeq = 0; // guards against an older response overwriting a newer one

const noResults = computed(
  () =>
    searched.value && !searching.value && !results.value.length && displayValue.value.length >= 2,
);

watch(
  () => props.modelValue,
  (v) => {
    displayValue.value = v || '';
  },
);

const onInput = (e) => {
  const val = e.target.value;
  displayValue.value = val;
  emit('update:modelValue', val);
  searched.value = false;
  clearTimeout(timer);
  if (!val || val.length < 2) {
    results.value = [];
    open.value = false;
    return;
  }
  open.value = true;
  searching.value = true;
  timer = setTimeout(() => doSearch(val), 380);
};

const onFocus = () => {
  open.value = true;
  if (displayValue.value.length >= 2 && !results.value.length) doSearch(displayValue.value);
};

const onKeydown = (e) => {
  if (e.key === 'Escape') open.value = false;
};

const doSearch = async (q) => {
  const seq = ++searchSeq;
  searching.value = true;
  try {
    const res = await api.get('/api/geo/places', { params: { q } });
    if (seq !== searchSeq) return; // a newer search superseded this one
    results.value = res.data;
    open.value = true;
  } catch {
    if (seq === searchSeq) results.value = [];
  } finally {
    if (seq === searchSeq) {
      searching.value = false;
      searched.value = true;
    }
  }
};

const select = (r) => {
  displayValue.value = r.name;
  emit('update:modelValue', r.name);
  emit('select', r);
  open.value = false;
  results.value = [];
};

const clear = () => {
  displayValue.value = '';
  emit('update:modelValue', '');
  emit('select', null);
  results.value = [];
  open.value = false;
};

const shortAddr = (displayName, name) => {
  if (!displayName) return '';
  const parts = displayName.split(',').map((p) => p.trim());
  // Remove the first part if it matches the name (avoid duplication)
  const start = parts[0] === name ? 1 : 0;
  return parts.slice(start, start + 3).join(', ');
};

const typeEmoji = (t) =>
  ({
    hotel: '🏨',
    airport: '✈️',
    city: '🌆',
    tourism: '🎭',
    food: '🍽️',
    amenity: '📍',
    station: '🚉',
    place: '📍',
  })[t] || '📍';

const typeBadge = (t) =>
  ({
    hotel: 'Hotel',
    airport: 'Airport',
    city: 'City',
    tourism: 'Attraction',
    food: 'Food',
    amenity: 'Place',
    station: 'Station',
    place: 'Place',
  })[t] || '';

const onClickOutside = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) open.value = false;
};

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));
</script>

<style scoped>
.tf-place-search {
  position: relative;
}

.tf-place-input.is-error {
  border-color: var(--input-text-danger-border);
}
.tf-place-input {
  width: 100%;
  height: 42px;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--input-text-bg);
  color: var(--text-primary);
  font: var(--fw-regular) 14px/1 var(--font-sans);
  box-sizing: border-box;
  padding: 0 36px 0 34px;
  outline: none;
  transition: border-color var(--dur-fast);
}
/* The one focus ring the design system uses, same as .input's. */
.tf-place-input:focus {
  border-color: var(--input-text-focus-border);
  box-shadow: 0 0 0 3px var(--input-select-focus-bg);
}
.tf-place-input::placeholder {
  color: var(--text-secondary);
}

.tf-place-pin {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 13px;
  pointer-events: none;
}

/* Read-only, like every other field in a disabled form: the value stays
   legible, the field stops looking like something to type in, and the clear
   button and the empty-field placeholder step out. */
.tf-place-input:disabled {
  background: var(--surface);
  border-color: var(--border-default);
  color: var(--text-primary);
  cursor: default;
}
.tf-place-input:disabled::placeholder {
  color: transparent;
}
.tf-place-input:disabled ~ .tf-place-clear-btn {
  display: none;
}
.tf-place-search div:has(> .tf-place-input:disabled) > .tf-place-pin {
  color: var(--text-disabled);
}

.tf-place-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-place-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 200;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 300px;
  overflow-y: auto;
}

.tf-place-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.tf-place-option:hover {
  background: var(--surface);
}
.tf-place-option:not(:last-child) {
  border-bottom: 1px solid var(--border-default);
}

.tf-place-type-icon {
  font-size: 18px;
  flex: none;
  width: 28px;
  text-align: center;
}

.tf-place-name {
  font: var(--fw-semibold) 14px/1.3 var(--font-sans);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tf-place-sub {
  font: var(--fw-regular) 12px/1.3 var(--font-sans);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.tf-place-badge {
  flex: none;
  font: var(--fw-medium) 11px/1 var(--font-mono);
  color: var(--text-secondary);
  background: var(--surface);
  padding: 3px 7px;
  border-radius: 20px;
  white-space: nowrap;
}
</style>
