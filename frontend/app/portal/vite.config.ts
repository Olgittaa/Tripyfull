import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  // env files (VITE_API_URL) live at the frontend monorepo root
  envDir: fileURLToPath(new URL('../../', import.meta.url)),
  resolve: {
    alias: {
      // "@/..." -> this app's src. Cross-package code imports "@tripyfull/ui" / "@tripyfull/core".
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
