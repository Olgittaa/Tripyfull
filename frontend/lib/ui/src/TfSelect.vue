<template>
  <div class="field" ref="root">
    <label v-if="label" class="label"
      >{{ label }}<span v-if="required" class="label-req" aria-hidden="true">*</span></label
    >
    <div class="select" :class="[{ 'is-open': open }, size === 'sm' && 'select--sm']">
      <button
        ref="triggerEl"
        type="button"
        class="select-trigger"
        :class="{ 'is-error': error }"
        :disabled="disabled"
        @click="toggle"
      >
        <span v-if="$slots.prefix" class="select-prefix"><slot name="prefix" /></span>
        <span class="select-value" :class="{ 'is-placeholder': !modelValue }">
          {{ modelValue || placeholder }}
        </span>
        <i class="pi pi-chevron-down select-chevron" />
      </button>
      <!-- Teleported + viewport-anchored: a long list must not be clipped by a
           modal or a card with overflow, and must not stretch the page. -->
      <Teleport to="body">
        <div v-if="open" ref="menuEl" class="select-menu select-menu--floating" :style="menuStyle">
          <div v-if="withSearch" class="select-search">
            <i class="pi pi-search" />
            <input
              ref="searchEl"
              v-model="query"
              type="text"
              :placeholder="searchPlaceholder"
              @keydown.esc.stop="open = false"
              @keydown.enter.prevent="chooseFirst"
            />
          </div>
          <ul class="select-list" :style="{ maxHeight: listMaxHeight }" role="listbox">
            <li
              v-for="opt in filtered"
              :key="opt"
              class="select-option"
              :class="{ 'is-selected': opt === modelValue }"
              role="option"
              :aria-selected="opt === modelValue"
              @click="choose(opt)"
            >
              <span>{{ opt }}</span>
              <i v-if="opt === modelValue" class="pi pi-check select-check" />
            </li>
            <li v-if="!filtered.length" class="select-empty">No matches</li>
          </ul>
        </div>
      </Teleport>
    </div>
    <span v-if="error" class="hint hint--error">{{ error }}</span>
    <span v-else-if="helper" class="hint">{{ helper }}</span>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: String,
  placeholder: String,
  options: { type: Array, default: () => [] },
  modelValue: String,
  helper: String,
  error: String,
  required: Boolean,
  disabled: Boolean,
  // 'sm' matches the small button height for toolbar rows.
  size: { type: String, default: '' },
  // Filter field: 'auto' shows it once the list is long enough to need one.
  searchable: { type: [Boolean, String], default: 'auto' },
  searchPlaceholder: { type: String, default: 'Type to filter…' },
});
const emit = defineEmits(['update:modelValue']);

const SEARCH_FROM = 8; // options count that makes scrolling annoying
const MAX_LIST = 264; // ~7 options
const MIN_LIST = 120; // below this, flip the menu instead of squeezing it
const GAP = 4;
const EDGE = 8; // keep the menu off the viewport edge

const root = ref(null);
const triggerEl = ref(null);
const menuEl = ref(null);
const searchEl = ref(null);
const open = ref(false);
const query = ref('');
const placement = ref({ flip: false, top: 0, bottom: 0, left: 0, width: 0, space: MAX_LIST });

const withSearch = computed(() =>
  props.searchable === 'auto' ? props.options.length >= SEARCH_FROM : !!props.searchable,
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  // Prefix matches first — "th" puts Thailand above South Africa.
  const starts = [];
  const contains = [];
  for (const o of props.options) {
    const s = String(o).toLowerCase();
    if (s.startsWith(q)) starts.push(o);
    else if (s.includes(q)) contains.push(o);
  }
  return [...starts, ...contains];
});

const menuStyle = computed(() => {
  const p = placement.value;
  return {
    // Flipped menus are anchored by their bottom edge, so a short list still
    // hugs the trigger instead of floating at the top of the reserved space.
    // The unused side must be reset, or the box stretches between top and bottom.
    ...(p.flip ? { bottom: `${p.bottom}px`, top: 'auto' } : { top: `${p.top}px`, bottom: 'auto' }),
    left: `${p.left}px`,
    width: `${p.width}px`,
  };
});

/** Height left for the options once the search field took its share. */
const listMaxHeight = computed(() => {
  const chrome = withSearch.value ? 46 : 0;
  return `${Math.max(MIN_LIST - chrome, placement.value.space - chrome)}px`;
});

function measure() {
  const el = triggerEl.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - GAP - EDGE;
  const above = r.top - GAP - EDGE;
  // Prefer downward; flip up only when below is too cramped and above is roomier.
  const flip = below < MIN_LIST && above > below;
  const space = Math.min(MAX_LIST, Math.max(MIN_LIST, flip ? above : below));
  placement.value = {
    flip,
    top: r.bottom + GAP,
    bottom: window.innerHeight - r.top + GAP,
    left: r.left,
    width: r.width,
    space,
  };
}

async function toggle() {
  open.value = !open.value;
  if (!open.value) return;
  query.value = '';
  measure();
  await nextTick();
  if (withSearch.value) searchEl.value?.focus();
}

function choose(opt) {
  emit('update:modelValue', opt);
  open.value = false;
}
function chooseFirst() {
  if (filtered.value.length) choose(filtered.value[0]);
}
function onDocClick(e) {
  if (!open.value) return;
  const inRoot = root.value?.contains(e.target);
  const inMenu = menuEl.value?.contains(e.target);
  if (!inRoot && !inMenu) open.value = false;
}
function onReflow() {
  if (open.value) measure();
}

onMounted(() => {
  document.addEventListener('click', onDocClick);
  // capture: also follow scrolling of an inner container (modal body, table wrap)
  window.addEventListener('scroll', onReflow, true);
  window.addEventListener('resize', onReflow);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('scroll', onReflow, true);
  window.removeEventListener('resize', onReflow);
});
</script>
