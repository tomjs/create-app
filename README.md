# @tomjs/create-app

![npm](https://img.shields.io/npm/v/%40tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/%40tomjs/create-app) ![NPM](https://img.shields.io/npm/l/%40tomjs%2Fcreate-app)

Create a web application based on [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomgao365/tomjs).

**English** | [中文](./README.zh_CN.md)

## Creating a Project

- Using `npm`

```bash
npm create @tomjs/app@latest
```

- Using `yarn`

```bash
yarn create @tomjs/app
```

- Using `pnpm`

```bash
pnpm create @tomjs/app
```

Then generate the project based on the prompts.

You can also directly specify the project name, template, and module type.

- Using `npm`

```bash
npm create @tomjs/app@latest my-app -- --template vue
```

- Using `yarn`

```bash
yarn create @tomjs/app my-app --template vue
```

- Using `pnpm`

```bash
pnpm create @tomjs/app --template vue
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
