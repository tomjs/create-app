import type { CLIOptions } from './types';
import meow from 'meow';
import { createApp } from './app';
import { logger } from './utils';

const cli = meow(
  `
Usage
  $ create-app [name] [options]

  name                  The package name

Options
  --cwd                 The current working directory (default: ".")
  -e, --example         Only create examples
  -p, --package         Only create packages
  --git                 Only manage git repository
  --verbose             Display verbose output
  -h, --help            Display this message
  -v, --version         Display version number

Examples
  $ create-app my-project
  $ create-app my-project --template=vue
`,
  {
    importMeta: import.meta,
    booleanDefault: undefined,
    helpIndent: 0,
    flags: {
      cwd: {
        type: 'string',
      },
      verbose: {
        type: 'boolean',
        default: process.env.NODE_ENV === 'development',
      },
      example: {
        shortFlag: 'e',
        type: 'boolean',
      },
      package: {
        shortFlag: 'p',
        type: 'boolean',
      },
      h: {
        type: 'boolean',
        default: false,
      },
      v: {
        type: 'boolean',
        default: false,
      },
    },
  },
);

const { input, flags } = cli;
if (flags.h) {
  cli.showHelp(0);
}
else if (flags.v) {
  cli.showVersion();
}
else {
  logger.enableDebug(flags.verbose);
  logger.debug('cli options:', input, flags);

  const opts = Object.assign({ name: input[0], type: 'project' }, flags) as CLIOptions;
  opts.cwd ||= process.env.CA_CWD || process.cwd();
  opts.example ??= isTrue(process.env.CA_EXAMPLE);
  opts.package ??= isTrue(process.env.CA_PACKAGE);
  logger.debug('final options:', opts);

  opts.type = getType(opts);

  // eslint-disable-next-line antfu/no-top-level-await
  await createApp(opts);
}

function getType(opts: CLIOptions) {
  if (opts.example) {
    return 'example';
  }
  else if (opts.package) {
    return 'package';
  }
  else {
    return 'project';
  }
}

function isTrue(str?: string) {
  return str === '1' || str === 'true';
}
