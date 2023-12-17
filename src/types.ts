export type ColorFunc = (str: string | number) => string;

export type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  test?: boolean;
  variants?: FrameworkVariant[];
  /**
   * custom props for the framework
   */
  options?: { id: string; name: string }[];
};

export type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  test?: boolean;
  customCommand?: string;
};

export type PromptOption = 'test' | 'publish' | 'ssh' | 'vite' | 'electron' | 'examples';

export interface PromptResult {
  projectName?: string;
  overwrite?: boolean;
  overwriteChecker?: any;
  packageName?: string;
  framework?: Framework;
  variant?: string;
  options?: PromptOption[];
  gitUserUrl?: string;
}

export interface GitRepo {
  id: string;
  repo: string;
  owner: string;
}
