import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@tripyfull/ui/styles/main.css';
import 'primeicons/primeicons.css';

createApp(App).use(router).mount('#app');
