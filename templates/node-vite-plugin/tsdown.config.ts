import { defineConfig } from 'tsdown';
import pkg from './package.json';

export default defineConfig((options) => {
  const isDev = !!options.watch;

  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node16',
    external: ['vite'].concat(Object.keys(pkg.dependencies || {})),
    shims: true,
    clean: true,
    dts: true,
    sourcemap: isDev,
  };
});
