import { defineConfig } from '@tomjs/eslint';

export default defineConfig({
  rules: {
    'no-console': 'off',
    'antfu/no-top-level-await': 'off',
    'jsonc/sort-array-values': 'off',
  },
});
