import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: ['es2022', 'node18'],
  clean: true,
  dts: true,
  sourcemap: false,
  splitting: true,
});
