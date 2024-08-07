module.exports = {
  '*.{js,cjs,mjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
  '*.vue': ['eslint --fix', 'stylelint --fix', 'prettier --write'],
  '*.{css,scss,less,html}': ['stylelint --fix', 'prettier --write'],
};
