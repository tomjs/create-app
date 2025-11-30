import type { CreateAppOptions } from '../types';
import Logger from '@tomjs/logger';

export const logger = new Logger({
  directory: 'create-app/logs',
});

export const isWindows = process.platform === 'win32';

let _opts: CreateAppOptions = {

};

export function setOptions(opts: CreateAppOptions) {
  _opts = opts;
}

export function getOptions() {
  return _opts;
}
