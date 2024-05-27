module.exports = {
  '*.{js,cjs,mjs,ts}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  '*.{css,scss,less,html}': ['stylelint --fix', 'prettier --write'],
};
