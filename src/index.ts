import type { Choice } from 'prompts';
import type { Framework, PromptOption, PromptResult } from './types';
import type { Args } from './utils';
import fs, { renameSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lightBlue, lightCyan, lightGreen, lightYellow, red, reset, yellow } from 'kolorist';
import { camelCase } from 'lodash-es';
import minimist from 'minimist';
import prompts from 'prompts';
import shell from 'shelljs';
import { beforeCreate, getAppConfig, getGitUserUrl } from './repo';
import {
  copy,
  emptyDir,
  formatArgs,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  readFile,
  readJson,
  rmSync,
  toValidPackageName,
  writeFile,
  writeJson,
} from './utils';

// cli args
const argv = formatArgs(minimist<Args>(process.argv.slice(2), { string: ['_'] }));
const cwd = process.cwd();

const ALL_PROMPT_OPTIONS: PromptOption[] = ['test', 'vite', 'examples'];

const FRAMEWORKS: Framework[] = [
  {
    name: 'node',
    display: 'Node',
    color: lightYellow,
    options: [
      { id: 'test', name: 'Test' },
      { id: 'publish', name: 'Git Repository + NPM Publish', selected: true },
      { id: 'ssh', name: 'Git init by SSH', selected: true },
      { id: 'tsup', name: 'Use tsup build', selected: true },
      { id: 'vite', name: 'Use vite build' },
      { id: 'vite-plugin', name: 'Vite Plugin' },
      { id: 'examples', name: 'Examples' },
      { id: 'workspace', name: 'Workspaces/Monorepo' },
    ],
  },
  {
    name: 'web',
    display: 'Web App',
    color: lightGreen,
    variants: [
      {
        name: 'vue',
        display: 'Vue',
        color: lightGreen,
      },
      {
        name: 'react',
        display: 'React',
        color: lightBlue,
      },
    ],
  },
  {
    name: 'electron',
    display: 'Electron App',
    color: lightBlue,
    variants: [
      {
        name: 'electron-vue',
        display: 'Vue',
        color: lightGreen,
      },
      {
        name: 'electron-react',
        display: 'React',
        color: lightBlue,
      },
    ],
  },
  {
    name: 'vscode',
    display: 'VSCode Extension',
    color: lightCyan,
    options: [
      { id: 'publish', name: 'Git Repository' },
      { id: 'ssh', name: 'Git init by SSH' },
    ],
    variants: [
      {
        name: 'vscode',
        display: 'Base',
        color: lightYellow,
      },
      {
        name: 'vscode-vue',
        display: 'Vue',
        color: lightGreen,
      },
      {
        name: 'vscode-react',
        display: 'React',
        color: lightBlue,
      },
    ],
  },
];

const TEMPLATES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

const defaultTargetDir = 'my-app';

function getGitInfo(name: string) {
  const result = shell.exec(`git config --get ${name}`, { silent: true });
  if (result.code === 0) {
    return result.stdout.trim();
  }
}

function getPureTargetDir(targetDir: string) {
  let target = targetDir.length > 1 ? targetDir.substring(targetDir.indexOf('/') + 1) : targetDir;
  if (process.env.VSCODE_DEBUG) {
    target = path.join('../.create-app', target);
  }
  return target;
}

async function createApp() {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;

  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () => (targetDir === '.' ? path.basename(path.resolve()) : targetDir);
  let pureTargetDir = getPureTargetDir(targetDir);

  const { gitRepos } = getAppConfig();

  const result: PromptResult = await prompts(
    [
      {
        type: argTargetDir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: state => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir;

          pureTargetDir = getPureTargetDir(targetDir);
        },
      },
      {
        type: () => (!fs.existsSync(pureTargetDir) || isEmpty(pureTargetDir) ? null : 'toggle'),
        name: 'overwrite',
        message: () =>
          (pureTargetDir === '.' ? 'Current directory' : `Target directory "${pureTargetDir}"`) +
          ` is not empty. Remove existing files and continue?`,
        initial: false,
        active: 'Yes',
        inactive: 'No',
      },
      {
        type: (_, { overwrite }: { overwrite?: boolean }) => {
          if (overwrite === false) {
            console.log(red('✖') + ' Operation cancelled');
            throw new Error();
          }
          return null;
        },
        name: 'overwriteChecker',
      },
      {
        type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
        name: 'packageName',
        message: reset('Package name:'),
        initial: () => toValidPackageName(getProjectName()),
        validate: dir => isValidPackageName(dir) || 'Invalid package.json name',
      },
      {
        type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
        name: 'framework',
        message:
          typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
            ? reset(`"${argTemplate}" isn't a valid template. Please choose from below: `)
            : reset('Select a framework:'),
        initial: 0,
        choices: FRAMEWORKS.map(framework => {
          const frameworkColor = framework.color;
          return {
            title: frameworkColor(framework.display || framework.name),
            value: framework,
          };
        }),
      },
      {
        type: (framework: Framework) => (framework && framework.variants ? 'select' : null),
        name: 'variant',
        message: reset('Select a variant:'),
        choices: (framework: Framework) =>
          framework?.variants?.map(variant => {
            const variantColor = variant.color;
            return {
              title: variantColor(variant.display || variant.name),
              value: variant.name,
            };
          }),
      },
      {
        type: (pre, values) => {
          const { framework } = values;
          return framework && Array.isArray(framework.options) && framework.options.length
            ? 'multiselect'
            : null;
        },
        name: 'options',
        message: reset('Select optional options:'),
        instructions: false,
        choices: (pre, values) => {
          const { framework } = values;
          return framework?.options?.map(option => {
            return {
              title: option.name,
              value: option.id,
              selected: option.selected || false,
            } as Choice;
          });
        },
      },
      {
        type: (pre, values) => {
          return gitRepos.length &&
            Array.isArray(values.options) &&
            values.options.includes('publish')
            ? 'select'
            : null;
        },
        name: 'gitUserUrl',
        message: reset('Which git repository to publish to?'),
        choices: gitRepos.map(repo => {
          const title = getGitUserUrl(repo);
          return {
            title,
            value: title,
          };
        }),
      },
    ],
    {
      onCancel: () => {
        console.log(red('✖') + ' Operation cancelled');
        throw new Error();
      },
    },
  );

  // user choice associated with prompts
  const { framework, overwrite, packageName, variant, gitUserUrl } = result;

  const options = result.options || [];

  const root = path.join(cwd, pureTargetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(`\nScaffolding project in ${root}...`);

  const template: string = variant || framework?.name || argTemplate || '';

  const getTemplateDir = (template: string) =>
    path.join(fileURLToPath(import.meta.url), '../..', `template-${template}`);

  const templateDir = getTemplateDir(template);

  const isNode = template.includes('node');
  // copy template files
  [getTemplateDir('config'), templateDir].forEach(dir => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const destFile = file.startsWith('_') ? file.replace('_', '.') : file;
      if (
        ((isNode && !options.includes('examples')) || template === 'vscode') &&
        file.includes('stylelint')
      ) {
        continue;
      }

      copy(path.join(dir, file), path.join(root, destFile));
    }
  });

  const pkgName = packageName || getProjectName();

  // get git user info
  const gitUser = {
    name: getGitInfo('user.name') || os.userInfo().username,
    email: getGitInfo('user.email') || '',
  };

  const textVars = {
    'pkg.name': pkgName,
    'user.name': gitUser.name,
    'user.email': gitUser.email,
    'git.org': getOrgName(),
    'git.url': getGitUrl(),
    'git.fullUrl': getFullGitUrl(),
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

  handlePkgJson();

  // conditionally change files
  if (isNode) {
    handleReplaceContent();
    handleTest();
    handleExample();
    handleWorkspace();
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  // git init
  if (shell.which('git')) {
    shell.exec(`cd ${root} && git init`);
    if (options.includes('publish')) {
      shell.exec(`cd ${root} && git remote add origin ${getFullGitUrl(options.includes('ssh'))}`);
    }
  }

  const cdProjectName = path.relative(cwd, root);
  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`);
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }

  function readPkgJson() {
    return readJson(path.join(root, 'package.json'));
  }

  function writePkgJson(data: any) {
    writeJson(path.join(root, 'package.json'), data);
  }

  function readPkgFile() {
    return readFile(path.join(root, 'package.json'));
  }

  function writePkgFile(data: any) {
    writeFile(path.join(root, 'package.json'), data);
  }

  /**
   * replace template name and user info
   */
  function handleReplaceContent() {
    replaceOptionFiles('.lintstagedrc.cjs', 'tsconfig.json');

    const isDevPkg =
      options.find(s => ['vite-plugin'].includes(s)) ||
      ['cli', 'plugin'].find(s => pkgName.includes(`-${s}`));
    const pkgInstall = ['pnpm', 'yarn', 'npm']
      .map(s => `# ${s}\n${s} add ${pkgName}${isDevPkg ? ' -D' : ''}`)
      .join('\n\n');

    ['LICENSE', 'README.md', 'README.zh_CN.md'].forEach(name => {
      const file = path.join(root, name);
      if (!options.includes('publish')) {
        if (fs.existsSync(file)) {
          fs.rmSync(file);

          if (name === 'README.md') {
            fs.writeFileSync(file, `# ${pkgName}\n`, { encoding: 'utf-8' });
          }
          return;
        }
      }

      if (!fs.existsSync(file)) {
        return;
      }

      const newTextVars = Object.assign({}, textVars, {
        'pkg.install': pkgInstall,
      });

      let content = fs.readFileSync(file, 'utf-8');
      Object.keys(newTextVars).forEach(key => {
        content = content.replace(new RegExp('{{' + key + '}}', 'g'), newTextVars[key]);
      });

      fs.writeFileSync(file, content, 'utf8');
    });
  }

  function removeDevPkgDeps(pkg, ...names: string[]) {
    removePkgDeps(pkg.devDependencies, ...names);
  }

  function removePkgPeerDeps(pkg, ...names: string[]) {
    removePkgDeps(pkg.peerDependencies, ...names);
  }

  function removePkgDeps(pkgDeps: any, ...names: string[]) {
    function checkDep(dep: string, name: string) {
      if (dep.includes('@')) {
        return dep
          .replace('@', '')
          .split('/')
          .find(s => checkDep(s, name));
      }
      return name === dep || dep.includes(`-${name}`) || dep.includes(`${name}-`);
    }

    const obj = pkgDeps || {};

    Object.keys(obj || {}).forEach(key => {
      if (names.find(name => checkDep(key, name))) {
        delete obj[key];
      }
    });
  }

  function removeFilesOrDirs(...files: string[]) {
    if (!Array.isArray(files) || files.length === 0) {
      return;
    }
    files.forEach(s => {
      const file = path.join(root, s);
      if (fs.existsSync(file)) {
        rmSync(file);
      }
    });
  }

  function replaceFileContent(
    fileName: string,
    searchValue: string | RegExp,
    replaceValue: string,
  ) {
    const filePath = path.join(root, fileName);
    let content = readFile(filePath);
    content = content.replaceAll(searchValue, replaceValue);
    writeFile(filePath, content);
  }

  function handlePkgJson() {
    const pkg = readPkgJson();
    pkg.name = pkgName;

    if (!options.includes('publish')) {
      delete pkg.author;
      delete pkg.publishConfig;
      delete pkg.repository;
      delete pkg.scripts.prepublishOnly;
      delete pkg.devDependencies.np;
    }

    if (isNode) {
      if (options.includes('vite')) {
        pkg.scripts.dev = 'vite';
        pkg.scripts.build = 'vite build';

        removeDevPkgDeps(pkg, 'tsup');
        removeFilesOrDirs('tsup.config.ts');
      } else {
        pkg.scripts.dev = 'tsup --watch';
        pkg.scripts.build = 'tsup';

        removeFilesOrDirs('vite.config.ts');

        if (!options.includes('vite-plugin')) {
          removeDevPkgDeps(pkg, 'vite');
          replaceFileContent('tsup.config.ts', `'vite'`, '');
        }
      }

      if (!options.includes('vite-plugin')) {
        removePkgPeerDeps(pkg, 'vite');
      }
    }

    writePkgJson(pkg);

    let text = readPkgFile();
    Object.keys(textVars).forEach(key => {
      text = text.replace(new RegExp('{{' + key + '}}', 'g'), textVars[key]);
    });

    writePkgFile(text);
  }

  function replaceOptionFile(fileName: string, option: PromptOption) {
    const lastIndex = fileName.lastIndexOf('.');
    const propName =
      fileName.substring(0, lastIndex) + '.' + option + fileName.substring(lastIndex);
    const filePath = path.join(root, fileName);
    const propFilePath = path.join(root, propName);

    if (!fs.existsSync(propFilePath)) {
      return;
    }

    if (options.includes(option)) {
      rmSync(filePath);
      renameSync(propFilePath, filePath);
    } else {
      rmSync(propFilePath);
    }
  }

  function replaceOptionFiles(...fileNames: string[]) {
    fileNames.forEach(fileName => {
      ALL_PROMPT_OPTIONS.forEach(option => {
        replaceOptionFile(fileName, option);
      });
    });
  }

  /**
   * handle test
   */
  function handleTest() {
    const pkg = readPkgJson();

    if (options.includes('test')) {
      if (!options.includes('workspace')) {
        removeFilesOrDirs('vitest.workspace.ts');
      }
      return;
    }

    delete pkg.scripts.test;
    pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',test', '');

    // remove vitest deps
    removeDevPkgDeps(pkg, 'vitest');
    writePkgJson(pkg);

    removeFilesOrDirs('test', 'vitest.workspace.ts');
  }

  function handleExample() {
    if (!options.includes('examples')) {
      const pkg = readPkgJson();
      pkg.scripts['lint'] = pkg.scripts['lint'].replace(' lint:stylelint', '');
      pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',examples', '');
      delete pkg.scripts['lint:stylelint'];

      removeDevPkgDeps(pkg, 'stylelint');

      writePkgJson(pkg);
      return;
    }

    const examplePath = path.join(root, 'examples');
    fs.mkdirSync(examplePath);
    ['vue', 'react'].forEach(lang => {
      const srcPath = getTemplateDir(lang);
      const destPath = path.join(examplePath, lang);
      if (!fs.existsSync(srcPath)) {
        console.log(`${yellow(srcPath)} template is not exist`);
        return;
      }
      fs.cpSync(srcPath, destPath, { recursive: true });

      // remove other lint deps
      const pkg = readPkgJson();

      // remove lint scripts
      Object.keys(pkg.scripts).forEach(s => {
        if (s.startsWith('lint') || ['prepare'].includes(s)) {
          delete pkg.scripts[s];
        }
      });

      removeDevPkgDeps(
        pkg,
        'eslint',
        'prettier',
        'stylelint',
        'commitlint',
        'husky',
        'lint-staged',
        'tsconfig',
        'lint-staged',
        'npm-run-all',
      );
      writePkgJson(pkg);

      // remove files
      ['_lintstagedrc.cjs'].forEach(s => {
        const file = path.join(destPath, s);
        if (fs.existsSync(file)) {
          fs.rmSync(file, { recursive: true });
        }
      });
    });
  }

  function handleWorkspace() {
    const packages: string[] = [];
    if (options.includes('examples')) {
      packages.push('examples');
    }

    const pkg = readPkgJson();
    if (options.includes('workspace')) {
      packages.push('packages');

      delete pkg.private;
      delete pkg.version;
      delete pkg.description;
      delete pkg.keywords;
      delete pkg.license;
      delete pkg.main;
      delete pkg.module;
      delete pkg.types;
      delete pkg.exports;
      delete pkg.files;
      delete pkg.publishConfig;
      delete pkg.repository;
    } else {
      delete pkg.private;
    }
    writePkgJson(pkg);

    if (packages.length) {
      writeFile(
        path.join(root, 'pnpm-workspace.yaml'),
        `packages:
${packages.map(s => `  - '${s}/*'`).join('\n')}`,
      );
    }
  }
}

beforeCreate()
  .then(async () => {
    return createApp().catch((e: any) => {
      if (e.message) {
        console.error(e);
      }
    });
  })
  .catch((e: any) => {
    if (e.message) {
      console.error(e);
    }
  });
