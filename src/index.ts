#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blue, cyan, green, red, reset, yellow } from 'kolorist';
import minimist from 'minimist';
import prompts from 'prompts';
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
  variants: FrameworkVariant[];
};

type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  customCommand?: string;
};

interface PromptResult {
  projectName?: string;
  overwrite?: boolean;
  overwriteChecker?: any;
  packageName?: string;
  framework?: Framework;
  variant?: string;
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
];

const TEMPLATES = FRAMEWORKS.map(
  f => (f.variants && f.variants.map(v => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

const renameFiles: Record<string, string> = {
  _gitignore: '.gitignore',
  '_lintstagedrc.cjs': '.lintstagedrc.cjs',
};

const defaultTargetDir = 'my-app';

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
          framework.variants.map(variant => {
            const variantColor = variant.color;
            return {
              title: variantColor(variant.display || variant.name),
              value: variant.name,
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

  const root = path.join(cwd, targetDir);

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

  // copy template files
  [templateDir, getTemplateDir('config')].forEach(dir => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const destFile = renameFiles[file] ?? file;

      const targetPath = path.join(root, destFile);
      copy(path.join(dir, file), targetPath);
    }
  });

  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'));
  pkg.name = packageName || getProjectName();

  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

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
