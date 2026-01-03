import type { ChalkInstance } from 'chalk';

export interface CreateAppOptions {
  /**
   * The directory to create the project in.
   */
  cwd?: string;
  /**
   * The package name to use for the project.
   */
  packageName?: string;
  /**
   * Create a package for the workspace project
   */
  package?: boolean;
  overwrite?: 'yes' | 'no' | 'ignore';
  /**
   * Whether to make the project private.
   */
  private?: boolean;
  verbose?: boolean;
}

export interface ProjectOptions {
  targetDir: string;
  orgName?: string;
  packageName: string;
  template: string;
  templateOptions: ProjectTemplate;
  isPublic: boolean;
  gitUrl?: string;
  initGit?: boolean;
}

type CommonTemplate = 'electron' | 'vscode';

/**
 * The template to use for the app.
 */
export interface ProjectTemplate {
  name: string;
  display: string;
  value?: string;
  color: ChalkInstance;
  commonTemplates?: CommonTemplate[];
  hasStyle?: boolean;
  public?: 'public' | 'npm';
}

/**
 * The template group to use for the app.
 */
export interface ProjectTemplateGroup {
  name: string;
  display: string;
  color: ChalkInstance;
  hasStyle?: boolean;
  children: ProjectTemplate[];
}

export interface GitRepo {
  id: string;
  url: string;
  name: string;
}
