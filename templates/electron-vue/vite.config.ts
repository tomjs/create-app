import { fileURLToPath, URL } from 'node:url';
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import devtools from 'vite-plugin-vue-devtools';

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
    renderer(),
    electron({ builder: true }),
    devtools(),
  ],
});
