export type ColorFunc = (str: string | number) => string;

export type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  publish?: boolean;
  test?: boolean;
  variants?: FrameworkVariant[];
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
  needPublish?: boolean;
  needTest?: boolean;
}
