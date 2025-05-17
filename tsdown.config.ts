import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    env: {
      CA_CWD: process.env.CA_CWD! || '',
    },
    shims: true,
    clean: true,
    sourcemap: !!options.watch,
  };
});
