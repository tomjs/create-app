#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blue, cyan, green, red, reset, yellow } from 'kolorist';
import { camelCase } from 'lodash-es';
import minimist from 'minimist';
import prompts from 'prompts';
import shell from 'shelljs';
import {
  Args,
  copy,
  emptyDir,
  formatArgs,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  toValidPackageName,
} from './utils';

// cli args
const argv = formatArgs(minimist<Args>(process.argv.slice(2), { string: ['_'] }));
const cwd = process.cwd();

type ColorFunc = (str: string | number) => string;

type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  variants?: FrameworkVariant[];
};

type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  customCommand?: string;
};

interface PromptResult {
  projectName?: string;
  overwrite?: boolean;
  overwriteChecker?: any;
  packageName?: string;
  framework?: Framework;
  variant?: string;
  publish?: boolean;
}

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
    variants: [
      {
        name: 'node',
        display: 'Base',
        color: blue,
      },
      {
        name: 'node-electron',
        display: 'Electron',
        color: yellow,
      },
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
        type: (pre, values: PromptResult) => {
          const { variant, framework } = values;
          const { publish, variants } = framework || {};
          if (!publish && !variants?.find(s => s.name === variant && s.publish)) {
            return;
          }

          return 'toggle';
        },
        name: 'publish',
        message: reset('Whether to publish to the npm repository?'),
        initial: true,
        active: 'yes',
        inactive: 'no',
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
  const { framework, overwrite, packageName, variant, publish } = result;

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

  const templateName = `template-${template}`;

  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'));
  const pkgName = packageName || getProjectName();
  pkg.name = pkgName;

  // get git user info
  const gitUser = {
    name: 'UserName',
    email: 'name@github.com',
  };
  if (publish) {
    if (shell.which('git')) {
      gitUser.name = getGitInfo('user.name') || os.userInfo().username;
      gitUser.email = getGitInfo('user.email') || '';
      pkg.author = Object.assign(pkg.author, gitUser);
    }
    const regName = pkgName.startsWith('@')
      ? pkgName.split('/')[0].substring(1)
      : camelCase(gitUser.name);
    pkg.repository.url = `https://github.com/${regName}/${pkgName.substring(
      pkgName.indexOf('/') + 1,
    )}.git`;
  } else {
    delete pkg.author;
    delete pkg.publishConfig;
    delete pkg.repository;
    delete pkg.scripts.prepublishOnly;
    delete pkg.devDependencies.np;
  }

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  // package name in README eg.
  if (isNode) {
    ['LICENSE', 'README.md', 'README.zh_CN.md'].forEach(name => {
      const file = path.join(root, name);
      if (!publish) {
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
}

run().catch((e: any) => {
  if (e.message) {
    console.error(e);
  }
});
