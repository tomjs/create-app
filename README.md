# @tomjs/create-app

![npm](https://img.shields.io/npm/v/%40tomjs/create-app) ![NPM](https://img.shields.io/npm/l/%40tomjs%2Fcreate-app) ![npm package minimized gzipped size (scoped version select exports)](https://img.shields.io/bundlejs/size/%40tomjs/create-app)

Create a web application based on the tomjs configuration, recommended `node>=18`

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
npm create @tomjs/app@latest my-app -- --template vue --module
```

- Using `yarn`

```bash
yarn create @tomjs/app my-app --template vue --module
```

- Using `pnpm`

```bash
pnpm create @tomjs/app --template vue --module
```

Parameters:

- `-t --template` : specify the template, optional values: `vue` , `react`
- `-m --module` : `package.json` uses `type:"module"`, otherwise use `commonjs`

Support templates:

- vue
- react

## Reference project

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
