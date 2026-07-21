import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/styleguide' },
  { path: '/styleguide', component: () => import('@/styleguide/StyleGuide.vue') },
  { path: '/components', component: () => import('@/styleguide/BaseComponents.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
