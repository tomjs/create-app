# hbuilderx-vue

`window.createWebView` 或 `window.createWebViewDialog` 创建 `vue` 网页视图

## 使用

```bash
# 开发模式，不压缩代码
pnpm dev
# 生产模式，压缩代码
pnpm build
```

## 调试

根据以下步骤调试插件，具体参考官方[插件教程](https://hx.dcloud.net.cn/ExtensionTutorial/firstExtension)

- 将当前项目 `hbuilderx-vue` 拖拽到 `HBuilderX` 中
- 点击左上 `运行` 图标，选择点击 `运行插件-[hbuilderx-vue]` 或 `调试插件-[hbuilderx-vue]`，会打开的 `HBuilderX` 窗口调试插件。
- 在调试导入或创建任意项目，打开任意文件，在文件编辑器中点击鼠标右唤出菜单，选择 `触发左侧视图`、`触发右侧视图`、`触发弹框视图`，会分别打开或弹出视图。

网页调试

- 可以使用 [vite-plugin-vue-devtools](https://devtools.vuejs.org/guide/vite-plugin) 这个 `vite` 插件直接在页面调试
- 可以使用 [vue-devtools](https://devtools.vuejs.org/guide/standalone) 这个独立应用调试 `webview`
- 可以使用 `Google Chrome`，在地址栏输入 `chrome://inspect/#devices` 访问。如果 `Remote Target` 不显示，打开 `HBuilderX` 调试插件的控制台，查看会看到 `DevTools listening on ws://127.0.0.1:9500/devtools/browser/e964a967-04da-48f2-8656-9ba933f39e59`, 配置 `Discover network targets` 对应的 `localhost:9500` 即可。
