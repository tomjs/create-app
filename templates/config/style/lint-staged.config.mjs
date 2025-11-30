export default {
  '*.{vue,css,scss,html}': [
    'stylelint --fix',
    'eslint --fix',
  ],
  '*.{js,jsx,cjs,mjs,json,ts,tsx,md}': 'eslint --fix',
};
