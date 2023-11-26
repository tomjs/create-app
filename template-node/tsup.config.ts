import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: ['es2020', 'node16'],
    dts: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: ['es2020', 'node16'],
    dts: true,
    splitting: true,
  },
]);
