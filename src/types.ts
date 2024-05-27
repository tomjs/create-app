export type AppType = 'project' | 'example' | 'package';

export interface CLIOptions {
  cwd?: string;
  name?: string;
  template?: string;
  type?: AppType;
  example?: boolean;
  package?: boolean;
  verbose?: boolean;
}

export interface AppConfig {
  gitRepos: GitRepo[];
  createTime?: number;
  updateTime?: number;
}

export interface GitRepo {
  id: string;
  repo: string;
  owner: string;
}

export type Framework = {
  name: string;
  display: string;
  variants: FrameworkVariant[];
};

export type FrameworkVariant = {
  name: string;
  display: string;
  parent?: Framework;
  templates?: string[];
  examples?: string[];
  packages?: {
    exclude?: string[];
    ignore?: boolean;
  };
  workspaces?: boolean;
  devDependencies?: boolean;
};
