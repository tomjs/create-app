module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: [require.resolve('@tomjs/eslint/node')],
  rules: {
    'n/no-missing-import': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-unpublished-require': 'off',
    'n/no-process-exit': 'off',
    'n/no-extraneous-require': 'off',
  },
  overrides: [
    {
      files: ['*.vue'],
      extends: [require.resolve('@tomjs/eslint/vue')],
    },
    {
      files: ['*.tsx'],
      extends: [require.resolve('@tomjs/eslint/react')],
    },
  ],
};
