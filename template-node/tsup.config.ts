import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: ['es2022', 'node18'],
    dts: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: ['es2022', 'node18'],
    dts: true,
  },
]);
