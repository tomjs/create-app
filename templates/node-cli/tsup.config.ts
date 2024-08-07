import { defineConfig } from 'tsup';

export default defineConfig(options => {
  const isDev = !!options.watch;

  return {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    shims: false,
    clean: true,
    sourcemap: isDev,
    splitting: false,
    env: {
      NODE_ENV: isDev ? 'development' : 'production',
    },
  };
});
