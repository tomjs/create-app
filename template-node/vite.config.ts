import fs from 'node:fs';
import { builtinModules } from 'node:module';
import { defineConfig, type PluginOption } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

const isDev = process.argv.includes('--watch');

const plugins: PluginOption[] = [];
if (!isDev) {
  plugins.push(
    dts({
      rollupTypes: true,
      afterBuild: () => {
        fs.copyFileSync('dist/index.d.ts', 'dist/index.d.mts');
      },
    }),
  );
}

export default defineConfig({
  build: {
    target: ['es2021', 'node16'],
    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    minify: false,
    sourcemap: isDev,
    rollupOptions: {
      output: {
        exports: 'named',
      },
      external: ['vite']
        .concat(builtinModules)
        .concat(builtinModules.map(s => `node:${s}`))
        .concat(Object.keys(pkg.dependencies)),
    },
  },
  plugins,
});
