<template>
  <TfToastHost />
  <TfConfirmHost />

  <!-- Auth page renders without sidebar -->
  <template v-if="!username">
    <router-view />
  </template>

  <!-- Main app with sidebar -->
  <div v-else class="app-shell">
    <aside class="app-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo" @click="goHome">
        <span class="sidebar-logo-text">Tripy<span>full</span></span>
      </div>

      <!-- All trips button -->
      <div class="sidebar-section">
        <router-link to="/trips" class="sidebar-nav-btn" :class="{ active: !currentTrip }">
          <TfIcon name="map" style="font-size: 20px" /> All trips
        </router-link>
      </div>

      <!-- Trip context nav -->
      <template v-if="currentTrip">
        <div class="sidebar-trip-info">
          <div class="sidebar-trip-label">Trip</div>
          <div class="sidebar-trip-name">{{ currentTrip.title }}</div>
          <div class="sidebar-trip-meta">
            {{ currentTrip.destination || ''
            }}{{ currentTrip.destination && currentTrip.startDate ? ' · ' : ''
            }}{{
              currentTrip.startDate
                ? formatDateRange(currentTrip.startDate, currentTrip.endDate)
                : ''
            }}
          </div>
        </div>
        <nav class="sidebar-trip-nav">
          <router-link
            :to="`/trips/${currentTrip.id}`"
            class="sidebar-nav-btn"
            :class="{ 'active-filled': isExactRoute(`/trips/${currentTrip.id}`) }"
          >
            <TfIcon name="dashboard" style="font-size: 20px" /> Overview
          </router-link>
          <router-link
            :to="`/trips/${currentTrip.id}/itinerary`"
            class="sidebar-nav-btn"
            :class="{ 'active-filled': $route.path.includes('/days/') }"
          >
            <TfIcon name="route" style="font-size: 20px" /> Itinerary
          </router-link>
          <router-link
            :to="`/trips/${currentTrip.id}/bookings`"
            class="sidebar-nav-btn"
            :class="{ 'active-filled': $route.path.includes('/bookings') }"
          >
            <TfIcon name="confirmation_number" style="font-size: 20px" /> Bookings
          </router-link>
          <router-link
            :to="`/trips/${currentTrip.id}/budget`"
            class="sidebar-nav-btn"
            :class="{ 'active-filled': $route.path.includes('/budget') }"
          >
            <TfIcon name="account_balance_wallet" style="font-size: 20px" /> Budget
          </router-link>
        </nav>
      </template>

      <!-- Places link -->
      <div class="sidebar-section" style="margin-top: 8px">
        <router-link
          to="/places"
          class="sidebar-nav-btn"
          :class="{ active: $route.path === '/places' }"
        >
          <TfIcon name="place" style="font-size: 20px" /> Places
        </router-link>
      </div>

      <!-- User -->
      <div class="sidebar-user">
        <TfAvatar :name="username" size="sm" />
        <div style="min-width: 0; line-height: 1.25; flex: 1">
          <div class="sidebar-user-name">{{ username }}</div>
          <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px">
            <router-link to="/settings" class="sidebar-user-sub" style="text-decoration: none"
              >Settings</router-link
            >
            <span style="color: var(--border-default)">·</span>
            <span class="sidebar-user-sub" @click="logout">Sign out</span>
          </div>
        </div>
        <span
          style="
            font: var(--fw-medium) 11px/1 var(--font-mono);
            color: var(--text-secondary);
            background: var(--surface);
            padding: 3px 8px;
            border-radius: var(--radius-pill);
          "
          >{{ baseCurrency }}</span
        >
      </div>
    </aside>

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { username, baseCurrency, clearAuth } from '@tripyfull/core';
import { useTripStore } from '@/stores/tripStore.js';
import { TfAvatar, TfIcon, TfToastHost, TfConfirmHost } from '@tripyfull/ui';

const router = useRouter();
const route = useRoute();
const store = useTripStore();

const lastTripId = ref(null);
const sidebarTrip = ref(null);

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

const formatDateRange = (start, end) => {
  const fmt = (d) => {
    const dt = new Date(d);
    const day = dt.getDate();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${day} ${months[dt.getMonth()]}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

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
