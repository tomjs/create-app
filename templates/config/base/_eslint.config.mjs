import defineConfig from '@tomjs/eslint';

export default defineConfig({
  rules: {
    'antfu/no-top-level-await': 'off',
    'jsonc/sort-array-values': 'off',
  },
});
