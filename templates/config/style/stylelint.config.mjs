import { IGNORE_FILES } from '@tomjs/stylelint-config';

/** @type {import('stylelint').Config} */
export default {
  extends: ['@tomjs/stylelint-config'],
  ignoreFiles: [...IGNORE_FILES],
};
