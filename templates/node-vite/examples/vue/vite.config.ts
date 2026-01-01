import usePlugin from '@tomjs/vite-plugin-template';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), usePlugin()],
});
