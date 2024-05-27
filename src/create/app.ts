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
import { camelCase, merge } from 'lodash-es';
import type { PackageJson } from 'type-fest';
import type { AppType, CLIOptions, Framework, FrameworkVariant } from '../types.js';
import {
  askCheckbox,
  askConfirm,
  askInput,
  askList,
  getPackageManagerName,
  logger,
  run,
} from '../utils.js';
import { getAppConfig, getGitUserUrl } from './repo.js';

const opts: CLIOptions = {};

const ROOT = path.join(fileURLToPath(import.meta.url), '../../');

const TEMPLATE_DIR = path.join(ROOT, 'templates');

const config = readJsonSync(path.join(TEMPLATE_DIR, 'config.json')) || {};
const FRAMEWORKS: Framework[] = config.list || [];
const VARIANTS = FRAMEWORKS.map(f =>
  f.variants ? f.variants.map(s => ({ parent: f, ...s })) : [f as FrameworkVariant],
).flat();

const TEMPLATES_NAMES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

async function getGitInfo(name: string) {
  return run(`git config --get ${name}`, { trim: true });
}

const checkNpmName = (name: string) =>
  /^(@[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9._-]+|[a-z0-9._-]+)$/.test(name);

const checkFolderName = (name: string) => /^[a-z0-9._-]+$/.test(name);

const getProjectFolder = (name: string) =>
  name.includes('/') ? name.substring(name.indexOf('/') + 1) : name;

function readPkgJson(filePath: string) {
  return readJsonSync(path.join(filePath, 'package.json')) as PackageJson;
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

  if (opts.type === 'project') {
    await crateProject();
  } else {
    await createExampleOrPackage(opts.type!);
  }
}

async function crateProject() {
  const appType = 'project';
  const userOptions = await getUserOptions(appType, opts.cwd!);
  const { projectDir, variant, textVars } = userOptions;

  mkdirSync(projectDir);

  // template
  copyTemplateFiles(appType, projectDir, variant);
  // rename and replace
  await replaceContent(projectDir, textVars);

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
    const list = VARIANTS.filter(s => examples.includes(s.name));
    for (const item of list) {
      const dir = path.join(projectDir, 'examples', item.name);
      // template
      copyTemplateFiles('example', dir, variant);
      // rename and replace
      await replaceContent(dir, textVars);
    }
  }

  const hasPackages =
    fs.existsSync(packagesPath) && fs.readdirSync(path.join(projectDir, 'packages')).length > 0;
  if (hasPackages || hasExamples) {
    const pkg = readPkgJson(projectDir);
    const pm = getPackageManagerName() || 'npm';
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
        writeFileSync(workspace, `packages:\n${names.map(s => `  - "${s}"\n`)}`);
      }
    } else {
      pkg.workspaces ??= names.map(s => `"${s}/*"`);
      writePkgJson(projectDir, pkg);
    }

    const deps = pkg.devDependencies ?? {};
    if ('vitest' in deps) {
      writeFileSync(
        path.join(projectDir, 'vitest.config.ts'),
        `export default [${names.map(s => `"${s}/*"`).join(', ')}];`,
      );
    }
  }
  // init git
  await initProjectGit(userOptions);
}

async function createExampleOrPackage(appType: AppType, rootDir?: string) {
  let flag = true;
  let count = 0;
  while (flag) {
    count++;
    const userOptions = await getUserOptions(
      appType,
      rootDir || opts.cwd!,
      count === 1 ? opts.template : undefined,
    );
    const { pkgName, projectDir, variant, textVars } = userOptions;

    mkdirSync(projectDir);

    // template
    copyTemplateFiles(appType, projectDir, variant);
    // rename and replace
    await replaceContent(projectDir, textVars);

    logger.success(`${chalk.green(pkgName)} created successfully!`);

    flag = await askConfirm('Do you want to create another example?');
  }
}

interface UserOptions {
  pkgName: string;
  projectDir: string;
  variant: FrameworkVariant;
  gitUserUrl: string;
  textVars: TextVars;
}

interface TextVars {
  /**
   * Package name
   */
  pkgName: string;

  /**
   * Package installation string
   */
  pkgInstall: string;

  /**
   * User's name
   */
  gitUserName: string;

  /**
   * User's email
   */
  gitUserEmail: string;

  /**
   * Git organization name
   */
  gitOrg: string;

  /**
   * Git URL
   */
  gitUrl: string;

  /**
   * Full Git URL
   */
  gitFullUrl: string;

  /**
   * Full Git SSH URL
   */
  gitFullSSHUrl: string;

  /**
   * Current year
   */
  dateYear: number;
}

function copyTemplateFiles(appType: AppType, projectDir: string, variant: FrameworkVariant) {
  const tempPath = path.join(projectDir, '.temp');
  mkdirSync(tempPath);

  const templates = variant.templates || [];
  const copyTemplates = appType !== 'project' ? templates : ['config', ...templates];

  copyTemplates.forEach((name, index) => {
    const src = path.join(TEMPLATE_DIR, name);
    if (!fs.existsSync(src)) {
      return;
    }
    copySync(src, projectDir);

    // package.json
    const tempPkg = readPkgJson(tempPath) || {};
    const mergedPkg = merge(tempPkg, readPkgJson(projectDir));
    if (index === templates.length) {
      const pkg = readPkgJson(projectDir);
      const pkgKeys = Object.keys(pkg);
      pkgKeys.forEach(key => {
        if (mergedPkg[key]) {
          pkg[key] = mergedPkg[key];
        }
      });
      Object.keys(mergedPkg).forEach(key => {
        if (!pkg[key]) {
          pkg[key] = mergedPkg[key];
        }
      });

      // merge and sort package.json
      ['scripts', 'dependencies', 'devDependencies', 'peerDependencies'].forEach(key => {
        if (!pkg[key]) {
          return;
        }
        if (key === 'scripts') {
          pkg[key] = sortObjectKeys(
            pkg[key],
            ['dev', 'debug', 'build', 'preview', 'test'],
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
      }

      writePkgJson(projectDir, pkg);

      rmSync(tempPath);
    } else {
      writePkgJson(tempPath, mergedPkg);
    }
  });
}

async function replaceContent(projectDir: string, textVars: TextVars) {
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

async function getUserOptions(appType: AppType, rootDir: string, template?: string) {
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

  if (!variant) {
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
    const _variant = await askList(
      'Select a variant:',
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
        : variants.map(s => ({ name: s.display, value: s.name })),
    );
    logger.debug('variant:', _variant);
    variant = variants.find(s => s.name === _variant);
  }

  if (!variant) {
    throw new Error('variant not found');
  }

  if (!variant.templates) {
    variant.templates = [];
  }
  variant.templates = [...variant.templates, variant.name];

  logger.debug('variant:', variant);

  // project examples
  if (appType === 'project' && Array.isArray(variant.examples)) {
    variant.examples = await askCheckbox<string>(
      'Select examples:',
      variant.examples.map(name => {
        const item = VARIANTS.find(s => s.name === name);
        if (!item) {
          throw new Error(
            `Can't find example ${chalk.yellow(name)} from ${chalk.blue(variant.name)}`,
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
  if (appType !== 'example') {
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

  const userOptions = { pkgName, projectDir, variant, gitUserUrl } as UserOptions;

  userOptions.textVars = await getTextVars(userOptions);

  return userOptions;
}

async function getTextVars(userOptions: UserOptions) {
  const { pkgName, gitUserUrl, variant } = userOptions;
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

  return textVars;
}

async function initProjectGit(userOptions: UserOptions) {
  const { gitUserUrl, textVars, projectDir } = userOptions;
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
