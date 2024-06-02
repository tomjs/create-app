import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  copySync,
  mkdirSync,
  readFileSync,
  readJsonSync,
  rmSync,
  writeFileSync,
  writeJsonSync,
} from '@tomjs/node';
import chalk from 'chalk';
import { camelCase, cloneDeep, merge } from 'lodash-es';
import type { PackageJson } from 'type-fest';
import { getAppConfig, getGitUserUrl, setGitRepoPrompt } from './repo.js';
import type {
  AppType,
  CLIOptions,
  Framework,
  FrameworkVariant,
  TextVars,
  UserOptions,
} from './types.js';
import {
  askCheckbox,
  askConfirm,
  askInput,
  askList,
  getPackageManagerName,
  logger,
  run,
} from './utils.js';

const opts: CLIOptions = {};

const ROOT = path.join(fileURLToPath(import.meta.url), '../../');

const TEMPLATE_DIR = path.join(ROOT, 'templates');

const config = readJsonSync(path.join(TEMPLATE_DIR, 'config.json')) || {};
const FRAMEWORKS: Framework[] = config.list || [];
const VARIANTS = FRAMEWORKS.map(f =>
  f.variants ? f.variants.map(s => ({ parent: f, ...s })) : [],
).flat();

const TEMPLATES_NAMES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

const PKG_FIELDS = [
  'name',
  'version',
  'description',
  'keywords',
  'private',
  'type',
  'engines',
  'packageManager',
  'author',
  'contributors',
  'homepage',
  'bugs',
  'license',
  'files',
  'bin',
  'main',
  'module',
  'types',
  'exports',
  'publishConfig',
  'repository',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

async function getGitInfo(name: string) {
  return run(`git config --get ${name}`, { trim: true });
}

const checkNpmName = (name: string) =>
  /^(?:(@[a-z0-9.+-]+(-[a-z0-9.+-]+)*\/)?([a-z0-9][a-z0-9._-]*[a-z0-9]))$/.test(name);

const checkFolderName = (name: string) => /^[a-z0-9._-]+$/.test(name);

const getProjectFolder = (name: string) =>
  name.includes('/') ? name.substring(name.indexOf('/') + 1) : name;

function readPkgJson(filePath: string) {
  return (readJsonSync(path.join(filePath, 'package.json')) || {}) as PackageJson;
}

function writePkgJson(filePath: string, data: any) {
  writeJsonSync(path.join(filePath, 'package.json'), data);
}

function sortObjectKeys(values: any, startKeys?: string[], endKeys?: string[]) {
  const obj = {};
  const allKeys = Object.keys(values).sort();
  let sKeys = startKeys || [];
  if (sKeys.length > 0) {
    sKeys = sKeys.filter(key => allKeys.includes(key));
  }

  let eKeys = endKeys || [];
  if (eKeys.length > 0) {
    eKeys = eKeys.filter(key => allKeys.includes(key));
  }

  sKeys
    .concat(allKeys.filter(key => !sKeys.includes(key) && !eKeys.includes(key)))
    .concat(eKeys)
    .forEach(prop => {
      obj[prop] = values[prop];
    });

  return obj;
}

export async function createApp(options: CLIOptions) {
  Object.assign(opts, options);

  if (opts.git) {
    await setGitRepoPrompt(undefined, true);
    return;
  }

  if (opts.type === 'project') {
    await crateProject();
  } else {
    await createExampleOrPackage(opts.type!);
  }
}

async function crateProject() {
  const appType = 'project';
  const variant = await getUserVariant(appType, opts.cwd!);
  const { projectDir } = variant.userOptions;
  // template
  copyTemplateFiles(appType, variant);
  // rename and replace
  await replaceContentWithTextVars(variant);

  // workspace
  const { workspaces } = variant;
  const packagesPath = path.join(projectDir, 'packages');
  if (workspaces) {
    const confirm = await askConfirm('Do you want to create an package?');
    if (confirm) {
      await createExampleOrPackage('package', packagesPath);
    }
  }

  const { examples } = variant;
  const hasExamples = Array.isArray(examples) && examples.length > 0;
  if (hasExamples) {
    const variants = VARIANTS.filter(s => examples.includes(s.name));
    const cwdDir = path.join(projectDir, 'examples');
    for (const item of variants) {
      const variant = cloneDeep(item);
      // Recursively get all templates
      variant.templates = getTemplates(variant.templates).concat(variant.name);

      const dir = path.join(cwdDir, variant.name);
      variant.userOptions = {
        projectDir: dir,
        pkgName: variant.name,
        gitUserUrl: '',
        textVars: {} as TextVars,
      };
      await getTextVars(variant);

      // template
      copyTemplateFiles('example', variant);
      // rename and replace
      await replaceContentWithTextVars(variant);
    }
  }

  const hasPackages =
    fs.existsSync(packagesPath) && fs.readdirSync(path.join(projectDir, 'packages')).length > 0;
  if (hasPackages || hasExamples) {
    const pkg = readPkgJson(projectDir);
    const pm = getPackageManagerName(pkg) || 'npm';
    const names: string[] = [];

    if (hasPackages) {
      names.push('packages');
    }
    if (hasExamples) {
      names.push('examples');
    }

    if (pm === 'pnpm') {
      const workspace = path.join(projectDir, 'pnpm-workspace.yaml');
      if (!fs.existsSync(workspace)) {
        writeFileSync(workspace, `packages:\n${names.map(s => `  - '${s}/*'\n`)}`);
      }
    } else {
      pkg.workspaces ??= names.map(s => `"${s}/*"`);
      writePkgJson(projectDir, pkg);
    }

    const deps = pkg.devDependencies ?? {};
    if (hasPackages && 'vitest' in deps) {
      writeFileSync(path.join(projectDir, 'vitest.config.ts'), `export default ["packages/*"];`);
    }
  }
  // init git
  await initProjectGit(variant);
}

async function createExampleOrPackage(appType: AppType, rootDir?: string) {
  let flag = true;
  let count = 0;
  while (flag) {
    count++;
    const variant = await getUserVariant(
      appType,
      rootDir || opts.cwd!,
      count === 1 ? opts.template : undefined,
    );
    const { pkgName } = variant.userOptions;

    // template
    copyTemplateFiles(appType, variant);
    // rename and replace
    await replaceContentWithTextVars(variant);

    logger.success(`${chalk.green(pkgName)} created successfully!`);

    flag = await askConfirm(`Do you want to create another ${appType}?`);
  }
}

function rmProjectFiles(projectDir: string, ...files: string[]) {
  if (!Array.isArray(files) || files.length === 0) {
    return;
  }
  files.forEach(s => {
    const file = path.join(projectDir, s);
    if (fs.existsSync(file)) {
      rmSync(file);
    }
  });
}

function replaceFileContent(filePath: string, searchValue: string | RegExp, replaceValue: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = readFileSync(filePath);
  content = content.replaceAll(searchValue, replaceValue);
  writeFileSync(filePath, content);
}

function handleFinalPkg(pkg: PackageJson, appType: AppType, variant: FrameworkVariant) {
  const opts = variant.userOptions;
  const { textVars } = opts;

  // merge and sort fields for package.json
  ['scripts', 'dependencies', 'devDependencies', 'peerDependencies'].forEach(key => {
    if (!pkg[key]) {
      return;
    }
    if (key === 'scripts') {
      pkg[key] = sortObjectKeys(
        pkg[key],
        [
          'dev',
          'debug',
          'start',
          'build',
          'preview',
          'test',
          'lint',
          'lint:eslint',
          'lint:stylelint',
          'lint:prettier',
        ],
        ['prepare'],
      );
    } else {
      pkg[key] = sortObjectKeys(pkg[key]);
    }
  });

  // remove unnecessary fields
  if (appType === 'example') {
    delete pkg.types;
    delete pkg.exports;
    delete pkg.publishConfig;
    delete pkg.repository;
    delete pkg.module;
    delete pkg.license;

    pkg.private = true;
  } else if (appType === 'package') {
    if (pkg.repository && typeof pkg.repository === 'object') {
      pkg.repository.directory = `packages/${textVars.pkgShortName}`;
    }
  }

  if (!variant.test) {
    const scripts = pkg.scripts;
    if (scripts) {
      delete scripts.test;
      {
        const script = scripts['lint:eslint'] || '';
        if (script) {
          scripts['lint:eslint'] = script.replace(',test', '');
        }
      }
    }

    delete pkg.devDependencies?.vitest;
  }

  if (pkg.type === 'commonjs') {
    delete pkg.type;
  }
  if (pkg.private === false) {
    delete pkg.private;
  }
}

function copyTemplateFiles(appType: AppType, variant: FrameworkVariant, dir?: string) {
  const projectDir = dir ?? variant.userOptions.projectDir;
  const tempPath = path.join(projectDir, '.temp');
  mkdirSync(tempPath);

  const templates = variant.templates || [];
  const copyTemplates = appType !== 'project' ? templates : ['base/core', ...templates];

  copyTemplates.forEach((name, index) => {
    const src = path.join(TEMPLATE_DIR, name);
    if (!fs.existsSync(src)) {
      return;
    }
    copySync(src, projectDir);

    // package.json
    const tempPkg = readPkgJson(tempPath) || {};
    let pkg = merge(tempPkg, readPkgJson(projectDir));
    if (index === templates.length) {
      const newPkg = {};

      PKG_FIELDS.forEach(key => {
        if (key in pkg) {
          newPkg[key] = pkg[key];
          delete pkg[key];
        }
      });
      pkg = Object.assign(newPkg, pkg);
      handleFinalPkg(pkg, appType, variant);
      writePkgJson(projectDir, pkg);
    } else {
      writePkgJson(tempPath, pkg);
    }
  });

  rmSync(tempPath);

  // test
  rmProjectFiles(projectDir, 'tests');
  replaceFileContent(path.join(projectDir, 'tsconfig.json'), `, "test"`, '');

  if (appType === 'package') {
    const exclude = ['.vscode'].concat(variant.packages?.exclude ?? []);
    rmProjectFiles(projectDir, ...exclude);
  }
}

async function replaceContentWithTextVars(variant: FrameworkVariant, dir?: string) {
  const opts = variant.userOptions;
  const { textVars } = opts;
  const projectDir = dir ?? opts.projectDir;

  fs.readdirSync(projectDir)
    .filter(s => s.startsWith('_'))
    .forEach(name => {
      fs.renameSync(path.join(projectDir, name), path.join(projectDir, name.replace('_', '.')));
    });

  const pkg = readPkgJson(projectDir);
  const publishFiles = ['LICENSE', 'README.md', 'README.zh_CN.md'];
  if (!pkg.publishConfig) {
    publishFiles.forEach(name => {
      rmSync(path.join(projectDir, name));
    });
  }

  ['package.json', ...publishFiles].forEach(name => {
    const filePath = path.join(projectDir, name);
    if (!fs.existsSync(filePath)) {
      return;
    }
    let content = readFileSync(filePath);
    Object.keys(textVars).forEach(key => {
      content = content.replace(new RegExp('{{' + key + '}}', 'g'), textVars[key]);
    });

    writeFileSync(filePath, content);
  });
}

async function getUserVariant(appType: AppType, rootDir: string, template?: string) {
  const { gitRepos } = await getAppConfig();

  // npm package name
  let pkgName = (opts.name || '').trim();
  const projectNameValid = checkNpmName(pkgName);
  if (!pkgName || !projectNameValid) {
    pkgName = await askInput('Package name:', {
      validate: input => (checkNpmName(input) ? true : 'Please input a valid name!'),
    });
  }

  let projectName = getProjectFolder(pkgName);
  if (projectName !== pkgName) {
    projectName = await askInput('Project name:', {
      default: projectName,
      validate: input => (checkFolderName(input) ? true : 'Please input a valid name!'),
    });
  }
  logger.debug('projectName:', projectName);

  const projectDir = path.join(rootDir, projectName);
  if (fs.existsSync(projectDir)) {
    const confirm = await askConfirm('Project already exists, overwrite?');
    if (confirm) {
      rmSync(projectDir);
    }
  }

  logger.debug('projectDir:', projectDir);

  // template
  let variant: FrameworkVariant | undefined;
  if (template && TEMPLATES_NAMES.includes(template)) {
    variant = VARIANTS.find(s => s.name === template);
  }

  const selectVariant = async (template?: string) => {
    const framework = await askList(
      !variant && template
        ? `${chalk.red(template)} is invalid, please select a framework again:`
        : 'Select a framework:',
      FRAMEWORKS.filter(s => {
        if (!s.variants || !s.variants.length) {
          return false;
        }

        if (appType === 'package') {
          return s.variants.filter(s => !s.packages?.ignore).length > 0;
        }
        return true;
      }).map(s => ({ name: s.display, value: s.name })),
    );

    logger.debug('framework:', framework);

    const variants = FRAMEWORKS.find(s => s.name === framework)?.variants || [];
    const _variants =
      appType === 'package'
        ? variants
            .filter(s => !s.packages?.ignore)
            .map(s => {
              const parent = s.parent;
              if (parent) {
                return { name: `${parent.display} > ${s.display}`, value: s.name };
              }
              return { name: s.display, value: s.name };
            })
        : variants.map(s => ({ name: s.display, value: s.name }));

    const _variant = await askList(
      'Select a variant:',
      _variants.concat([{ name: chalk.yellow('← Back'), value: '_' }]),
    );

    logger.debug('variant:', _variant);
    if (_variant === '_') {
      await selectVariant(template);
    } else {
      variant = variants.find(s => s.name === _variant);
    }
  };

  if (!variant) {
    await selectVariant(template);
  }

  if (!variant) {
    throw new Error('variant not found');
  }

  variant = cloneDeep(variant);

  if (!variant.templates) {
    variant.templates = [];
  }

  // Recursively get all templates
  variant.templates = getTemplates(variant.templates).concat(variant.name);

  logger.debug('variant:', variant);

  // project examples
  if (appType === 'project' && Array.isArray(variant.examples)) {
    variant.examples = await askCheckbox<string>(
      'Select examples:',
      variant.examples.map(name => {
        const item = VARIANTS.find(s => s.name === name);
        if (!item) {
          throw new Error(
            `Can't find example ${chalk.yellow(name)} from ${chalk.blue(variant!.name)}`,
          );
        }
        return {
          name: item.display,
          value: item.name,
          checked: true,
        };
      }),
      {
        required: false,
      },
    );
  }

  let gitUserUrl: string = '';
  if (appType === 'example') {
    variant.devDependencies = 0;
    variant.workspaces = false;
    variant.test = false;
  } else if (appType === 'package') {
    variant.workspaces = false;
  } else {
    gitUserUrl = await askList(
      `Which git repository to publish to?`,
      gitRepos
        .map(repo => {
          const url = getGitUserUrl(repo);
          return {
            name: url,
            value: url,
          };
        })
        .concat([
          {
            name: chalk.yellow('None'),
            value: '',
          },
        ]),
    );
  }

  if (variant.devDependencies === 2) {
    const confirm = await askConfirm('Whether it will be used for devDependencies?');
    variant.devDependencies = confirm ? 1 : 0;
  }

  if (variant.test) {
    variant.test = await askConfirm('Whether to use test?');
  }

  variant.userOptions = {
    pkgName,
    projectDir,
    gitUserUrl,
  } as UserOptions;

  await getTextVars(variant);

  return variant;
}

function getTemplates(templates?: string[]) {
  const allTemplates: string[] = [];
  const recursive = async (templates?: string[]) => {
    if (!Array.isArray(templates) || !templates.length) {
      return;
    }
    for (const name of templates) {
      if (name.startsWith('base/')) {
        allTemplates.push(name);
        continue;
      }

      const item = VARIANTS.find(s => s.name === name);
      if (!item) {
        logger.warning(`Can't find template ${chalk.yellow(name)}`);
        continue;
      }
      recursive(item.templates);
    }
  };
  recursive(templates);

  return [...new Set(allTemplates)];
}

async function getTextVars(variant: FrameworkVariant) {
  const { pkgName, gitUserUrl } = variant.userOptions;
  // get git user info
  const gitName = await getGitInfo('user.name');
  const gitEmail = await getGitInfo('user.email');
  const gitUser = {
    name: gitName || os.userInfo().username,
    email: gitEmail || '',
  };

  const pkgInstall = ['pnpm', 'yarn', 'npm']
    .map(s => `# ${s}\n${s} add ${pkgName}${variant.devDependencies ? ' -D' : ''}`)
    .join('\n\n');

  const textVars: TextVars = {
    pkgName: pkgName,
    pkgShortName: pkgName.startsWith('@') ? pkgName.split('/')[1] : pkgName,
    pkgInstall: pkgInstall,
    gitUserName: gitUser.name,
    gitUserEmail: gitUser.email,
    gitOrg: getOrgName(),
    gitUrl: getGitUrl(),
    gitFullUrl: getFullGitUrl(),
    gitFullSSHUrl: getFullGitUrl(),
    dateYear: new Date().getFullYear(),
  };

  function getGitUrl() {
    const url = gitUserUrl || `https://github.com/${getOrgName()}`;
    return `${url}/${pkgName.substring(pkgName.indexOf('/') + 1)}`;
  }

  function getOrgName() {
    if (gitUserUrl) {
      return gitUserUrl.substring(gitUserUrl.lastIndexOf('/') + 1);
    }

    return pkgName.startsWith('@') ? pkgName.split('/')[0].substring(1) : camelCase(gitUser.name);
  }

  function getFullGitUrl(ssh = false) {
    let url = gitUserUrl || `https://github.com/${getOrgName()}`;
    if (ssh) {
      url = url.replace(/http(s):\/\//g, 'git@').replace(/\//, ':');
    }

    return `${url}/${pkgName.substring(pkgName.indexOf('/') + 1)}.git`;
  }

  variant.userOptions.textVars = textVars;

  return textVars;
}

async function initProjectGit(variant: FrameworkVariant) {
  const { gitUserUrl, textVars, projectDir } = variant.userOptions;
  if (gitUserUrl) {
    await run('git init', { cwd: projectDir });
    await run(`git remote add origin ${textVars.gitFullSSHUrl}`, { cwd: projectDir });
  }

  const cwd = process.cwd();
  const cdProjectName = path.relative(cwd, projectDir);
  console.log(`\nDone. Now run:\n`);
  if (projectDir !== cwd) {
    console.log(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`);
  }

  const pm = getPackageManagerName() || 'npm';
  switch (pm) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${pm} install`);
      console.log(`  ${pm} run dev`);
      break;
  }
}
