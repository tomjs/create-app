import { defineConfig } from 'tsup';

export default defineConfig(options => {
  return {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: ['es2020', 'node14'],
    external: ['vscode'],
    clean: true,
    splitting: true,
    sourcemap: !!options.watch,
  };
});
