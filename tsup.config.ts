import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: ['es2022', 'node18'],
  clean: true,
  sourcemap: false,
  splitting: true,
});
