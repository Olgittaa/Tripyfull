<template>
  <TfToastHost />
  <TfConfirmHost />
  <SessionExpiredDialog />

  <!-- Auth page renders without sidebar -->
  <template v-if="!username">
    <router-view />
  </template>

  <!-- Main app with sidebar -->
  <div v-else class="app-shell">
    <!-- Full-width top bar: logo + global nav -->
    <header class="app-topbar">
      <!-- Phones only (CSS): the trip's menu lives behind this button. -->
      <button
        v-if="currentTrip"
        type="button"
        class="topbar-menu-btn"
        aria-label="Trip menu"
        @click="showTripMenu = true"
      >
        <i class="pi pi-bars"></i>
      </button>
      <div class="topbar-logo" @click="goHome">
        <img :src="logoMark" alt="" />
        <span class="sidebar-logo-text">Tripy<span>full</span></span>
      </div>

      <nav class="topbar-nav">
        <router-link to="/trips" class="topbar-link" :class="{ active: $route.path === '/trips' }">
          <TfIcon name="map" style="font-size: 18px" /> <span class="topbar-label">All trips</span>
        </router-link>
        <router-link
          to="/places"
          class="topbar-link"
          :class="{ active: $route.path === '/places' }"
        >
          <TfIcon name="place" style="font-size: 18px" />
          <span class="topbar-label">All places</span>
        </router-link>

        <TfPopover position="bottom-end">
          <span class="topbar-user">
            <span class="topbar-user-cur">{{ baseCurrency }}</span>
            <TfAvatar :name="username" size="sm" />
          </span>
          <template #content>
            <div class="topbar-menu">
              <div class="topbar-user-name" style="padding: 10px 12px 8px">{{ username }}</div>
              <router-link to="/settings" class="topbar-link">
                <i class="pi pi-cog" style="font-size: 13px"></i> Settings
              </router-link>
              <button type="button" class="topbar-link" @click="logout">
                <i class="pi pi-sign-out" style="font-size: 13px"></i> Sign out
              </button>
            </div>
          </template>
        </TfPopover>
      </nav>
    </header>

    <div class="app-body">
      <aside class="app-sidebar">
        <!-- Trip context nav (global nav lives in the top bar) -->
        <template v-if="currentTrip">
          <div class="sidebar-trip-info">
            <div class="sidebar-trip-name">{{ currentTrip.title }}</div>
            <div v-if="currentTrip.destination" class="sidebar-trip-meta">
              <i class="pi pi-map-marker"></i> {{ currentTrip.destination }}
            </div>
            <div v-if="currentTrip.startDate" class="sidebar-trip-meta">
              <i class="pi pi-calendar"></i>
              {{ formatDateRange(currentTrip.startDate, currentTrip.endDate) }}
            </div>
          </div>
          <TripNav :tripId="currentTrip.id" />
        </template>

        <p v-else class="sidebar-caption" style="padding-top: 12px">
          Pick a trip to see its menu here.
        </p>
      </aside>

      <!-- Phone menu: the trip's own sections, opened from the top bar. -->
      <TfDrawer v-model="showTripMenu" position="left" width="narrow">
        <template #header>
          <div>
            <div class="sidebar-trip-name">{{ currentTrip?.title }}</div>
            <div v-if="currentTrip?.destination" class="sidebar-trip-meta">
              <i class="pi pi-map-marker"></i> {{ currentTrip.destination }}
            </div>
            <div v-if="currentTrip?.startDate" class="sidebar-trip-meta">
              <i class="pi pi-calendar"></i>
              {{ formatDateRange(currentTrip.startDate, currentTrip.endDate) }}
            </div>
          </div>
        </template>
        <TripNav v-if="currentTrip" :tripId="currentTrip.id" @navigate="showTripMenu = false" />
      </TfDrawer>

      <main class="app-main">
        <div class="app-content">
          <router-view v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { username, baseCurrency, clearAuth, formatDateRange } from '@tripyfull/core';
import { useTripStore } from '@/stores/tripStore.js';
import { TfAvatar, TfIcon, TfPopover, TfToastHost, TfConfirmHost, TfDrawer } from '@tripyfull/ui';
import TripNav from '@/components/TripNav.vue';
import SessionExpiredDialog from '@/components/SessionExpiredDialog.vue';
import { watchSessionExpiry } from '@/session.js';
import logoMark from '@/assets/logo-mark.svg';

const router = useRouter();
const route = useRoute();
const store = useTripStore();

const lastTripId = ref(null);
const sidebarTrip = ref(null);

// Ask for a new sign-in the moment the token expires, not on the next request.
onMounted(watchSessionExpiry);

/* The trip menu on a phone. Any navigation closes it — including a tap on the
   section you are already in. */
const showTripMenu = ref(false);
watch(
  () => route.fullPath,
  () => (showTripMenu.value = false),
);

const logout = () => {
  clearAuth();
  router.push('/auth');
};
const goHome = () => {
  lastTripId.value = null;
  sidebarTrip.value = null;
  router.push('/trips');
};

// Track trip ID from route; keep it when navigating to non-trip pages like /places
const activeTripId = computed(() => {
  const fromRoute = route.params.id || route.params.tripId;
  return fromRoute || lastTripId.value;
});

watch(
  () => route.params.id || route.params.tripId,
  (id) => {
    if (id) lastTripId.value = id;
  },
);

const currentTrip = computed(() => {
  const tripId = activeTripId.value;
  if (!tripId) return null;
  if (route.path === '/trips') return null;
  // Try store first, then fall back to separately fetched trip
  return store.currentTrip?.id === tripId
    ? store.currentTrip
    : store.trips.find((t) => t.id === tripId) ||
        (sidebarTrip.value?.id === tripId ? sidebarTrip.value : null);
});

const isExactRoute = (path) => route.path === path;

// When trip ID changes, make sure the sidebar has the trip's data
// (the Itinerary link resolves its target day at click time via /itinerary).
watch(
  activeTripId,
  async (tripId) => {
    if (!tripId || route.path === '/trips') return;
    // Fetch trip if not in store yet (e.g. after page refresh)
    if (store.currentTrip?.id !== tripId && !store.trips.find((t) => t.id === tripId)) {
      try {
        sidebarTrip.value = await store.fetchById(tripId);
      } catch {
        // ignore
      }
    }
  },
  { immediate: true },
);
</script>
