import type { GitRepo, ProjectTemplateGroup } from './types';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

export const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url));

export const webFrameworks = ['vue', 'react'];

export const projectTemplates: ProjectTemplateGroup[] = [
  {
    name: 'node',
    display: 'Node',
    color: chalk.green,
    children: [
      {
        name: 'node-base',
        display: 'Base',
        color: chalk.green,
        public: 'npm',
      },
      {
        name: 'node-cli',
        display: 'CLI',
        color: chalk.green,
        public: 'npm',
      },
      {
        name: 'node-vite',
        display: 'Vite Plugin',
        value: 'vite-plugin-xxx',
        color: chalk.blue,
        hasStyle: true,
        public: 'npm',
      },
    ],
  },
  {
    name: 'web',
    display: 'Web',
    color: chalk.magenta,
    children: [
      {
        name: 'web-vue',
        display: 'Vue',
        color: chalk.green,
        hasStyle: true,
      },
      {
        name: 'web-react',
        display: 'React',
        color: chalk.blue,
        hasStyle: true,
      },
    ],
  },
  {
    name: 'vscode',
    display: 'VSCode',
    color: chalk.blue,
    children: [
      {
        name: 'vscode-base',
        display: 'Base',
        color: chalk.yellow,
        public: 'public',
      },
      {
        name: 'vscode-vue',
        display: 'Vue',
        color: chalk.green,
        commonTemplates: ['vscode'],
        hasStyle: true,
        public: 'public',
      },
      {
        name: 'vscode-react',
        display: 'React',
        color: chalk.blue,
        commonTemplates: ['vscode'],
        hasStyle: true,
        public: 'public',
      },
    ],
  },
  {
    name: 'electron',
    display: 'Electron',
    color: chalk.cyan,
    children: [
      {
        name: 'electron-vue',
        display: 'Vue',
        color: chalk.green,
        commonTemplates: ['electron'],
        hasStyle: true,
      },
      {
        name: 'electron-react',
        display: 'React',
        color: chalk.blue,
        commonTemplates: ['electron'],
        hasStyle: true,
      },
    ],
  },
  {
    name: 'hbuilderx',
    display: 'HBuilderX',
    color: chalk.yellow,
    children: [
      {
        name: 'hbuilderx-base',
        display: 'Base',
        color: chalk.yellow,
        public: 'public',
      },
      {
        name: 'hbuilderx-vue',
        display: 'Vue',
        color: chalk.green,
        commonTemplates: ['hbuilderx'],
        hasStyle: true,
        public: 'public',
      },
      {
        name: 'hbuilderx-react',
        display: 'React',
        color: chalk.blue,
        commonTemplates: ['hbuilderx'],
        hasStyle: true,
        public: 'public',
      },
    ],
  },
];

export const gitRepos: GitRepo[] = [
  { id: 'github', name: 'Github', url: 'https://github.com' },
  { id: 'gitcode', name: 'GitCode', url: 'https://gitcode.com' },
  { id: 'gitee', name: '码云', url: 'https://gitee.com' },
];

export const packageSortFields = [
  'publisher',
  'name',
  'displayName',
  'type',
  'version',
  'private',
  'packageManager',
  'description',
  'author',
  'contributors',
  'license',
  'funding',
  'homepage',
  'repository',
  'publishConfig',
  'bugs',
  'keywords',
  'categories',
  'sideEffects',
  'imports',
  'exports',
  'main',
  'module',
  'unpkg',
  'jsdelivr',
  'types',
  'typesVersions',
  'bin',
  'icon',
  'files',
  'engines',
  'activationEvents',
  'contributes',
  'scripts',
  'peerDependencies',
  'peerDependenciesMeta',
  'dependencies',
  'optionalDependencies',
  'devDependencies',
  'pnpm',
  'overrides',
  'resolutions',
  'husky',
  'simple-git-hooks',
  'lint-staged',
  'eslintConfig',
];

export const packageScriptsSortKeys = [
  'dev',
  'dev:',
  'debug',
  'debug:',
  'start',
  'build',
  'build:',
  'preview',
  'release',
  'release:',
  'clean',
  'clean:',
  'test',
  'lint',
  'lint:',
];
