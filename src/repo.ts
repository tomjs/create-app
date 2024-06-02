import os from 'node:os';
import path from 'node:path';
import { mkdirSync, readJsonSync, writeJsonSync } from '@tomjs/node';
import chalk from 'chalk';
import inquirer from 'inquirer';
import type { AppConfig, GitRepo } from './types.js';
import { askConfirm, askList } from './utils.js';

const defaultGitRepo = {
  repo: 'https://github.com',
  owner: os.userInfo().username,
};

export function getGitUserUrl(git: GitRepo): string {
  const { repo, owner } = git;
  return `${repo}${repo.endsWith('/') ? '' : '/'}${owner}`;
}

async function saveOrUpdateGitRepoPrompt(git?: GitRepo): Promise<GitRepo> {
  const result = await inquirer.prompt([
    {
      type: 'text',
      name: 'repo',
      message: `${git?.repo ? 'Edit' : 'Add'} git repository url:`,
      default: git?.repo || defaultGitRepo.repo,
    },
    {
      type: 'text',
      name: 'owner',
      message: `${git?.owner ? 'Edit' : 'Add '} git repository owner:`,
      default: git?.owner || defaultGitRepo.owner,
    },
  ]);

  return {
    id: git?.id || Date.now().toString(),
    repo: result.repo,
    owner: result.owner,
  };
}

const appPath = path.join(os.homedir(), '.tomjs', 'create-app');
const filePath = path.join(appPath, 'config.json');

function getConfig(): AppConfig {
  mkdirSync(appPath);

  return Object.assign({ gitRepos: [] }, readJsonSync(filePath));
}

function saveAppConfig(config: AppConfig) {
  const cfg = getConfig();
  if (!cfg.createTime) {
    cfg.createTime = Date.now();
  } else {
    cfg.updateTime = Date.now();
  }

  writeJsonSync(filePath, Object.assign(cfg, config));
}

function saveGitRepos(gitRepos: GitRepo[]) {
  saveAppConfig({ gitRepos });
}

export async function setGitRepoPrompt(list?: GitRepo[], edit = false) {
  if (!list) {
    const cfg = getConfig();
    list = cfg.gitRepos || [];
  }

  const choices = list
    .map(s => {
      return {
        name: getGitUserUrl(s),
        value: s.id,
      };
    })
    .concat([
      {
        name: chalk.green('+ Add'),
        value: 'add',
      },
      {
        name: chalk.yellow('← Exit'),
        value: 'exit',
      },
    ]);

  const repoId = await askList(
    list.length === 0
      ? `You choose to add or exit:`
      : 'You can choose the repository to be operated, or choose to add or exit:',
    choices,
  );

  if (repoId === 'exit') {
    return;
  }

  if (repoId === 'add') {
    const add = await saveOrUpdateGitRepoPrompt();
    list.push(add);
    saveGitRepos(list);
    return setGitRepoPrompt(list, edit);
  }

  const itemIndex = list.findIndex(s => s.id === repoId);

  const action = await askList('Select an action?', [
    {
      name: chalk.green('^ Edit'),
      value: 'edit',
    },
    {
      name: chalk.red('- Remove'),
      value: 'remove',
    },
    {
      name: chalk.yellow('← Exit'),
      value: 'exit',
    },
  ]);

  if (action === 'exit') {
    return edit ? setGitRepoPrompt(list, edit) : getConfig();
  }

  if (action === 'remove') {
    const confirm = await askConfirm('Where confirm to remove?', true);
    if (confirm) {
      list.splice(itemIndex, 1);
      saveGitRepos(list);
    }
    return setGitRepoPrompt(list, edit);
  }

  const update = await saveOrUpdateGitRepoPrompt(list[itemIndex]);
  list[itemIndex] = update;
  saveGitRepos(list);
  return setGitRepoPrompt(list, edit);
}

export async function getAppConfig() {
  const config = getConfig();
  const { gitRepos: list } = config;

  if (list.length === 0) {
    console.log(`You need to set the ${chalk.blue('git remote repository')} for the first time.`);
    await setGitRepoPrompt(list);
  }
  return config;
}
