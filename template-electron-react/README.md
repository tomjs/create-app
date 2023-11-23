# electron-react

vite + electron + react

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
│ ├── main.js        > Electron-Main
│ ├── preload.js     > Preload-Scripts
│ ├─┬ render         > Electron-Renderer
│ │ └── index.html
```

## Reference project

- [electron-vite-react](https://github.com/electron-vite/electron-vite-react)
