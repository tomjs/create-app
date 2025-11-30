import type { XxxCLIOptions } from './types';
import * as prompts from '@clack/prompts';
import { logger, t } from './utils';

const cancel = () => prompts.cancel(t('prompt.cancel'));

export async function runApp(opts: XxxCLIOptions) {
  logger.debug('opts', opts);
  logger.info('Starting App...');

  const isPublic = await prompts.confirm({
    message: t('prompt.public.message'),
    active: t('prompt.confirm.yes'),
    inactive: t('prompt.confirm.no'),
  });
  if (prompts.isCancel(isPublic)) {
    return cancel();
  }
}
