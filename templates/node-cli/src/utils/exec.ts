import type { Options as ExecaOptions } from 'execa';
import { $ } from 'execa';
import { getOptions, logger } from './util';

interface RunExecaOptions extends ExecaOptions {
  /**
   * Whether to clear the command output, replace \r and \n to ""
   * @default false
   */
  trim?: boolean;
}

/**
 * run a command
 * @param cmd command
 * @param options custom and execa options
 */
export async function run(cmd: string, options?: RunExecaOptions): Promise<string>;
/**
 * run a command
 * @param cmd a command array, will be joined by space
 * @param options custom and execa options
 */
export async function run(cmd: string[], options?: RunExecaOptions): Promise<string>;

export async function run(cmd: string | string[], options?: RunExecaOptions): Promise<string> {
  const { trim, ...execOpts } = Object.assign(
    {
      stdio: 'pipe',
      shell: true,
    } as RunExecaOptions,
    options,
  );

  if (Array.isArray(cmd)) {
    cmd = cmd.join(' ');
  }

  const log = (str: string) => {
    if (getOptions().verbose) {
      logger.debug(str);
    }
    else {
      logger.write(str);
    }
  };

  log(`$ ${cmd}`);

  try {
    const result = await $(execOpts)`${cmd}`;
    const stdout = result.stdout as string;

    log(stdout);

    if (trim) {
      return stdout.trim().replace(/\n|\r/g, '');
    }
    return stdout.trim();
  }
  catch (e: any) {
    const msg = e.stderr || e.message;

    log(msg);

    throw new Error(msg);
  }
}
