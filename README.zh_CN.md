# @tomjs/create-app

[English](./README.md) | **中文**

![npm](https://img.shields.io/npm/v/@tomjs/create-app) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/create-app) ![NPM](https://img.shields.io/npm/l/@tomjs/create-app)

> 创建基于 [vite](https://github.com/vitejs/vite) + [tomjs](https://github.com/tomjs) 的 web 应用。

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

你也可以直接指定项目名、模板。

```bash
# pnpm
pnpm create @tomjs/app my-app --template vue

# yarn
yarn create @tomjs/app my-app --template vue

# npm 7+，需要额外的双破折号：
npm create @tomjs/app@latest my-app -- --template vue
```

参数说明:

- `-t --template`：指定模板
- `--git`：git 仓库配置

支持模板:

- vue
- react
- electron-vue
- electron-react
- node

## 参考项目

- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
