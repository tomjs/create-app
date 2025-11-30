#!/usr/bin/env node
import type { XxxCLIOptions } from './types';
import meow from 'meow';
import { runApp } from './app';
import { getReleaseConfig } from './config';
import { isDev } from './constants';
import { logger, t } from './utils';

const cli = meow(
  `
Usage
  $ xxx [input] [options]

Options
  -d, --dir             ${t('options.dir')}
  -c, --config          ${t('options.config')}
  --verbose             ${t('options.verbose')}
  -h, --help            ${t('options.help')}
  -v, --version         ${t('options.version')}
`,
  {
    importMeta: import.meta,
    booleanDefault: undefined,
    helpIndent: 0,
    flags: {
      dir: {
        type: 'string',
        shortFlag: 'd',
      },
      config: {
        type: 'string',
        shortFlag: 'c',
      },
      verbose: {
        type: 'boolean',
        default: process.env.NODE_ENV === 'development',
      },
      help: {
        type: 'boolean',
        shortFlag: 'h',
        default: false,
      },
      version: {
        type: 'boolean',
        shortFlag: 'v',
        default: false,
      },
    },
  },
);

const { input, flags } = cli;
if (flags.help) {
  cli.showHelp(0);
}
else if (flags.version) {
  cli.showVersion();
}
else {
  logger.enableDebug(flags.verbose);
  logger.debug('input:', input);
  logger.debug('cli options:', flags);

  const config = await getReleaseConfig(flags);
  logger.debug('config file:', config);

  const mergedOpts = Object.assign(
    {
      verbose: isDev,
    } as XxxCLIOptions,
    config,
    flags,
  ) as XxxCLIOptions;

  mergedOpts.dir ||= process.cwd();
  logger.debug('merged options:', mergedOpts);

  await runApp(mergedOpts);
}
