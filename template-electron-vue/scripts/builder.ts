import type { Configuration } from 'electron-builder';
import pkg from '../package.json';

/**
 * @see https://www.electron.build/configuration/configuration
 */
export default {
  appId: 'com.xxx.app',
  productName: 'App',
  directories: {
    output: `build/${pkg.version}`,
    app: 'dist',
  },
  files: ['main.mjs', 'preload.mjs', 'render'],
  icon: 'public/img/icon.png',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  electronLanguages: ['zh-CN', 'en-US'],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  mac: {
    target: ['dmg'],
  },
  linux: {
    target: ['AppImage'],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },
} as Configuration;
