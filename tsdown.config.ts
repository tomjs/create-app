import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    format: 'esm',
    target: 'node18',
    env: {
      NODE_ENV: options.watch ? 'development' : 'production',
    },
    shims: true,
    clean: true,
    sourcemap: !!options.watch,
    ignoreWatch: ['**/node_modules/**', '.history'],
  };
});
