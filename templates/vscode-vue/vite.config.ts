import { fileURLToPath, URL } from 'node:url';
import vscode from '@tomjs/vite-plugin-vscode';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import devtools from 'vite-plugin-vue-devtools';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 102400,
      reportCompressedSize: false,
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag.startsWith('vscode-'),
          },
        },
      }),
      AutoImport({
        dts: './src/auto-imports.d.ts',
        imports: ['vue', '@vueuse/core'],
      }),
      Components({
        dts: './src/components.d.ts',
      }),
      UnoCSS(),
      vscode(),
      devtools(),
    ],
  };
});
