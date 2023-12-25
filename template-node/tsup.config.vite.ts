import { defineConfig } from 'tsup';

export default defineConfig(options => {
  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: ['es2021', 'node16'],
    external: ['vite'],
    shims: true,
    clean: true,
    sourcemap: !!options.watch,
    dts: true,
    splitting: true,
  };
});
