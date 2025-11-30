import type { Plugin } from 'vite';
import type { XxxPluginOptions } from './types';

export function useXxxPlugin(_options?: XxxPluginOptions): Plugin {
  return {
    name: '@tomjs:xxx',
  };
}

export default useXxxPlugin;
