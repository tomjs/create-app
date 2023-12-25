import { defineConfig } from 'tsup';

export default defineConfig(options => {
  return {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: ['es2022', 'node18'],
    env: {
      VSCODE_DEBUG: process.env.VSCODE_DEBUG! || '',
    },
    shims: true,
    clean: true,
    sourcemap: !!options.watch,
    splitting: true,
  };
});
