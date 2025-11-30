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

创建基于 tomjs 的 node/web/electron/vscode 的模板

Usage
  $ create-app [options] <dir>

  dir                  项目目录

Options
  -o, --overwrite       覆盖已存在的目录
  -p, --private         设为私有项目
  --verbose             显示详细日志
  -h, --help            显示帮助信息
  -v, --version         显示版本信息
```

支持模板:

- electron-vue
- electron-react
- node-base
- node-cli
- node-vite
- vscode-base
- vscode-vue
- vscode-react
- web-vue
- web-react

## 参考项目

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
