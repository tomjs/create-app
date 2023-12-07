module.exports = {
  extends: [require.resolve('@tomjs/stylelint')],
  overrides: [
    {
      files: ['{template-vue,template-electron-vue}/**/*.{less,scss,css,vue}'],
      extends: [require.resolve('@tomjs/stylelint/vue')],
    },
  ],
};
