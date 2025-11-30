# @tomjs/create-app

[English](./README.md) | **中文**

![npm](https://img.shields.io/npm/v/@tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/create-app) ![license](https://img.shields.io/npm/l/@tomjs/create-app)

> 创建基于 [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomjs) 的 web 应用。

仅提供给 [@tomjs](https://github.com/tomjs) 使用，不推荐他人使用。

## 创建项目

```bash
# pnpm
pnpm create @tomjs/app

# yarn
yarn create @tomjs/app

# npm
npm create @tomjs/app@latest
```

然后根据提示生成项目。

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

支持模板:

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

## 参考项目

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
