import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import manifest from './manifest.config.js';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // https://github.com/facebook/react/issues/24928#issuecomment-2267624188
      'react': path.resolve(process.cwd(), 'node_modules/react'),
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
    react(),
    crx({ manifest }),
  ],
});
