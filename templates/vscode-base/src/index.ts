import type { ExtensionContext } from 'vscode';
import { i18n, initExtension } from '@tomjs/vscode';
import { commands, window } from 'vscode';

export function activate(context: ExtensionContext) {
  initExtension(context);

  context.subscriptions.push(
    commands.registerCommand('tomjs.xxx.showHello', async () => {
      window.showInformationMessage(i18n.t('tomjs.commands.hello'));
    }),
  );
}

export function deactivate() {}
