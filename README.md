# @tomjs/create-app

![npm](https://img.shields.io/npm/v/@tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/create-app) ![NPM](https://img.shields.io/npm/l/@tomjs/create-app)

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

create tomjs web app

Usage
  $ create-app [name] [options]

  name                  The package name

Options
  --cwd                 The current working directory (default: ".")
  -e, --example         Only create examples
  -p, --package         Only create packages
  --git                 Only manage git repository
  --verbose             Display verbose output
  -h, --help            Display this message
  -v, --version         Display version number

Examples
  $ create-app my-project
```

Support templates:

- vue
- react
- electron-vue
- electron-react
- node
- node-cli
- node-cli-legacy
- node-vite-plugin
- node-workspaces
- vscode
- vscode-vue
- vscode-react

## Reference project

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
