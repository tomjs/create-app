import path from 'node:path';
import electron from '@tomjs/vite-plugin-electron';
import renderer from '@tomjs/vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(() => {
  process.env.APP_BUILD_TIME = Date.now() + '';
  process.env.APP_VERSION = pkg.version;

  return {
    envPrefix: ['VITE_', 'APP_'],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    plugins: [
      react(),
      electron(),
      // Use Node.js API in the Renderer process
      renderer(),
    ],
  };
});
