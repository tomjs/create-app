import path from 'node:path';
import { readJson, writeFile } from '@tomjs/node';
import { glob } from 'tinyglobby';

const __dirname = new URL('.', import.meta.url).pathname;
const root = path.join(__dirname, '..');

const ignorePkgs = ['@tomjs/vite-plugin-xxx'];

async function genRootPackageJson() {
  const configPackageJsonPath = 'templates/config/package.json';

  const configPkg = await readJson(path.join(root, configPackageJsonPath));
  const configDeps = configPkg.dependencies || {};
  const packages = await glob('templates/**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/out/**', configPackageJsonPath],
  });

  for (const pkgPath of packages) {
    const pkgFilePath = path.join(root, pkgPath);
    const pkg = await readJson(pkgFilePath);
    ['dependencies', 'devDependencies'].forEach((depKey) => {
      const deps = pkg[depKey];
      if (!deps) {
        return;
      }
      Object.keys(deps).forEach((key) => {
        if (ignorePkgs.includes(key)) {
          return;
        }

        if (!configDeps[key]) {
          configDeps[key] = deps[key];
        }
      });
    });
  }

  const newDeps: Record<string, string> = {};
  Object.keys(configDeps).sort().forEach((key) => {
    newDeps[key] = configDeps[key];
  });

  configPkg.dependencies = newDeps;
  await writeFile(path.join(root, configPackageJsonPath), `${JSON.stringify(configPkg, null, 2)}\n`);
}

await genRootPackageJson();
