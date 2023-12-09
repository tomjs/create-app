# electron-vue

vite + electron + vue

## Description

- Recommended `electron` front-end code directory structure

```
|--electron
|  |--main
|  |  |--index.ts
|  |--preload
|  |  |--index.ts
|--src
|  |--App.vue
|  |--main.ts
```

- Use the default dist output directory of the plugin

```
|--dist
|  |--main
|  |  |--index.js
|  |  |--index.js.map
|  |--preload
|  |  |--index.js
|  |  |--index.js.map
|  |--renderer
|  |  |--index.html
```

## Reference project

- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
