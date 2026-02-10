import { fileURLToPath, URL } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import devtools from 'vite-plugin-vue-devtools';
import manifest from './manifest.config.ts';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
  plugins: [
    vue(),
    AutoImport({
      dts: './src/auto-imports.d.ts',
      imports: ['vue', 'vue-router', '@vueuse/core'],
    }),
    Components({
      dts: './src/components.d.ts',
    }),
    crx({ manifest }),
    UnoCSS(),
    devtools(),
  ],
});
