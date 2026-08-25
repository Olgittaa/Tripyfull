<template>
  <div class="field" ref="root">
    <label v-if="label" class="label">{{ label }}</label>
    <div class="select" :class="{ 'is-open': open }">
      <button type="button" class="select-trigger" :disabled="disabled" @click="open = !open">
        <span class="select-prefix"><i class="pi pi-calendar" /></span>
        <span class="select-value" :class="{ 'is-placeholder': !hasValue }">{{ displayText }}</span>
        <i class="pi pi-chevron-down select-chevron" />
      </button>
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="dp-clear"
        aria-label="Clear date"
        @click.stop="clearValue"
      >
        <i class="pi pi-times" />
      </button>

      <div v-if="open" class="dp-pop">
        <div class="dp-cal">
          <div class="dp-head">
            <button
              type="button"
              class="btn btn--secondary btn--icon btn--sm"
              @click="pickMode ? shiftYear(-1) : shiftMonth(-1)"
            >
              <i class="pi pi-chevron-left" />
            </button>
            <button type="button" class="dp-title" @click="pickMode = !pickMode">
              {{ pickMode ? view.getFullYear() : title }}
              <i class="pi pi-chevron-down dp-title-caret" />
            </button>
            <button
              type="button"
              class="btn btn--secondary btn--icon btn--sm"
              @click="pickMode ? shiftYear(1) : shiftMonth(1)"
            >
              <i class="pi pi-chevron-right" />
            </button>
          </div>

          <div v-if="pickMode" class="dp-months">
            <button
              v-for="(mo, mi) in MONTHS"
              :key="mo"
              type="button"
              class="dp-month"
              :class="{ 'dp-month--on': mi === view.getMonth() }"
              @click="chooseMonth(mi)"
            >
              {{ mo }}
            </button>
          </div>

          <div v-else class="dp-grid">
            <div
              v-for="(wd, i) in weekdays"
              :key="wd"
              class="dp-wd"
              :class="{ 'dp-wd--weekend': i > 4 }"
            >
              {{ wd }}
            </div>
            <button
              v-for="d in grid"
              :key="d.key"
              type="button"
              class="dp-day"
              :class="dayClass(d.date)"
              :disabled="isDayDisabled(d.date)"
              @click="pickDay(d.date)"
            >
              <span class="dp-day-inner">{{ d.date.getDate() }}</span>
            </button>
          </div>

          <div v-if="isRange && rangeDays" class="dp-foot">{{ rangeDays }} days</div>
        </div>

        <!-- time -->
        <div v-if="hasTime" class="dp-time">
          <template v-if="isRange">
            <div v-for="grp in ['start', 'end']" :key="grp" class="dp-time-group">
              <div class="dp-time-label">{{ grp === 'start' ? 'Start' : 'End' }}</div>
              <TfTimeWheel :model-value="timeOf(grp)" @update="(h, m) => setTime(grp, h, m)" />
            </div>
          </template>

          <TfTimeWheel v-else :model-value="single" @update="(h, m) => setTime('single', h, m)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { MONTHS_SHORT } from '@tripyfull/core';
import TfTimeWheel from './TfTimeWheel.vue';

const props = defineProps({
  // 'date' | 'datetime' | 'range' | 'datetime-range'
  mode: { type: String, default: 'date' },
  modelValue: { default: null },
  label: String,
  disabled: Boolean,
  // Selectable window (inclusive, day granularity). Days outside are disabled.
  min: { type: Date, default: null },
  max: { type: Date, default: null },
  // Show an × in the trigger that resets the value to null.
  clearable: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = MONTHS_SHORT;

const isRange = computed(() => props.mode.includes('range'));
const hasTime = computed(() => props.mode.includes('datetime'));

const single = computed(() => (isRange.value ? null : props.modelValue || null));
const startDate = computed(() => (isRange.value ? props.modelValue?.[0] || null : null));
const endDate = computed(() => (isRange.value ? props.modelValue?.[1] || null : null));
const timeOf = (grp) => (grp === 'start' ? startDate.value : endDate.value);

const hasValue = computed(() =>
  isRange.value ? !!(startDate.value || endDate.value) : !!single.value,
);

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtOne = (d) => (hasTime.value ? `${fmtDate(d)} ${fmtTime(d)}` : fmtDate(d));

const placeholder = computed(() => {
  const one = hasTime.value ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY';
  return isRange.value ? `${one} - ${one}` : one;
});
const displayText = computed(() => {
  if (!hasValue.value) return placeholder.value;
  if (isRange.value) {
    const s = startDate.value ? fmtOne(startDate.value) : '…';
    const e = endDate.value ? fmtOne(endDate.value) : '…';
    return `${s} - ${e}`;
  }
  return fmtOne(single.value);
});

/* calendar view */
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const view = ref(startOfMonth(startDate.value || single.value || new Date()));
const title = computed(() => `${MONTHS[view.value.getMonth()]} ${view.value.getFullYear()}`);

const grid = computed(() => {
  const first = startOfMonth(view.value);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const start = new Date(first);
  start.setDate(1 - offset);
  const out = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    out.push({ date, key: date.toISOString().slice(0, 10) });
  }
  return out;
});
function shiftMonth(dir) {
  view.value = new Date(view.value.getFullYear(), view.value.getMonth() + dir, 1);
}
const pickMode = ref(false);
function shiftYear(dir) {
  view.value = new Date(view.value.getFullYear() + dir, view.value.getMonth(), 1);
}
function chooseMonth(mi) {
  view.value = new Date(view.value.getFullYear(), mi, 1);
  pickMode.value = false;
}

const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const isDayDisabled = (date) =>
  (props.min && dayStart(date) < dayStart(props.min)) ||
  (props.max && dayStart(date) > dayStart(props.max));

function dayClass(date) {
  const cls = [];
  if (date.getMonth() !== view.value.getMonth()) cls.push('dp-day--muted');
  if (isRange.value) {
    const s = startDate.value;
    const e = endDate.value;
    if (s && e) {
      if (sameDay(date, s) && sameDay(date, e)) cls.push('dp-day--selected');
      else if (sameDay(date, s)) cls.push('dp-day--start');
      else if (sameDay(date, e)) cls.push('dp-day--end');
      else if (dayStart(date) > dayStart(s) && dayStart(date) < dayStart(e))
        cls.push('dp-day--in-range');
    } else if (s && sameDay(date, s)) {
      cls.push('dp-day--selected');
    }
  } else if (sameDay(date, single.value)) {
    cls.push('dp-day--selected');
  }
  return cls;
}

/* selection */
function withTime(base, ref_) {
  const d = new Date(base);
  if (hasTime.value && ref_) d.setHours(ref_.getHours(), ref_.getMinutes(), 0, 0);
  else d.setHours(0, 0, 0, 0);
  return d;
}
function clearValue() {
  emit('update:modelValue', null);
  open.value = false;
}

function pickDay(date) {
  if (isDayDisabled(date)) return;
  if (!isRange.value) {
    emit('update:modelValue', withTime(date, single.value));
    if (!hasTime.value) open.value = false;
    return;
  }
  const s = startDate.value;
  const e = endDate.value;
  if (!s || (s && e)) {
    emit('update:modelValue', [withTime(date, s), null]);
  } else {
    const before = dayStart(date) < dayStart(s);
    const a = before ? date : s;
    const b = before ? s : date;
    emit('update:modelValue', [withTime(a, s), withTime(b, e)]);
    if (!hasTime.value) open.value = false;
  }
}
function setTime(which, hIn, mIn) {
  const apply = (d) => {
    const base = d ? new Date(d) : new Date();
    if (hIn != null) base.setHours(hIn);
    if (mIn != null) base.setMinutes(mIn);
    base.setSeconds(0, 0);
    return base;
  };
  if (which === 'single') emit('update:modelValue', apply(single.value));
  else if (which === 'start') emit('update:modelValue', [apply(startDate.value), endDate.value]);
  else emit('update:modelValue', [startDate.value, apply(endDate.value)]);
}

const rangeDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0;
  return Math.round((dayStart(endDate.value) - dayStart(startDate.value)) / 86400000) + 1;
});

/* open / outside click */
const root = ref(null);
const open = ref(false);
function onDoc(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}
watch(open, (v) => {
  if (!v) {
    pickMode.value = false;
  } else {
    // Re-sync the calendar month with the current value — it may have been
    // set (or changed) after mount, e.g. when an edit drawer fills the form.
    const anchor = startDate.value || single.value;
    if (anchor) view.value = startOfMonth(anchor);
  }
});
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>
