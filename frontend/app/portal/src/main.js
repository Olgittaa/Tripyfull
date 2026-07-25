import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { setUnauthorizedHandler } from '@tripyfull/core';
import App from './App.vue';
import router from './router';
import '@tripyfull/ui/styles/main.css';
import 'primeicons/primeicons.css';

// Wire the core api's 401 reaction to this app's router.
setUnauthorizedHandler(() => {
  const currentPath = router.currentRoute.value.fullPath;
  if (currentPath !== '/auth') {
    router.push({ path: '/auth', query: { redirect: currentPath } });
  }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Lightweight tooltip directive (native title) — replaces PrimeVue's v-tooltip.
app.directive('tooltip', {
  mounted(el, binding) {
    if (binding.value) el.setAttribute('title', binding.value);
  },
  updated(el, binding) {
    if (binding.value) el.setAttribute('title', binding.value);
    else el.removeAttribute('title');
  },
});

app.mount('#app');
