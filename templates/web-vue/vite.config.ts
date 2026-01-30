import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import devtools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
    UnoCSS(),
    devtools(),
  ],
});
