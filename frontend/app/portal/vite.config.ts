import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // "@/..." -> this app's src. Cross-package code imports "@tripyfull/ui" / "@tripyfull/core".
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
