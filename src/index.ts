import type { CreateAppOptions } from './types';
import meow from 'meow';
import { createApp } from './app';
import { logger, t } from './utils';

const cli = meow(`
Usage
  $ create-app [options] <dir>

  dir                  ${t('options.dir')}

Options
  -o, --overwrite       ${t('options.overwrite')}
  -p, --private         ${t('options.private')}
  --verbose             ${t('options.verbose')}
  -h, --help            ${t('options.help')}
  -v, --version         ${t('options.version')}
`, {
  importMeta: import.meta,
  booleanDefault: undefined,
  helpIndent: 0,
  description: t('app.description'),
  flags: {
    overwrite: {
      type: 'string',
    },
    private: {
      type: 'boolean',
      shortFlag: 'p',
    },
    verbose: {
      type: 'boolean',
      default: process.env.NODE_ENV === 'development',
    },
    help: {
      type: 'boolean',
      shortFlag: 'h',
    },
    version: {
      type: 'boolean',
      shortFlag: 'v',
    },
  },
});

const { input, flags } = cli;
if (flags.help) {
  cli.showHelp(0);
}
else if (flags.version) {
  cli.showVersion();
}
else {
  logger.enableDebug(flags.verbose);
  logger.debug('project dir:', input.join());
  logger.debug('cli options:', flags);

  const opts = Object.assign({ dir: input[0] }, flags) as CreateAppOptions;
  createApp(opts);
}
