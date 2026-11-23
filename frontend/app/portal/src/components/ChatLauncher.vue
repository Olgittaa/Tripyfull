<template>
  <template v-if="chatUrl">
    <!-- The assistant is a separate app (web/), shown in an iframe. It is created on the
         first open and then only hidden, so the conversation survives closing the panel. -->
    <div
      v-if="loaded"
      v-show="open"
      class="chat-panel"
      role="dialog"
      :aria-label="t('chat.title')"
    >
      <iframe ref="frame" :src="chatUrl" :title="t('chat.title')" class="chat-frame"></iframe>
    </div>

    <button
      type="button"
      class="chat-fab"
      :class="{ 'chat-fab--open': open }"
      :aria-label="open ? t('chat.close') : t('chat.open')"
      :aria-expanded="open"
      @click="toggle"
    >
      <TfIcon :name="open ? 'close' : 'auto_awesome'" />
    </button>
  </template>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { t } from '@tripyfull/core';
import { TfIcon } from '@tripyfull/ui';

// No URL configured (e.g. a deploy without the assistant) → no button at all.
const chatUrl = import.meta.env.VITE_CHAT_URL || '';
const chatOrigin = chatUrl ? new URL(chatUrl).origin : '';

const route = useRoute();
const open = ref(false);
const loaded = ref(false);
const frame = ref(null);
// The chat says "ready" once its page has loaded; context sent earlier would be lost.
const chatReady = ref(false);

function toggle() {
  loaded.value = true;
  open.value = !open.value;
  // On every open, so a token renewed by signing in again reaches the chat too.
  if (open.value) sendContext();
}

// Route pattern → the page the chat is told about. The agent gets IDs, never the DOM,
// and looks the data up itself through its tools.
const PAGES = {
  '/trips': 'trip-list',
  '/trips/:id': 'trip-overview',
  '/trips/:tripId/days/:dayId': 'day',
  '/trips/:tripId/places': 'trip-places',
  '/trips/:tripId/map': 'trip-map',
  '/trips/:tripId/bookings': 'bookings',
  '/trips/:tripId/todos': 'todos',
  '/trips/:tripId/budget': 'budget',
  '/places': 'places-library',
  '/settings': 'settings',
};

const pageContext = computed(() => {
  const pattern = route.matched.at(-1)?.path ?? route.path;
  return {
    page: PAGES[pattern] ?? 'other',
    tripId: route.params.tripId ?? route.params.id ?? null,
    dayId: route.params.dayId ?? null,
  };
});

/** Sends the session and the current page to the chat — to its origin only. */
function sendContext() {
  const target = frame.value?.contentWindow;
  if (!chatReady.value || !target) return;
  target.postMessage(
    {
      type: 'tripyfull-chat:context',
      token: localStorage.getItem('token'),
      ...pageContext.value,
    },
    chatOrigin,
  );
}

watch(pageContext, sendContext);

// Messages from the chat iframe. Anything that is not from our chat app — another
// origin, or another window — is ignored: any page can postMessage to this one.
function onMessage(event) {
  if (event.origin !== chatOrigin || event.source !== frame.value?.contentWindow) return;
  if (event.data?.type === 'tripyfull-chat:ready') {
    chatReady.value = true;
    sendContext();
  }
  if (event.data?.type === 'tripyfull-chat:close') open.value = false;
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) open.value = false;
}

onMounted(() => {
  window.addEventListener('message', onMessage);
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
/* Above page content and the phone day dock (75), below drawers (80+) and toasts. */
.chat-fab {
  position: fixed;
  inset-inline-end: var(--space-5);
  bottom: calc(var(--space-5) + env(safe-area-inset-bottom));
  z-index: 78;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--primary);
  color: var(--ink-0);
  font-size: 26px;
  box-shadow: var(--elevation-3);
  cursor: pointer;
  transition:
    background var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}
.chat-fab:hover {
  background: var(--success-700);
  transform: translateY(-1px);
}
.chat-fab:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--input-select-focus-bg),
    var(--elevation-3);
}

.chat-panel {
  position: fixed;
  inset-inline-end: var(--space-5);
  bottom: calc(var(--space-5) + 56px + var(--space-3) + env(safe-area-inset-bottom));
  z-index: 78;
  width: 400px;
  height: min(640px, calc(100dvh - 140px));
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--card);
  box-shadow: var(--elevation-4);
}
.chat-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

/* Phones: the button clears the day dock, the open chat takes the whole screen. */
@media (max-width: 700px) {
  .chat-fab {
    bottom: calc(76px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 560px) {
  .chat-panel {
    inset: 0;
    width: auto;
    height: auto;
    border-radius: 0;
    z-index: 95;
  }
  /* The chat's own header has the close button; the round one would cover its input. */
  .chat-fab--open {
    display: none;
  }
}
</style>
