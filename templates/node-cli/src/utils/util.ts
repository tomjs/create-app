import type { XxxCLIOptions } from '../types';
import Logger from '@tomjs/logger';

export const logger = new Logger({
  directory: 'xxx/logs',
});

export const isWindows = process.platform === 'win32';

let _opts: XxxCLIOptions = {

};

export function setOptions(opts: XxxCLIOptions) {
  _opts = opts;
}

export function getOptions() {
  return _opts;
}
