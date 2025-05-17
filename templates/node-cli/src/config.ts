import type { XxxCLIOptions } from './types.js';
import fs from 'node:fs';
import { cosmiconfig } from 'cosmiconfig';

export async function getReleaseConfig(opts: XxxCLIOptions) {
  const explorer = cosmiconfig('xxx', {
    stopDir: opts.cwd,
    searchPlaces: [
      'package.json',
      'xxx.config.json',
      'xxx.config.js',
      'xxx.config.mjs',
      'xxx.config.cjs',
    ],
  });

  if (opts.config) {
    if (!fs.existsSync(opts.config)) {
      return {};
    }

    const result = await explorer.load(opts.config);
    return result?.config || {};
  }

  const result = await explorer.search();
  return result?.config || {};
}
