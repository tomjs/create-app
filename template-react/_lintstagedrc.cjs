module.exports = {
  '*.{js,cjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  '*.{css,scss,less,html}': ['stylelint --fix', 'prettier --write'],
};
