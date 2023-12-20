import path from 'node:path';
import { defineConfig } from 'vite';
import vscode from '@tomjs/vite-plugin-vscode';
import react from '@vitejs/plugin-react-swc';
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
    plugins: [react(), vscode()],
    clearScreen: false,
  };
});
