import path from 'node:path';
import { defineConfig } from 'vite';
import renderer from 'vite-plugin-electron-renderer';
import electron from '@tomjs/vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(() => {
  process.env.APP_BUILD_TIME = Date.now() + '';
  process.env.APP_VERSION = pkg.version;

  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    plugins: [
      vue(),
      electron(),
      // Use Node.js API in the Renderer process
      renderer(),
    ],
    clearScreen: false,
  };
});
