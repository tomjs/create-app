import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: 'node14',
    external: ['vscode'],
    clean: true,
    sourcemap: !!options.watch,
  };
});
