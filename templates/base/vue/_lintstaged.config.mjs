export default {
  '*.{js,cjs,mjs,ts,tsx,json,md,vue}': ['eslint --fix'],
  '*.vue': ['stylelint --fix', 'eslint --fix'],
  '*.{css,scss,less,html}': ['stylelint --fix', 'eslint --fix'],
};
