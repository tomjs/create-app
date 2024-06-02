import path from 'node:path';
import { readJsonSync } from '@tomjs/node';
import cac from 'cac';
import { getReleaseConfig } from './config';
import type { XxxCLIOptions } from './types';
import { logger } from './utils';

let version: string = '';
try {
  const pkg = readJsonSync(path.join(__dirname, '../package.json')) || {};
  version = pkg.version;
} catch (e) {
  console.error(e);
}

const cli = cac('xxx').option('--verbose', 'Display verbose output', {
  default: process.env.NODE_ENV === 'development',
});

// cmd
cli.command('[cwd]', 'Do something').action(async (input: string, flags: XxxCLIOptions) => {
  logger.enableDebug(true);
  console.log(input, flags);

  const cliOpts = Object.assign({}, flags);
  console.log('cli options:', cliOpts);

  const config = await getReleaseConfig(flags);
  console.log('config file:', config);

  const mergedOpts = Object.assign(
    {
      verbose: process.env.NODE_ENV === 'development',
    } as XxxCLIOptions,
    config,
    cliOpts,
  ) as XxxCLIOptions;

  mergedOpts.cwd ||= process.cwd();
  console.log('merged options:', mergedOpts);
});

cli.help();
cli.version(version);
cli.parse();
