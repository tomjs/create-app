import { defineConfig } from 'tsup';

export default defineConfig(options => {
  return {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: 'node14',
    external: ['vscode'],
    clean: true,
    splitting: true,
    sourcemap: !!options.watch,
  };
});
