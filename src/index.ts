#!/usr/bin/env node
import fs, { rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';
import { blue, cyan, green, red, reset, yellow } from 'kolorist';
import { camelCase } from 'lodash-es';
import minimist from 'minimist';
import prompts from 'prompts';
import shell from 'shelljs';
import { Framework, PromptResult } from './types';
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
  toValidPackageName,
} from './utils';

// cli args
const argv = formatArgs(minimist<Args>(process.argv.slice(2), { string: ['_'] }));
const cwd = process.cwd();

const FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue',
        display: 'Web',
        color: blue,
      },
      {
        name: 'electron-vue',
        display: 'Electron',
        color: yellow,
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react',
        display: 'Web',
        color: blue,
      },
      {
        name: 'electron-react',
        display: 'Electron',
        color: yellow,
      },
    ],
  },
  {
    name: 'node',
    display: 'Node',
    color: blue,
    publish: true,
    test: true,
    props: [
      { id: 'test', name: 'Test' },
      { id: 'publish', name: 'Github + NPM' },
      { id: 'vite', name: 'Vite Plugin' },
      { id: 'electron', name: 'Electron' },
      { id: 'example', name: 'Examples' },
    ],
  },
];

const TEMPLATES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

const renameFiles: Record<string, string> = {
  _gitignore: '.gitignore',
  '_lintstagedrc.cjs': '.lintstagedrc.cjs',
};

const defaultTargetDir = 'my-app';

function getGitInfo(name: string) {
  const result = shell.exec(`git config --get ${name}`, { silent: true });
  if (result.code === 0) {
    return result.stdout.trim();
  }
}

async function run() {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;

  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () => (targetDir === '.' ? path.basename(path.resolve()) : targetDir);

  let result: PromptResult = {};

  result = await prompts(
    [
      {
        type: argTargetDir ? null : 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: state => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir;
        },
      },
      {
        type: () => (!fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'toggle'),
        name: 'overwrite',
        message: () =>
          (targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`) +
          ` is not empty. Remove existing files and continue?`,
        initial: false,
        active: 'yes',
        inactive: 'no',
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
        type: (framework: Framework) => {
          return framework && Array.isArray(framework.props) && framework.props.length
            ? 'multiselect'
            : null;
        },
        name: 'props',
        message: reset('Select optional options:'),
        instructions: false,
        choices: (framework: Framework) =>
          framework?.props?.map(prop => {
            return {
              title: prop.name,
              value: prop.id,
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
  const { framework, overwrite, packageName, variant } = result;

  const props = result.props || [];

  const root = path.join(cwd, targetDir.substring(targetDir.indexOf('/') + 1));

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
      const destFile = renameFiles[file] ?? file;
      if (isNode && file.includes('stylelint')) {
        continue;
      }

      const targetPath = path.join(root, destFile);
      copy(path.join(dir, file), targetPath);
    }
  });

  const pkgName = packageName || getProjectName();
  const templateName = `template-${template}`;

  // get git user info
  const gitUser = {
    name: 'UserName',
    email: 'name@github.com',
  };
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
      if (!props.includes('publish')) {
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
      let content = fs
        .readFileSync(file, 'utf-8')
        .replace(new RegExp(templateName, 'g'), pkgName)
        .replace(new RegExp('{{user.name}}', 'g'), gitUser.name)
        .replace(new RegExp('{{user.email}}', 'g'), gitUser.email);

      if (name.startsWith('README')) {
        const pathName = pkgName.replace('@', '%40');
        const name = pkgName.replace('@', '%40').replace(new RegExp('/', 'g'), '%2F');
        content = content.replace(
          '{{badges}}',
          [
            `![npm](https://img.shields.io/npm/v/${pathName})`,
            `![node-current (scoped)](https://img.shields.io/node/v/${pathName})`,
            `![NPM](https://img.shields.io/npm/l/${name})`,
          ].join(' '),
        );
      }

      fs.writeFileSync(file, content);
    });
  }

  function removeDeps(pkg, name) {
    ['dependencies', 'devDependencies'].forEach(key => {
      Object.keys(pkg[key] || {}).forEach(dep => {
        if (dep.includes(name)) {
          delete pkg[key][dep];
        }
      });
    });
  }

  function handlePkgJson() {
    const pkg = readJson(path.join(root, `package.json`));

    if (props.includes('publish')) {
      if (shell.which('git')) {
        gitUser.name = getGitInfo('user.name') || os.userInfo().username;
        gitUser.email = getGitInfo('user.email') || '';
        pkg.author = Object.assign(pkg.author, gitUser);
      }
      const regName = pkgName.startsWith('@')
        ? pkgName.split('/')[0].substring(1)
        : camelCase(gitUser.name);
      pkg.repository.url = `git+https://github.com/${regName}/${pkgName.substring(
        pkgName.indexOf('/') + 1,
      )}.git`;
    } else {
      delete pkg.author;
      delete pkg.publishConfig;
      delete pkg.repository;
      delete pkg.scripts.prepublishOnly;
      delete pkg.devDependencies.np;
    }

    if (!props.includes('electron')) {
      removeDeps(pkg, 'electron');
      pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',electron', '');
    }

    if (!props.includes('vite')) {
      removeDeps(pkg, 'vite');
    }

    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  }

  /**
   * handle test prop
   */
  function handleTest() {
    if (props.includes('test')) {
      if (!props.includes('electron')) {
        // runner: '@kayahr/jest-electron-runner/main',
        const filePath = path.join(root, 'jest.config.js');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          fs.writeFileSync(
            filePath,
            content.replace(/\n {2}runner: '@kayahr\/jest-electron-runner\/main',/g, ''),
          );
        }
      }

      return;
    }

    // tsconfig.json
    const files = fs.readdirSync(root).filter(s => /tsconfig(\.\w+)?\.json/.test(s));
    files.forEach(file => {
      const cfgPath = path.join(root, file);
      if (fs.existsSync(cfgPath)) {
        const content = fs.readFileSync(cfgPath, 'utf-8');
        const json = JSON5.parse(content);
        ['include', 'exclude'].forEach(key => {
          if (json[key]) {
            json[key] = json[key].filter(s => !s.includes('test'));
          }
        });

        fs.writeFileSync(cfgPath, JSON.stringify(json, null, 2));
      }
    });

    ['jest.config.js', 'test'].forEach(name => {
      const file = path.join(root, name);
      if (fs.existsSync(file)) {
        rmSync(file, { force: true, recursive: true });
      }
    });

    // package.json
    const pkgPath = path.join(root, `package.json`);
    const pkg = readJson(pkgPath);
    delete pkg.scripts.test;
    pkg.scripts['lint:eslint'] = pkg.scripts['lint:eslint'].replace(',test', '');

    // remove jest deps
    removeDeps(pkg, 'jest');

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  function handleExample() {
    if (props.includes('example')) {
      return;
    }
    const examplePath = path.join(root, 'example');
    fs.mkdirSync(examplePath);
  }
}

run().catch((e: any) => {
  if (e.message) {
    console.error(e);
  }
});
