import { createRouter, createWebHistory } from 'vue-router';
import TripList from './components/TripList.vue';
import TripDetail from './components/TripDetail.vue';
import DayItinerary from './components/DayItinerary.vue';
import BookingsView from './components/BookingsView.vue';
import BudgetView from './components/BudgetView.vue';
import PlaceLibrary from './components/PlaceLibrary.vue';
import StyleGuide from './components/styleguide/StyleGuide.vue';
import BaseComponents from './components/styleguide/BaseComponents.vue';
import AccountSettings from './components/AccountSettings.vue';
import Auth from './components/Auth.vue';

const routes = [
  { path: '/', redirect: '/trips' },
  { path: '/trips', component: TripList, meta: { requiresAuth: true } },
  { path: '/trips/:id', component: TripDetail, meta: { requiresAuth: true } },
  { path: '/trips/:tripId/days/:dayId', component: DayItinerary, meta: { requiresAuth: true } },
  { path: '/trips/:tripId/bookings', component: BookingsView, meta: { requiresAuth: true } },
  { path: '/trips/:tripId/budget', component: BudgetView, meta: { requiresAuth: true } },
  { path: '/places', component: PlaceLibrary, meta: { requiresAuth: true } },
  { path: '/settings', component: AccountSettings, meta: { requiresAuth: true } },
  { path: '/styleguide', component: StyleGuide },
  { path: '/components', component: BaseComponents },
  { path: '/auth', component: Auth },
];

const router = createRouter({
  history: createWebHistory(),
  routes
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
