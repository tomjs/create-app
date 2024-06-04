import { i18n, initExtension } from '@tomjs/vscode';
import type { ExtensionContext } from 'vscode';
import { commands, window } from 'vscode';
import { MainPanel } from './views/panel';

export function activate(context: ExtensionContext) {
  initExtension(context);

  context.subscriptions.push(
    commands.registerCommand('tomjs.xxx.showHello', async () => {
      window.showInformationMessage(i18n.t('tomjs.commands.hello'));
    }),
  );
  context.subscriptions.push(
    commands.registerCommand('tomjs.xxx.showPanel', async () => {
      MainPanel.render(context);
    }),
  );
}

export function deactivate() {}
