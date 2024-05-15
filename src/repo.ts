import os from 'node:os';
import path from 'node:path';
import { blue, red, reset } from 'kolorist';
import minimist from 'minimist';
import prompts from 'prompts';
import type { GitRepo } from './types';
import type { Args } from './utils';
import { formatArgs, mkdirp, readJson, writeJson } from './utils';

// cli args
const argv = formatArgs(minimist<Args>(process.argv.slice(2), { string: ['_'] }));

const defaultGitRepo = {
  repo: 'https://github.com',
  owner: os.userInfo().username,
};

export function getGitUserUrl(git: GitRepo): string {
  const { repo, owner } = git;
  return `${repo}${repo.endsWith('/') ? '' : '/'}${owner}`;
}

async function saveOrUpdateGitRepoPrompt(git?: GitRepo): Promise<GitRepo> {
  const result = await prompts(
    [
      {
        type: 'text',
        name: 'repo',
        message: reset('Git repository url:'),
        initial: git?.repo || defaultGitRepo.repo,
      },
      {
        type: 'text',
        name: 'owner',
        message: reset('Git repository owner:'),
        initial: git?.owner || defaultGitRepo.owner,
      },
    ],
    {
      onCancel: () => {
        console.log(red('✖') + ' Operation cancelled');
        throw new Error();
      },
    },
  );

  return {
    id: git?.id || Date.now().toString(),
    repo: result.repo,
    owner: result.owner,
  };
}

const appPath = path.join(os.homedir(), '.tomjs', 'create-app');
const filePath = path.join(appPath, 'config.json');

export interface AppConfig {
  gitRepos: GitRepo[];
  createTime?: number;
  updateTime?: number;
}

export function getAppConfig(): AppConfig {
  mkdirp(appPath);

  return Object.assign({ gitRepos: [] }, readJson(filePath));
}

export function saveAppConfig(config: AppConfig) {
  const cfg = getAppConfig();
  if (!cfg.createTime) {
    cfg.createTime = Date.now();
  } else {
    cfg.updateTime = Date.now();
  }

  writeJson(filePath, Object.assign(cfg, config));
}

export function saveGitRepos(gitRepos: GitRepo[]) {
  saveAppConfig({ gitRepos });
}

export async function beforeCreate() {
  const { gitRepos: list } = getAppConfig();

  if (list.length === 0 || argv.git) {
    if (list.length === 0) {
      console.log(`You need to set the ${blue('git remote repository')} for the first time.`);
    }

    await setGitRepoPrompt();
  }

  async function setGitRepoPrompt() {
    const choices = list
      .map(s => {
        return {
          title: getGitUserUrl(s),
          value: s.id,
        };
      })
      .concat([
        {
          title: 'Add',
          value: 'add',
        },
        {
          title: red('Exit'),
          value: 'exit',
        },
      ]);

    const initSelect = await prompts(
      {
        type: 'select',
        name: 'repoId',
        message:
          list.length === 0
            ? `You choose to add or exit:`
            : 'You can choose the repository to be operated, or choose to add or exit:',
        choices,
      },
      {
        onCancel: () => {
          console.log(red('✖') + ' Operation cancelled');
          throw new Error();
        },
      },
    );

    const { repoId } = initSelect;

    if (repoId === 'exit') {
      return;
    }

    if (repoId === 'add') {
      const add = await saveOrUpdateGitRepoPrompt();
      list.push(add);
      saveGitRepos(list);
      return setGitRepoPrompt();
    }

    const itemIndex = list.findIndex(s => s.id === repoId);

    const actionResult = await prompts(
      [
        {
          type: 'select',
          name: 'action',
          message: reset('Select an action?'),
          choices: [
            {
              title: 'Edit',
              value: 'edit',
            },
            {
              title: 'Remove',
              value: 'remove',
            },
            {
              title: 'Exit',
              value: 'exit',
            },
          ],
        },
        {
          type: action => action === 'remove' && 'toggle',
          name: 'confirmRemove',
          message: reset('Where confirm to remove?'),
          initial: true,
          active: 'Yes',
          inactive: 'No',
        },
      ],
      {
        onCancel: () => {
          console.log(red('✖') + ' Operation cancelled');
          throw new Error();
        },
      },
    );

    const { action, confirmRemove } = actionResult;

    if (action === 'exit') {
      return beforeCreate();
    }

    if (action === 'remove') {
      if (confirmRemove) {
        list.splice(itemIndex, 1);
        saveGitRepos(list);
      }
      return setGitRepoPrompt();
    }

    const update = await saveOrUpdateGitRepoPrompt(list[itemIndex]);
    list[itemIndex] = update;
    saveGitRepos(list);
    return setGitRepoPrompt();
  }
}
