import { fileURLToPath, URL } from 'node:url';
import vscode from '@tomjs/vite-plugin-vscode';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

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
      react(),
      vscode(),
    ],
  };
});
