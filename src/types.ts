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
  props?: { id: string; name: string }[];
};

export type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  test?: boolean;
  customCommand?: string;
};

export interface PromptResult {
  projectName?: string;
  overwrite?: boolean;
  overwriteChecker?: any;
  packageName?: string;
  framework?: Framework;
  variant?: string;
  props?: ('test' | 'publish' | 'vite' | 'electron' | 'example')[];
}
