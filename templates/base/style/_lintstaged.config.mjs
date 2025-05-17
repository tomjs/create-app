export default {
  '*.{js,cjs,mjs,ts,tsx,json,md}': ['eslint --fix'],
  '*.{css,scss,less,html}': ['stylelint --fix', 'eslint --fix'],
};
