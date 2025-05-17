import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
  const isDev = !!options.watch;

  return {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node16',
    shims: false,
    clean: true,
    sourcemap: isDev,
    env: {
      NODE_ENV: isDev ? 'development' : 'production',
    },
  };
});
