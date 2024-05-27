import meow from 'meow';
import { getReleaseConfig } from './config.js';
import { isDev } from './constants.js';
import type { XxxCLIOptions } from './types.js';

const cli = meow(
  `
Usage
  $ xxx [input] [options]

Options
  --cwd                 The current working directory (default: ".")
  --config              Specify the config file path (eg. xxx.config.json)
  --verbose             Display verbose output
  -h, --help            Display this message
  -v, --version         Display version number
`,
  {
    importMeta: import.meta,
    booleanDefault: undefined,
    helpIndent: 0,
    flags: {
      cwd: {
        type: 'string',
      },
      config: {
        type: 'string',
      },
      verbose: {
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
} else if (flags.v) {
  cli.showVersion();
} else {
  console.log(input, flags);

  const cliOpts = Object.assign({}, flags);
  console.log('cli options:', cliOpts);

  const config = await getReleaseConfig(flags);
  console.log('config file:', config);

  const mergedOpts = Object.assign(
    {
      verbose: isDev,
    } as XxxCLIOptions,
    config,
    cliOpts,
  ) as XxxCLIOptions;

  mergedOpts.cwd ||= process.cwd();
  console.log('merged options:', mergedOpts);
}
