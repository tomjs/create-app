import path from 'node:path';
import { defineConfig } from 'vite';
import vscode from '@tomjs/vite-plugin-vscode';
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
    plugins: [vue(), vscode()],
    clearScreen: false,
  };
});
