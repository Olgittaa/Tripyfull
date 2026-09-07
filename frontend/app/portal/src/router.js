import { createRouter, createWebHistory } from 'vue-router';
import { api } from '@tripyfull/core';

// Route components are lazy-loaded: each becomes its own chunk, fetched on first
// navigation. Keeps the initial bundle small (see ARCHITECTURE.md).
const routes = [
  { path: '/', redirect: '/trips' },
  { path: '/trips', component: () => import('@/views/TripList.vue'), meta: { requiresAuth: true } },
  {
    path: '/trips/:id',
    component: () => import('@/views/TripDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trips/:tripId/days/:dayId',
    component: () => import('@/views/DayItinerary.vue'),
    meta: { requiresAuth: true },
  },
  {
    // Stable "Itinerary" target for the sidebar: resolves to the trip's first day
    // at click time, so the link never depends on cached day ids.
    path: '/trips/:tripId/itinerary',
    meta: { requiresAuth: true },
    component: () => import('@/views/TripDetail.vue'), // never rendered — the guard always redirects
    beforeEnter: async (to) => {
      try {
        const res = await api.get(`/api/trips/${to.params.tripId}/days`);
        if (res.data.length) {
          return { path: `/trips/${to.params.tripId}/days/${res.data[0].id}`, replace: true };
        }
      } catch {
        /* fall through to the overview */
      }
      return { path: `/trips/${to.params.tripId}`, replace: true };
    },
  },
  {
    path: '/trips/:tripId/places',
    component: () => import('@/views/PlaceLibrary.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trips/:tripId/map',
    component: () => import('@/views/PlanMap.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trips/:tripId/bookings',
    component: () => import('@/views/BookingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trips/:tripId/todos',
    component: () => import('@/views/TodoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trips/:tripId/budget',
    component: () => import('@/views/BudgetView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/places',
    component: () => import('@/views/PlaceLibrary.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    component: () => import('@/views/AccountSettings.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/auth', component: () => import('@/views/Auth.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/auth', query: { redirect: to.fullPath } };
  }
  if (to.path === '/auth' && isAuthenticated) {
    return to.query.redirect || '/trips';
  }
});

export default router;
