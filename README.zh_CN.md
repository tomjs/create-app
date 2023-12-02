# @tomjs/create-app

![npm](https://img.shields.io/npm/v/%40tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/%40tomjs/create-app) ![NPM](https://img.shields.io/npm/l/%40tomjs%2Fcreate-app)

创建基于 [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomgao365/tomjs) 的 web 应用。

[English](./README.md) | **中文**

## 创建项目

- 使用 `npm`

```bash
npm create @tomjs/app@latest
```

- 使用 `yarn`

```bash
yarn create @tomjs/app
```

- 使用 `pnpm`

```bash
pnpm create @tomjs/app
```

然后根据提示生成项目。

你也可以直接指定项目名、模板、module类型

- 使用 `npm`

```bash
npm create @tomjs/app@latest
npm create @tomjs/app@latest my-app -- --template vue
```

- 使用 `yarn`

```bash
yarn create @tomjs/app my-app --template vue
```

- 使用 `pnpm`

```bash
pnpm create @tomjs/app my-app --template vue
```

参数说明:

- `-t --template`：指定模板

支持模板:

- vue
- react
- electron-vue
- electron-react
- node
- node-electron

## 参考项目

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
