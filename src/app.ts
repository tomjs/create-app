import type { CreateAppOptions, ProjectOptions } from './types';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prompts from '@clack/prompts';
import { copy, mkdir, mkdirp, readFile, readJson, readJsonSync, rm, rmSync, writeFile, writeJson } from '@tomjs/node';
import { camelCase, merge, upperFirst } from 'lodash-es';
import { glob } from 'tinyglobby';
import { gitRepos, packageScriptsSortKeys, packageSortFields, projectTemplates } from './constants';
import { getOptions, isWindows, logger, run, setOptions, t } from './utils';

const ROOT = path.join(fileURLToPath(import.meta.url), '../../');
const TEMPLATE_DIR = path.join(ROOT, 'templates');

const cancel = () => prompts.cancel(t('prompt.cancel'));
export async function createApp(options: CreateAppOptions) {
  setOptions(options);
  const opts = await initialValue(options);
  if (!opts) {
    return;
  }

  await createProject(opts);

  if (options.package) {
    await handlePackageTypeProject(opts);
  }

  if (opts.template === 'node-vite') {
    await updatePackageJsonVersion(opts.targetDir);
    await updateWorkspacePackageName(opts.targetDir, opts.packageName);
  }

  if (!options.package) {
    await run(`git init`, { cwd: opts.targetDir });
  }
}

async function initialValue(opts: CreateAppOptions): Promise<ProjectOptions | void> {
  // 1. Choose template
  const selectTemplate = async function () {
    const templateType = await prompts.select({
      message: t('prompt.templateType.message'),
      options: projectTemplates.map(s => ({
        label: s.color(s.display || s.name),
        value: s.name,
      })),
    });
    if (prompts.isCancel(templateType)) {
      return cancel();
    }

    const selectedTemplate = projectTemplates.find(s => s.name === templateType);
    const template = await prompts.select({
      message: t('prompt.template.message'),
      options: selectedTemplate.children.map(s => ({
        label: s.color(s.display || s.name),
        value: s.name,
      })).concat({
        label: t('prompt.template.back'),
        value: 'back',
      }),
    });
    if (prompts.isCancel(template)) {
      return cancel();
    }

    if (template === 'back') {
      return await selectTemplate();
    }

    const templateOptions = selectedTemplate.children.find(s => s.name === template);

    return {
      template,
      templateOptions,
    };
  };

  const templateResult = await selectTemplate();
  if (!templateResult) {
    return;
  }

  let scope = '';
  const gitEmail = await getGitConfig('user.email');
  if (gitEmail === 'tom@tomgao.cc') {
    scope = 'tomjs';
  }

  // 2. Get package name
  const { template, templateOptions } = templateResult;
  const isNode = template.startsWith('node-');

  let packageName = opts.packageName;
  if (!packageName) {
    packageName = templateOptions.value || template;
    if (scope && isNode) {
      packageName = `@${scope}/${packageName}`;
    }
  }

  const _packageName = await prompts.text({
    message: t('prompt.package.message'),
    initialValue: packageName,
    defaultValue: packageName,
    placeholder: packageName,
    validate: (value) => {
      return value.length === 0 || isValidPackageName(value)
        ? undefined
        : t('prompt.package.invalid');
    },
  });
  if (prompts.isCancel(_packageName)) {
    return cancel();
  }
  packageName = _packageName;

  // 3. Get project name and target dir
  let targetDir = getTargetDirFromPkg(packageName);
  const projectName = await prompts.text({
    message: t('prompt.project.message'),
    defaultValue: targetDir,
    initialValue: targetDir,
    placeholder: targetDir,
    validate: (value) => {
      return value.length === 0 || value.length > 0
        ? undefined
        : t('prompt.project.invalid');
    },
  });
  if (prompts.isCancel(projectName)) {
    return cancel();
  }
  targetDir = path.resolve(targetDir === '~' && !isWindows ? os.homedir() : process.cwd(), projectName);

  // 4. Handle directory if exist and not empty
  if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
    let overwrite = opts.overwrite;
    if (!overwrite) {
      const res = await prompts.select({
        message: t('prompt.exist.message', targetDir),
        options: [
          {
            label: t('prompt.exist.option.no'),
            value: 'no',
          },
          {
            label: t('prompt.exist.option.yes'),
            value: 'yes',
          },
          {
            label: t('prompt.exist.option.ignore'),
            value: 'ignore',
          },
        ],
      });
      if (prompts.isCancel(res)) {
        return cancel();
      }
      overwrite = res;
    }

    switch (overwrite) {
      case 'yes':
        emptyDir(targetDir);
        break;
      case 'no':
        cancel();
        return;
    }
  }

  // 5. Is public or private
  let isPublic: boolean;
  if (opts.private !== true && templateOptions.isPublic !== 'public') {
    const _isPublic = await prompts.confirm({
      message: t('prompt.public.message'),
      active: t('prompt.confirm.yes'),
      inactive: t('prompt.confirm.no'),
      initialValue: templateOptions.isPublic ?? true,
    });
    if (prompts.isCancel(_isPublic)) {
      return cancel();
    }
    isPublic = _isPublic;
  }
  else {
    isPublic = !opts.private;
  }

  // 6. git repo
  let gitUrl: string;
  if (isPublic) {
    const gitType = await prompts.select({
      message: t('prompt.gitUrl.message'),
      options: gitRepos.map(s => ({
        label: `${s.name} (${s.url})`,
        value: s.id,
      })),
    });
    if (prompts.isCancel(gitType)) {
      return cancel();
    }
    gitUrl = gitRepos.find(s => s.id === gitType)?.url;
  }

  // 7. git org
  let orgName: string;
  if (isPublic) {
    // 默认组织
    scope = getScope(packageName) || scope;
    const org = await prompts.text({
      message: t('prompt.orgName.message'),
      defaultValue: scope,
      placeholder: scope,
      validate: (value) => {
        return (scope && !value) || isValidPackageScope(value)
          ? undefined
          : t('prompt.orgName.invalid');
      },
    });
    if (prompts.isCancel(org)) {
      return cancel();
    }
    orgName = org;
  }

  delete templateOptions.color;

  return {
    targetDir,
    orgName,
    packageName,
    template,
    templateOptions,
    isPublic,
    gitUrl,
  };
}

async function createProject(projectOptions: ProjectOptions) {
  logger.debug('projectOptions:', projectOptions);
  const { targetDir, packageName, template, isPublic, gitUrl, orgName: gitOrg, templateOptions } = projectOptions;
  await mkdir(targetDir);

  const isVSCode = template.includes('vscode');
  const pkg: Record<string, any> = {};

  // copy and merge common config files
  const targetTempDir = path.join(targetDir, '.temp');
  await mkdirp(targetTempDir);
  await copyTemplate(pkg, 'base', targetTempDir);
  if (templateOptions.hasStyle) {
    await copyTemplate(pkg, 'style', targetTempDir);
  }
  if (isPublic && !isVSCode) {
    await copyTemplate(pkg, 'public', targetTempDir);
  }

  // copy common and template to destination
  await copy(targetTempDir, targetDir);
  await rm(targetTempDir);
  await copy(path.join(TEMPLATE_DIR, template), targetDir);

  const pkgFile = path.join(path.join(TEMPLATE_DIR, template), 'package.json');
  merge(pkg, await readJson(pkgFile));

  pkg.name = packageName;
  if (isPublic) {
    delete pkg.private;
    pkg.name = packageName;
    pkg.license = 'MIT';
    const gitName = (await getGitConfig('user.name')) || os.userInfo().username;
    const gitEmail = await getGitConfig('user.email');
    if (gitName && gitEmail) {
      pkg.author = {
        name: gitName,
        email: gitEmail,
      };
    }
    else if (gitName) {
      pkg.author = gitName;
    }

    const url = `${gitUrl}/${gitOrg}/${path.basename(targetDir)}`;
    if (isVSCode) {
      pkg.publisher = gitOrg;
      pkg.homepage = `${url}/blob/main/README.md`;
      pkg.bugs = {
        url: `${url}/issues`,
      };
      delete pkg.publishConfig;
    }

    pkg.repository = {
      type: 'git',
      url: `${url}.git`,
      directory: getOptions().package ? `packages/${path.basename(targetDir)}` : undefined,
    };
  }
  else {
    pkg.private = true;
    delete pkg.publishConfig;
    if (pkg.devDependencies) {
      delete pkg.devDependencies.publint;
    }
  }
  await writeJson(path.join(targetDir, 'package.json'), sortPackageJson(pkg));

  // update all package.json
  await updatePackageJsonVersion(targetDir);

  // md/license
  if (isPublic) {
    const { author } = pkg;
    let gitUserName = '';
    if (author) {
      if (typeof author === 'string') {
        gitUserName = author;
      }
      else if (typeof author === 'object') {
        if (author.name && author.email) {
          gitUserName = `${author.name}<${author.email}>`;
        }
        else if (author.name) {
          gitUserName = author.name;
        }
        else if (author.email) {
          gitUserName = author.email;
        }
      }
    }

    const textVars: Record<string, any> = {
      pkgName: packageName,
      dateYear: new Date().getFullYear(),
      gitUserName,
    };

    const projectFiles = await fsp.readdir(targetDir);
    const files = projectFiles.filter(s => ['README.md', 'README.zh_CN.md', 'LICENSE'].includes(s));
    for (const file of files) {
      let content = await readFile(path.join(targetDir, file));
      Object.keys(textVars).forEach((key) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), textVars[key]);
      });

      await writeFile(path.join(targetDir, file), content);
    }
  }

  // _file -> file
  const _files = await glob('**/_*', { ignore: ['**/node_modules/**', '**/.*'], cwd: targetDir });
  for (const file of _files) {
    const filePaths = file.split('/');
    filePaths[filePaths.length - 1] = filePaths[filePaths.length - 1].substring(1);
    await fsp.rename(path.join(targetDir, file), path.join(targetDir, filePaths.join('/')));
  }
}

function getTargetDirFromPkg(pkgName: string) {
  return (pkgName || '').trim().replace(/^@[^/]+\//, '');
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0;
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  rmSync(dir);
}

function isValidPackageName(name: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(name);
}

function isValidPackageScope(name: string) {
  return /^[a-z][a-z\d\-._]*$/.test(name);
}

async function getGitConfig(name: string) {
  return run(`git config --get ${name}`, { trim: true });
}

function getScope(name: string) {
  if (name.startsWith('@')) {
    return name.split('/')[0].substring(1);
  }
}

async function copyTemplate(pkg: any, configFolder: string, targetDir: string) {
  const cfgDir = path.join(TEMPLATE_DIR, `config/${configFolder}`);
  const cfgFiles = await fsp.readdir(cfgDir);
  for (const file of cfgFiles) {
    if (['node_modules', '.git'].includes(file)) {
      continue;
    }
    if (file === 'package.json') {
      merge(pkg, await readJson(path.join(cfgDir, 'package.json')));
    }
    else {
      await copy(path.join(cfgDir, file), path.join(targetDir, file));
    }
  }
}

function sortJson(json: any, sortKeys?: string[]) {
  if (!json) {
    return json;
  }

  const obj: Record<string, any> = {};
  if (Array.isArray(sortKeys) && sortKeys.length > 0) {
    // sort fields
    sortKeys.filter(s => s in json).forEach((key) => {
      obj[key] = json[key];
    });
    Object.keys(json)
      .filter(s => !sortKeys.includes(s))
      .sort()
      .forEach((key) => {
        obj[key] = json[key];
      });
  }
  else {
    Object.keys(json).sort().forEach((key) => {
      obj[key] = json[key];
    });
  }

  return obj;
}

function sortPackageScripts(values: any, sortKeys: string[], sortEndKeys: string[]) {
  const obj: Record<string, any> = {};
  let allKeys = Object.keys(values);
  {
    const subScripts = allKeys.filter(s => s.includes(':'));
    const scripts = allKeys.filter(s => !s.includes(':')).sort();
    allKeys = scripts.concat(subScripts);
  }
  const sKeys = initKeys(sortKeys);
  const eKeys = initKeys(sortEndKeys);

  sKeys
    .concat(allKeys.filter(key => !sKeys.includes(key) && !eKeys.includes(key)))
    .concat(eKeys)
    .forEach((prop) => {
      obj[prop] = values[prop];
    });

  return obj;

  function initKeys(customKeys?: string[]) {
    let cKeys = Array.isArray(customKeys) ? customKeys : [];
    if (cKeys.length > 0) {
      cKeys = cKeys.reduce((acc, key) => {
        if (key.endsWith(':')) {
          const keys = allKeys.filter(k => !acc.includes(k) && k.startsWith(key));
          return acc.concat(keys);
        }

        if (allKeys.includes(key)) {
          return acc.concat(key);
        }

        return acc;
      }, [] as string[]);
    }
    return cKeys;
  }
}

function sortPackageJson(pkg: any) {
  pkg = sortJson(pkg, packageSortFields);
  if (pkg.scripts) {
    pkg.scripts = sortPackageScripts(pkg.scripts, packageScriptsSortKeys, ['prepare', 'prepublishOnly']);
  }
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach((key) => {
    if (pkg[key]) {
      pkg[key] = sortJson(pkg[key]);
    }
  });

  return pkg;
}

async function updatePackageJsonVersion(targetDir: string) {
  const configPkgDeps = readJsonSync(path.join(TEMPLATE_DIR, 'config/package.json'))?.dependencies || {};
  const pkgFiles = await glob('**/package.json', { ignore: ['**/node_modules/**', '**/.*'], cwd: targetDir });
  for (const file of pkgFiles) {
    const pkgPath = path.join(targetDir, file);
    const pkg = await readJson(pkgPath);
    ['dependencies', 'devDependencies'].forEach((depKey) => {
      const deps = pkg[depKey];
      if (!deps) {
        return;
      }
      Object.keys(deps).forEach((key) => {
        deps[key] = configPkgDeps[key] || deps[key];
      });
    });

    writeJson(pkgPath, sortPackageJson(pkg));
  }
}

async function handlePackageTypeProject(opts: ProjectOptions) {
  const hasStyle = opts.templateOptions.hasStyle;

  // rm lint config file
  const rmFiles = ['.editorconfig', '.gitignore', '.gitattributes', 'commitlint.config.mjs', 'simple-git-hooks.mjs', 'pnpm-workspace.yaml'];

  if (!hasStyle) {
    rmFiles.push('lint-staged.config.mjs');
  }

  if (!['vscode', 'electron'].find(s => opts.template.startsWith(s))) {
    rmFiles.push('.vscode');
  }

  rmFiles.forEach((fileName) => {
    const filePath = path.join(opts.targetDir, fileName);
    if (fs.existsSync(filePath)) {
      rmSync(filePath);
    }
  });
  // rm config file
  const pkg = await readJson(path.join(opts.targetDir, 'package.json'));
  if (pkg.scripts) {
    delete pkg.scripts.prepare;
  }

  if (!hasStyle) {
    delete pkg.devDependencies;
  }
  else if (pkg.devDependencies) {
    const stylePkg = await readJson(path.join(TEMPLATE_DIR, 'config/style/package.json'));
    const keys = Object.keys(stylePkg.devDependencies || {});
    Object.keys(pkg.devDependencies).forEach((key) => {
      if (!keys.includes(key)) {
        delete pkg.devDependencies[key];
      }
    });
  }

  await writeJson(path.join(opts.targetDir, 'package.json'), pkg);
}

async function updateWorkspacePackageName(targetDir: string, packageName: string) {
  // examples
  const exampleFiles = await glob(['examples/*/package.json', 'examples/*/vite.config.ts'], { ignore: ['**/node_modules/**', '**/.*'], cwd: targetDir });
  for (const file of exampleFiles) {
    const pkgPath = path.join(targetDir, file);
    const content = await readFile(pkgPath);
    await writeFile(pkgPath, content.replaceAll('@tomjs/vite-plugin-template', packageName));
  }

  const pluginName = camelCase((packageName.split('/').pop() || '').replace('vite-plugin-', ''));
  if (pluginName) {
    const srcFiles = await glob(['src/**/*.ts'], { ignore: ['**/node_modules/**', '**/.*'], cwd: targetDir });
    for (const file of srcFiles) {
      const pkgPath = path.join(targetDir, file);
      const content = await readFile(pkgPath);
      await writeFile(
        pkgPath,
        content.replaceAll('@tomjs:xxx', `@tomjs/${pluginName}`)
          .replaceAll('useXxxPlugin', `use${upperFirst(pluginName)}Plugin`)
          .replaceAll('XxxPluginOptions', `${upperFirst(pluginName)}PluginOptions`),
      );
    }
  }
}
