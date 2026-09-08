import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { setUnauthorizedHandler, username } from '@tripyfull/core';
import App from './App.vue';
import router from './router';
import { requestSignIn } from './session.js';
import '@tripyfull/ui/styles/main.css';
import 'primeicons/primeicons.css';

/* A 401 on a signed-in account means the session ran out: ask for the password
   over the page the user is on, and the api layer replays what failed. With no
   account known (a cold link, or signed out) there is nothing to restore — the
   auth page it is. */
setUnauthorizedHandler(() => {
  if (username.value) return requestSignIn();
  const currentPath = router.currentRoute.value.fullPath;
  if (currentPath !== '/auth') {
    router.push({ path: '/auth', query: { redirect: currentPath } });
  }
  return false;
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
