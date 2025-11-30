// copy from https://github.com/vuejs/create-vue/blob/b1494b6ed5b493c289cac020359dbb49bdfff47d/utils/getLanguage.ts#L1-L133
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 *
 * This function is used to link obtained locale with correct locale file in order to make locales reusable
 *
 * @param locale the obtained locale
 * @returns locale that linked with correct name
 */
function linkLocale(locale: string) {
  // The C locale is the default system locale for POSIX systems.
  // https://docs.oracle.com/cd/E36784_01/html/E36823/glmar.html
  // https://sourceware.org/glibc/wiki/Proposals/C.UTF-8
  // It is common among containerized environments or minimal virtual environments
  // though most user-facing systems would have a more specific locale set.
  // The problem here is that the C locale is not a valid language tag for the Intl API.
  // But it is not desirable to throw an error in this case.
  // So we map it to 'en-US'.
  if (locale === 'C') {
    return 'en-US';
  }

  let linkedLocale: string = '';
  try {
    linkedLocale = Intl.getCanonicalLocales(locale)[0];
  }
  catch (error) {
    console.log(`${error.toString()}, invalid language tag: "${locale}"\n`);
  }
  switch (linkedLocale) {
    case 'zh-TW':
    case 'zh-HK':
    case 'zh-MO':
      linkedLocale = 'zh-Hant';
      break;
    case 'zh-CN':
    case 'zh-SG':
      linkedLocale = 'zh-Hans';
      break;
    default:
      linkedLocale = locale;
  }

  return linkedLocale;
}

function getLocale() {
  const shellLocale
    = process.env.LC_ALL // POSIX locale environment variables
      || process.env.LC_MESSAGES
      || process.env.LANG
      || Intl.DateTimeFormat().resolvedOptions().locale // Built-in ECMA-402 support
      || 'en-US'; // Default fallback

  return linkLocale(shellLocale.split('.')[0].replace('_', '-'));
}

async function loadLanguageFile(filePath: string): Promise<Record<string, string>> {
  return await fs.promises.readFile(filePath, 'utf-8').then((data) => {
    const parsedData = JSON.parse(data);
    if (parsedData) {
      return parsedData;
    }
    return {};
  });
}

export async function getLanguage(localesRoot: string) {
  const locale = getLocale();

  const languageFilePath = path.resolve(localesRoot, `${locale}.json`);
  const fallbackPath = path.resolve(localesRoot, 'en-US.json');

  const doesLanguageExist = fs.existsSync(languageFilePath);
  return doesLanguageExist
    ? await loadLanguageFile(languageFilePath)
    : await loadLanguageFile(fallbackPath);
}

// export const t = await getLanguage(fileURLToPath(new URL('../locales', import.meta.url)));

const messages = await getLanguage(fileURLToPath(new URL('../locales', import.meta.url))); ;

export function t(
  ...params:
    | [message: string, ...args: Array<string | number | boolean>]
    | [message: string, args: Record<string, any>]
) {
  if (params.length === 0 || !messages) {
    return '';
  }

  const [key, ...args] = params;
  const text = messages[key] ?? '';
  if (args[0] === null || args[0] === undefined || args[0] === '') {
    return text;
  }

  const values: any = typeof args[0] === 'object' ? args[0] : args;
  return text.replace(/\{([^}]+)\}/g, (match, group) => (values[group] ?? match) as string);
}
