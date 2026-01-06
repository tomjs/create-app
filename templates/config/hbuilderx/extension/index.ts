import type { ExtensionContext } from 'hbuilderx';
import { setContext } from '@tomjs/hbuilderx';
import { commands } from 'hbuilderx';
import { createDialogWebview, createLeftWebview, createRightWebview } from './webview';

export function activate(context: ExtensionContext) {
  setContext(context);

  context.subscriptions.push(
    commands.registerCommand('tomjs.ext.showLeftWebview', async () => {
      createLeftWebview();
    }),
    commands.registerCommand('tomjs.ext.showRightWebview', async () => {
      createRightWebview();
    }),
    commands.registerCommand('tomjs.ext.showWebviewDialog', async () => {
      createDialogWebview();
    }),
  );
}

export function deactivate() { }
