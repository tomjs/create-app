export type AppType = 'project' | 'example' | 'package';

export interface CLIOptions {
  cwd?: string;
  name?: string;
  template?: string;
  type?: AppType;
  example?: boolean;
  package?: boolean;
  git?: boolean;
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

export interface Framework {
  name: string;
  display: string;
  variants: FrameworkVariant[];
}

export interface TextVars {
  /**
   * Package name
   */
  pkgName: string;
  /**
   * Package name (without scope)
   */
  pkgShortName: string;

  /**
   * Package installation string
   */
  pkgInstall: string;

  /**
   * User's name
   */
  gitUserName: string;

  /**
   * User's email
   */
  gitUserEmail: string;

  /**
   * Git organization name
   */
  gitOrg: string;

  /**
   * Git URL
   */
  gitUrl: string;

  /**
   * Full Git URL
   */
  gitFullUrl: string;

  /**
   * Full Git SSH URL
   */
  gitFullSSHUrl: string;

  /**
   * Current year
   */
  dateYear: number;
}

export interface UserOptions {
  pkgName: string;
  projectDir: string;
  gitUserUrl: string;
  textVars: TextVars;
}

export interface FrameworkVariant {
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
  test?: boolean;
  devDependencies?: 0 | 1 | 2;
  git?: 0 | 1 | 2;
  userOptions: UserOptions;
}
