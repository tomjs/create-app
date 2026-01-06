import { defineConfig } from 'tsdown';
import pkg from './package.json';

export default defineConfig((cfg) => {
  return {
    entry: 'src/index.ts',
    target: 'node16.17',
    format: 'cjs',
    external: ['hbuilderx'],
    noExternal: cfg.watch ? [] : Object.keys(pkg.dependencies || {}),
    fixedExtension: false,
  };
});
