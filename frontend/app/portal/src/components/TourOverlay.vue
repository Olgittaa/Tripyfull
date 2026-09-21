<template>
  <teleport to="body">
    <div v-if="modelValue && current" class="tour">
      <!-- The page is read, not used, while the tour runs: the shade swallows
           clicks so a stray one cannot navigate out from under the callout. -->
      <div class="tour-shade" @click.self=""></div>
      <div v-if="spot" class="tour-spot" :style="spotStyle"></div>

      <div v-if="!resolving" class="tour-card" :style="cardStyle">
        <div class="tour-head">
          <span class="tour-count">{{
            t('guide.step', { n: index + 1, total: steps.length })
          }}</span>
          <button type="button" class="tour-skip" @click="finish">{{ t('guide.skip') }}</button>
        </div>
        <h4 class="tour-title">{{ current.title }}</h4>
        <p class="tour-body">{{ current.body }}</p>
        <div class="tour-dots">
          <span
            v-for="(s, i) in steps"
            :key="s.key"
            class="tour-dot"
            :class="{ 'tour-dot--on': i === index }"
          ></span>
        </div>
        <div class="tour-foot">
          <TfButton variant="ghost" size="sm" :disabled="index === 0" @click="go(index - 1)">
            {{ t('guide.back') }}
          </TfButton>
          <TfButton variant="primary" size="sm" @click="next">
            {{ index === steps.length - 1 ? t('guide.done') : t('guide.next') }}
          </TfButton>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { t } from '@tripyfull/core';
import { TfButton } from '@tripyfull/ui';
import { useTripStore } from '@/stores/tripStore.js';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);

const router = useRouter();
const store = useTripStore();

/* A step is a place in the app plus the thing it points at. `trip` marks the
   ones that need a trip to exist; on an empty account they drop out and the
   tour is the three that stand on their own. */
const PLAN = [
  { key: 1, tour: 'trip-actions', path: () => '/trips' },
  { key: 2, tour: 'place-actions', path: () => '/places' },
  { key: 3, tour: 'day-strip', trip: true, path: (id) => `/trips/${id}/itinerary` },
  { key: 4, tour: 'booking-actions', trip: true, path: (id) => `/trips/${id}/bookings` },
  { key: 5, tour: 'todo-actions', trip: true, path: (id) => `/trips/${id}/todos` },
  { key: 6, tour: 'budget-hero', trip: true, path: (id) => `/trips/${id}/budget` },
  { key: 7, tour: 'map-legend', trip: true, path: (id) => `/trips/${id}/map` },
  { key: 8, tour: 'trip-head-actions', trip: true, path: (id) => `/trips/${id}` },
  { key: 9, tour: 'lang', path: () => null },
];

const tripId = computed(() => store.trips[0]?.id || null);

/* A step names the buttons it points at. Taking those names from the very keys
   that label the buttons is the only way they cannot drift apart — spelling
   them out again inside the sentence is how a German word ended up in the
   Russian text. */
const labels = () => ({
  new: t('trips.new'),
  import: t('trips.import'),
  all: t('nav.allPlaces'),
  find: t('places.findImport'),
  itinerary: t('nav.itinerary'),
  update: t('bookings.updatePlan'),
  suggestions: t('todo.suggestions'),
  planned: t('map.plannedOnly'),
  print: t('overview.print'),
  export: t('overview.export'),
});

const steps = computed(() => {
  const names = labels();
  return PLAN.filter((s) => !s.trip || tripId.value).map((s) => ({
    ...s,
    title: t(`guide.s${s.key}.title`),
    body: t(`guide.s${s.key}.body`, names),
  }));
});

const index = ref(0);
const current = computed(() => steps.value[index.value] || null);
const spot = ref(null);
/* While a step is being set up — the route changes, the view mounts, the page
   scrolls — the card stays away rather than appear in the middle and then jump
   to the element. The shade alone says the tour is still there. */
const resolving = ref(false);

/** Waits for the step's element to exist — a route change mounts it late. */
const findTarget = async (name, tries = 30) => {
  for (let i = 0; i < tries; i++) {
    const el = document.querySelector(`[data-tour="${name}"]`);
    if (el && el.getBoundingClientRect().width) return el;
    await new Promise((r) => setTimeout(r, 60));
  }
  return null;
};

const PAD = 8;
const measure = (el) => {
  const r = el.getBoundingClientRect();
  spot.value = {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
};

let target = null;
// Clicking Next twice quickly would otherwise leave two set-ups racing, and
// the slower one would place the card against the wrong element.
let run = 0;
const show = async () => {
  const mine = ++run;
  spot.value = null;
  target = null;
  resolving.value = true;
  try {
    const step = current.value;
    if (!step) return;
    const path = step.path(tripId.value);
    if (path && router.currentRoute.value.path !== path) {
      await router.push(path).catch(() => {});
    }
    if (mine !== run) return;
    const el = await findTarget(step.tour);
    if (mine !== run) return;
    if (!el) return; // the card still stands, centred, with its words
    target = el;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await new Promise((r) => setTimeout(r, 320));
    if (mine !== run) return;
    measure(el);
  } finally {
    if (mine === run) resolving.value = false;
  }
};

const go = (i) => {
  index.value = Math.max(0, Math.min(steps.value.length - 1, i));
  show();
};
const next = () => (index.value === steps.value.length - 1 ? finish() : go(index.value + 1));
const finish = () => emit('update:modelValue', false);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      index.value = 0;
      show();
    } else {
      run++;
      spot.value = null;
      target = null;
      resolving.value = false;
    }
  },
);

/* The shell scrolls an inner pane, so the listener has to capture. */
const reposition = () => target && measure(target);
window.addEventListener('resize', reposition);
window.addEventListener('scroll', reposition, true);
onBeforeUnmount(() => {
  window.removeEventListener('resize', reposition);
  window.removeEventListener('scroll', reposition, true);
});

const spotStyle = computed(() =>
  spot.value
    ? {
        top: `${spot.value.top}px`,
        left: `${spot.value.left}px`,
        width: `${spot.value.width}px`,
        height: `${spot.value.height}px`,
      }
    : {},
);

/* Below the highlight where there is room, above it where there is not, and
   always inside the window. Without a highlight the card sits in the middle. */
const CARD = { w: 340, h: 230 };
const cardStyle = computed(() => {
  const s = spot.value;
  if (!s) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = s.top + s.height + 12;
  const top = below + CARD.h < vh ? below : Math.max(12, s.top - CARD.h - 12);
  const left = Math.min(Math.max(12, s.left), Math.max(12, vw - CARD.w - 12));
  return { top: `${top}px`, left: `${left}px` };
});
</script>
