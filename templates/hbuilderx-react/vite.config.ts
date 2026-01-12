import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import hbuilderx from '@tomjs/vite-plugin-hbuilderx';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // https://github.com/facebook/react/issues/24928#issuecomment-2267624188
      'react': path.resolve(process.cwd(), 'node_modules/react'),
    },
  },
  build: {
    assetsInlineLimit: 1024 * 100,
  },
  plugins: [react(), hbuilderx({ devtools: true })],
});
