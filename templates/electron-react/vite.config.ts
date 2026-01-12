import { fileURLToPath, URL } from 'node:url';
import electron from '@tomjs/vite-plugin-electron';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    renderer(),
    electron(),
  ],
});
