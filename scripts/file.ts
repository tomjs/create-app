import path from 'node:path';
import { readJson, writeJson } from '@tomjs/node';
import { glob } from 'tinyglobby';

const __dirname = new URL('.', import.meta.url).pathname;
const root = path.join(__dirname, '..');

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
        if (!configDeps[key]) {
          configDeps[key] = deps[key];
        }
      });
    });
  }

  configPkg.dependencies = configDeps;
  await writeJson(path.join(root, configPackageJsonPath), configPkg);
}

await genRootPackageJson();
