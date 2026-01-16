# @tomjs/create-app

![npm](https://img.shields.io/npm/v/@tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/create-app) ![license](https://img.shields.io/npm/l/@tomjs/create-app)

**English** | [中文](./README.zh_CN.md)

> Create a web application based on [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomjs).

This is only provided to [@tomjs](https://github.com/tomjs) and is not recommended for others to use.

## Creating a Project

```bash
# pnpm
pnpm create @tomjs/app

# yarn
yarn create @tomjs/app

# npm
npm create @tomjs/app@latest
```

Then generate the project based on the prompts.

```bash
$ pnpm create @tomjs/app -h

Create a node/web/electron/vscode project based on tomjs

Usage
  $ create-app [options] <package-name>

  package-name          Package name

Options
  --cwd                 Current working directory
  --overwrite, -o       Overwrite existing project
  --package, -p         Create a package for the workspace project
  --private             Set as private project
  --verbose             Show verbose logs
  --help, -h            Show help information
  --version, -v         Show version information
```

Support templates:

- electron-vue
- electron-react
- hbuilderx-base
- hbuilderx-react
- hbuilderx-vue
- node-base
- node-cli
- node-vite
- vscode-base
- vscode-vue
- vscode-react
- web-vue
- web-react

## Reference project

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
