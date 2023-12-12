# electron-vue

vite + electron + vue

## Description

- Recommend `electron` and page `src` code directory structure

```
|--electron
|  |--main        // main process code
|  |  |--index.ts
|  |--preload     // preload process code
|  |  |--index.ts
|  |--build       // electron-builder resources for electron package
|  |  |--icons
|--src            // front-end code
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

## Debug

### Web debugging

Use [@tomjs/electron-devtools-installer](https://npmjs.com/package/@tomjs/electron-devtools-installer) to install the `Chrome Devtools` plugins and use it like web development

```ts
import { app } from 'electron';

app.whenReady().then(() => {
  const { installExtension, VUEJS_DEVTOOLS } = await import('@tomjs/electron-devtools-installer');

  installExtension(VUEJS_DEVTOOLS)
    .then(ext => {
      console.log('Added Extension: ', ext.name);
    })
    .catch(err => {
      console.log('Failed to install extensions');
      console.error(err);
    });
});
```

### Main thread debugging

#### Turn on debugging

Start code compilation through the following configuration or `ELECTRON_DEBUG=1 vite dev`

- Enable by setting `APP_ELECTRON_DEBUG=1` in `.env.development` file
- `vite.config.js` configures `electron({ debug: true })` to be turned on

#### VSCODE

Run `Debug Main Process` through `vscode` to debug the main thread. For debugging tools, refer to [Official Documentation](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` is configured as follows:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "envFile": "${workspaceFolder}/node_modules/@tomjs/vite-plugin-electron/debug/.env"
    }
  ]
}
```

## Reference project

- [electron-vite-vue](https://github.com/electron-vite/electron-vite-vue)
