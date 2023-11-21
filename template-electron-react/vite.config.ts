import { rmSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import { notBundle } from 'vite-plugin-electron/plugin';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react-swc';
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  ['main.mjs', 'main.mjs.map', 'preload.mjs'].forEach(s => {
    rmSync(`dist/${s}`, { recursive: true, force: true });
  });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  process.env.APP_BUILD_TIME = Date.now() + '';
  process.env.APP_VERSION = pkg.version;

  return {
    envPrefix: ['VITE_', 'APP_'],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist/render',
      emptyOutDir: true,
    },
    plugins: [
      react(),
      electron([
        {
          // Main process entry file of the Electron App.
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
            } else {
              startup();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist',
              emptyOutDir: false,
              lib: {
                entry: 'electron/main/index.ts',
                formats: ['es'],
                fileName: () => 'main.mjs',
              },
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons,
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
            plugins: [
              // This is just an option to improve build performance, it's non-deterministic!
              // e.g. `import log from 'electron-log'` -> `const log = require('electron-log')`
              isServe && notBundle(),
            ],
          },
        },
        {
          onstart({ reload }) {
            // Notify the Renderer process to reload the page when the Preload scripts build is complete,
            // instead of restarting the entire Electron App.
            reload();
          },
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist',
              emptyOutDir: false,
              lib: {
                entry: 'electron/preload/index.ts',
                formats: ['es'],
                fileName: () => 'preload.mjs',
              },
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
            plugins: [isServe && notBundle()],
          },
        },
      ]),
      // Use Node.js API in the Renderer process
      renderer(),
    ],
    server: process.env.VSCODE_DEBUG
      ? (() => {
          const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
          return {
            host: url.hostname,
            port: +url.port,
          };
        })()
      : {},
    clearScreen: false,
  };
});
