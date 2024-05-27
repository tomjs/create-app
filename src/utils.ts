import Logger from '@tomjs/logger';
import type { Options as ExecaOptions } from 'execa';
import { $ } from 'execa';
import type {
  Answers,
  CheckboxQuestionOptions,
  ConfirmQuestionOptions,
  InputQuestionOptions,
  ListQuestionOptions,
  Question,
} from 'inquirer';
import inquirer from 'inquirer';
import type { CLIOptions } from './types.js';

export const logger = new Logger({
  directory: 'create-app/logs',
});

function mergeQuestionOpts<T>(message: string, value?: any, opts?: any) {
  const question: Question<Answers> = { message };
  if (Array.isArray(value) || typeof value !== 'object') {
    question.default = value;
  } else {
    Object.assign(question, value);
  }

  return Object.assign(question, opts) as T;
}

export async function askConfirm(
  message: string,
  value?: boolean | ConfirmQuestionOptions<Answers>,
) {
  const name = `confirm-${Date.now()}`;
  const question = mergeQuestionOpts<ConfirmQuestionOptions<Answers>>(message, value);
  const result = await inquirer.prompt([{ type: 'confirm', name, ...question }]);
  return result[name] as boolean;
}

type InputQuestionPlus = InputQuestionOptions<Answers> & { default?: string; required?: boolean };

export async function askInput(message: string, value?: string | InputQuestionPlus) {
  const name = `input-${Date.now()}`;
  const { required, ...question } = mergeQuestionOpts<InputQuestionPlus>(message, value);

  const _required = required ?? true;
  const _validate = question.validate;
  if (_required || _validate) {
    question.validate = (input: string) => {
      const v = (input || '').trim();
      if (_required && !v) {
        return `It's required!`;
      }

      return _validate ? _validate(input) : true;
    };
  }

  const result = await inquirer.prompt([{ type: 'input', name, ...question }]);
  return result[name] as string;
}

type CheckboxQuestionPlus<T> = CheckboxQuestionOptions<Answers> & {
  default?: T;
  required?: boolean;
  min?: number;
  max?: number;
};
export async function askCheckbox<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[],
  value?: T[] | CheckboxQuestionPlus<T>,
) {
  const name = `checkbox-${Date.now()}`;
  const { required, min, max, ...question } = mergeQuestionOpts<CheckboxQuestionPlus<T>>(
    message,
    value,
  );
  const _required = required ?? true;
  const _validate = question.validate;
  if (_required || min || max) {
    question.validate = (input: T[]) => {
      if (_required && input.length === 0) {
        return 'Please select at least one option';
      }

      if (min && input.length < min) {
        return `Please select at least ${min} options`;
      }

      if (max && input.length > max) {
        return `Please select at most ${max} options`;
      }

      return _validate ? _validate(input) : true;
    };
  }

  const result = await inquirer.prompt([
    { type: 'checkbox', name, choices, pageSize: Math.min(choices.length, 10), ...question },
  ]);
  return result[name] as T[];
}

type ListQuestionPlus<T> = ListQuestionOptions<Answers> & {
  default?: T;
};
export async function askList<T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[],
  value?: T | ListQuestionPlus<T>,
) {
  const name = `list-${Date.now()}`;
  const question = mergeQuestionOpts<ListQuestionPlus<T>>(message, value);
  const result = await inquirer.prompt([
    { type: 'list', name, choices, pageSize: Math.min(choices.length, 10), ...question },
  ]);
  return result[name] as T;
}

let _opts: CLIOptions = {
  cwd: '.',
};

export function setOptions(opts: CLIOptions) {
  _opts = opts;
}

export function getOptions() {
  return _opts;
}

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
      cwd: _opts.cwd,
    } as RunExecaOptions,
    options,
  );
  execOpts.cwd ??= _opts.cwd;

  if (Array.isArray(cmd)) {
    cmd = cmd.join(' ');
  }

  const log = (str: string) => {
    if (_opts.verbose) {
      logger.debug(str);
    } else {
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
  } catch (e: any) {
    const msg = e.stderr || e.message;

    log(msg);

    throw new Error(msg);
  }
}

export function getPackageManagerName() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return pkgSpecArr[0];
}
