import hbuilderx from '@tomjs/vite-plugin-hbuilderx';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import devtools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    assetsInlineLimit: 1024 * 100,
  },
  plugins: [vue(), hbuilderx(), devtools()],
});
