# electron-vue

vite + electron + vue

## Description

- source code

```
├── electron
│   ├── main          > Electron-Main
│   ├── payload       > Preload-Scripts
├── src               > Electron-Renderer
```

- output

```
├─┬ dist
│ ├── main.mjs        > Electron-Main
│ ├── preload.mjs     > Preload-Scripts
│ ├─┬ render          > Electron-Renderer
│ │ └── index.html
```

## Reference project

- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
