# @tomjs/create-app

![npm](https://img.shields.io/npm/v/@tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/create-app) ![NPM](https://img.shields.io/npm/l/@tomjs/create-app)

**English** | [中文](./README.zh_CN.md)

> Create a web application based on [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomjs).

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

You can also directly specify the project name, template.

```bash
# pnpm
pnpm create @tomjs/app my-app --template vue

# yarn
yarn create @tomjs/app my-app --template vue

# npm 7+, extra double-dash is needed:
npm create @tomjs/app@latest my-app -- --template vue
```

Parameters:

- `-t --template` : specify the template
- `--git`：git repository setting

Support templates:

- vue
- react
- electron-vue
- electron-react
- node

## Reference project

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
