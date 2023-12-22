#!/usr/bin/env node
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
import { Framework, PromptOption, PromptResult } from './types';
import {
  Args,
  copy,
  emptyDir,
  formatArgs,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  readJson,
  rmSync,
  toValidPackageName,
  writeJson,
} from './utils';

// cli args
const argv = formatArgs(minimist<Args>(process.argv.slice(2), { string: ['_'] }));
const cwd = process.cwd();

const FRAMEWORKS: Framework[] = [
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
      { id: 'publish', name: 'Git Repository + NPM Publish' },
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
  {
    name: 'node',
    display: 'Node',
    color: lightYellow,
    options: [
      { id: 'test', name: 'Test' },
      { id: 'publish', name: 'Git Repository + NPM Publish' },
      { id: 'ssh', name: 'Git init by SSH' },
      { id: 'vite', name: 'Vite Plugin' },
      { id: 'electron', name: 'Electron' },
      { id: 'examples', name: 'Examples' },
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
  return targetDir.length > 1 ? targetDir.substring(targetDir.indexOf('/') + 1) : targetDir;
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
            };
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
  [templateDir, getTemplateDir('config')].forEach(dir => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const destFile = file.startsWith('_') ? file.replace('_', '.') : file;
      if (
        ((isNode && !options.includes('examples')) || template === 'vscode') &&
        file.includes('stylelint')
      ) {
        continue;
      }

      const targetPath = path.join(root, destFile);
      copy(path.join(dir, file), targetPath);
    }
  });

  const pkgName = packageName || getProjectName();

  // get git user info
  const gitUser = {
    name: 'UserName',
    email: 'name@github.com',
  };

  function getGitUrl(ssh = false) {
    const regName = pkgName.startsWith('@')
      ? pkgName.split('/')[0].substring(1)
      : camelCase(gitUser.name);
    let url = gitUserUrl || `https://github.com/${regName}`;
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
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  // git init
  if (shell.which('git')) {
    shell.exec(`cd ${root} && git init`);
    if (options.includes('publish')) {
      shell.exec(`cd ${root} && git remote add origin ${getGitUrl(options.includes('ssh'))}`);
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

  /**
   * replace template name and user info
   */
  function handleReplaceContent() {
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
      const content = fs
        .readFileSync(file, 'utf-8')
        .replace(new RegExp('{{pkg.name}}', 'g'), pkgName)
        .replace(new RegExp('{{user.name}}', 'g'), gitUser.name)
        .replace(new RegExp('{{user.email}}', 'g'), gitUser.email);

      fs.writeFileSync(file, content);
    });
  }

  function removeDeps(pkg, ...names) {
    ['dependencies', 'devDependencies'].forEach(key => {
      Object.keys(pkg[key] || {}).forEach(dep => {
        if (names.find(name => dep.includes(name))) {
          delete pkg[key][dep];
        }
      });
    });
  }

  function handlePkgJson() {
    const pkg = readJson(path.join(root, `package.json`));
    pkg.name = pkgName;

    if (options.includes('publish')) {
      if (shell.which('git')) {
        gitUser.name = getGitInfo('user.name') || os.userInfo().username;
        gitUser.email = getGitInfo('user.email') || '';
        pkg.author = Object.assign({}, pkg.author, gitUser);
      }

      pkg.publishConfig = {
        access: 'public',
        registry: 'https://registry.npmjs.org/',
      };

      pkg.repository ??= {
        type: 'git',
      };
      pkg.repository.url = `git+${getGitUrl()}`;
    } else {
      delete pkg.author;
      delete pkg.publishConfig;
      delete pkg.repository;
      delete pkg.scripts.prepublishOnly;
      delete pkg.devDependencies.np;
    }

    if (isNode) {
      if (!options.includes('electron')) {
        removeDeps(pkg, 'electron');
        pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',electron', '');
      }

      if (!options.includes('vite')) {
        removeDeps(pkg, 'vite');
      }
    }

    writeJson(path.join(root, 'package.json'), pkg);
  }

  function replaceOptionFile(fileName: string, option: PromptOption) {
    const lastIndex = fileName.lastIndexOf('.');
    const propName =
      fileName.substring(0, lastIndex) + '.' + option + fileName.substring(lastIndex);
    const filePath = path.join(root, fileName);
    const propFilePath = path.join(root, propName);

    if (options.includes(option)) {
      rmSync(filePath);
      if (fs.existsSync(propFilePath)) {
        renameSync(propFilePath, filePath);
      }
    } else {
      rmSync(propFilePath);
    }
  }

  /**
   * handle test
   */
  function handleTest() {
    replaceOptionFile('tsconfig.json', 'test');
    replaceOptionFile('jest.config.cjs', 'electron');

    if (options.includes('test')) {
      return;
    }

    // test config and folder
    fs.readdirSync(root)
      .filter(s => s.startsWith('jest.config') || ['test'].includes(s))
      .forEach(file => {
        rmSync(path.join(root, file));
      });

    // package.json
    const pkgPath = path.join(root, `package.json`);
    const pkg = readJson(pkgPath);
    delete pkg.scripts.test;
    pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',test', '');

    // remove jest deps
    removeDeps(pkg, 'jest');

    writeJson(pkgPath, pkg);
  }

  function handleExample() {
    // .lintstagedrc.cjs
    replaceOptionFile('.lintstagedrc.cjs', 'examples');

    if (!options.includes('examples')) {
      // package.json
      const pkg = readJson(path.join(root, `package.json`));
      pkg.scripts['lint'] = pkg.scripts['lint'].replace(' lint:stylelint', '');
      pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',examples', '');
      delete pkg.scripts['lint:stylelint'];

      removeDeps(pkg, 'stylelint');

      writeJson(path.join(root, `package.json`), pkg);
      return;
    }

    const examplePath = path.join(root, 'examples');
    fs.mkdirSync(examplePath);
    const isElectron = options.includes('electron');
    ['vue', 'react'].forEach(lang => {
      const srcPath = getTemplateDir(isElectron ? `electron-${lang}` : lang);
      const destPath = path.join(examplePath, lang);
      if (!fs.existsSync(srcPath)) {
        console.log(`${yellow(srcPath)} template is not exist`);
        return;
      }
      fs.cpSync(srcPath, destPath, { recursive: true });

      // remove other lint deps
      const pkg = readJson(path.join(destPath, 'package.json'));

      // remove lint scripts
      Object.keys(pkg.scripts).forEach(s => {
        if (s.startsWith('lint') || ['prepare'].includes(s)) {
          delete pkg.scripts[s];
        }
      });

      removeDeps(
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
      writeJson(path.join(destPath, 'package.json'), pkg);

      // remove files
      ['_lintstagedrc.cjs'].forEach(s => {
        const file = path.join(destPath, s);
        if (fs.existsSync(file)) {
          fs.rmSync(file, { recursive: true });
        }
      });
    });

    fs.writeFileSync(
      path.join(root, 'pnpm-workspace.yaml'),
      `packages:
  - 'examples/*'`,
      { encoding: 'utf-8' },
    );
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
