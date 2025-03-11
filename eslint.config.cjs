const eslint = require('@tomjs/eslint');
const react = require('@tomjs/eslint/react');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
  ...eslint.configs.vue,
  ...react.map(s => ({
    ...s,
    ignores: [...eslint.GLOB_EXCLUDE, '**/vscode.ts'],
  })),
];
