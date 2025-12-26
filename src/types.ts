import type { ChalkInstance } from 'chalk';

export interface CreateAppOptions {
  package?: string;
  overwrite?: 'yes' | 'no' | 'ignore';
  /**
   * Whether to make the project private.
   */
  private?: boolean;
  verbose?: boolean;
}

export interface ProjectOptions {
  targetDir: string;
  packageName: string;
  template: string;
  templateOptions: ProjectTemplate;
  isPublic: boolean;
  gitUrl?: string;
  gitOrg?: string;
  initGit?: boolean;
}

/**
 * The template to use for the app.
 */
export interface ProjectTemplate {
  name: string;
  display: string;
  value?: string;
  color: ChalkInstance;
  hasStyle?: boolean;
  isPublic?: boolean | 'public';
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
