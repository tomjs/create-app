# @tomjs/create-app

![npm](https://img.shields.io/npm/v/%40tomjs/create-app) ![NPM](https://img.shields.io/npm/l/%40tomjs%2Fcreate-app) ![npm package minimized gzipped size (scoped version select exports)](https://img.shields.io/bundlejs/size/%40tomjs/create-app)

创建基于 tomjs 配置的 web 应用，推荐 `node>=18`

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
npm create @tomjs/app@latest my-app -- --template vue --module
```

- 使用 `yarn`

```bash
yarn create @tomjs/app my-app --template vue --module
```

- 使用 `pnpm`

```bash
pnpm create @tomjs/app my-app --template vue --module
```

参数说明:

- `-t --template`：指定模板，可选值：`vue`、`react`
- `-m --module`：`package.json` 使用 `type:"module"`，否则使用 `commonjs`

支持模板:

- vue
- react

## 项目配置

项目配置在 `package.json` 中，可配置项如下：

````json
{
  "name": "my-app",
  "version": "0.0.1",
  "description": "",
  "main": "src/main.ts",
}

## 项目结构

```bash
.
├── README.md
├── package.json
├── src
│   ├── App.vue
│   ├── main.ts
│   └── shims-vue.d.ts
├── tsconfig.json

## 参考项目

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
````
