import { IGNORE_FILES } from '@tomjs/stylelint';

/** @type {import('stylelint').Config} */
export default {
  extends: ['@tomjs/stylelint'],
  ignoreFiles: [...IGNORE_FILES],
};
