import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build as electronBuild } from 'electron-builder';
import shell from 'shelljs';
import pkg from '../package.json';
import builderConfig from './builder';
import { DIST_PATH, ELECTRON_DEPENDENCIES } from './constants';

function genPkgJson() {
  const pkgJson = {
    name: pkg.name,
    version: pkg.version,
    author: os.userInfo().username,
    description: pkg.description,
    main: './main.js',
    type: 'module',
    dependencies: Object.entries(Object.assign({}, pkg.dependencies, pkg.devDependencies))
      .filter(([name]) => ELECTRON_DEPENDENCIES.includes(name))
      .reduce((object, entry) => ({ ...object, [entry[0]]: entry[1] }), {}),
  };

  fs.writeFileSync(path.join(DIST_PATH, 'package.json'), JSON.stringify(pkgJson, undefined, 2));
}

async function run() {
  try {
    genPkgJson();
    // 安装依赖
    shell.exec(`cd ${DIST_PATH} && npm install`);
    console.log();
    await electronBuild({ config: builderConfig });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run().then(() => {
  process.exit(0);
});
