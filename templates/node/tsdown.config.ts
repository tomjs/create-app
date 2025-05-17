import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
  const isDev = !!options.watch;

  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node16',
    shims: true,
    clean: true,
    dts: true,
    sourcemap: isDev,
    env: {
      NODE_ENV: isDev ? 'development' : 'production',
    },
  };
});
