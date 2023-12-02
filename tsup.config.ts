import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: ['es2022', 'node18'],
  clean: true,
  splitting: true,
});
