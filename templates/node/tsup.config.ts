import { defineConfig } from 'tsup';

export default defineConfig(options => {
  const isDev = !!options.watch;

  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: ['es2021', 'node16'],
    shims: true,
    clean: true,
    dts: true,
    sourcemap: isDev,
    splitting: false,
    env: {
      NODE_ENV: isDev ? 'development' : 'production',
    },
  };
});
