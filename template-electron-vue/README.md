# electron-vue

vite + electron + vue

## Description

- Recommend `electron` and page `src` code directory structure

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

- Zero configuration, default dist output directory

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
