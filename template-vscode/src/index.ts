import { commands, ExtensionContext, window } from 'vscode';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('hello-world.showHelloWorld', async () => {
      window.showInformationMessage('Hello World');
    }),
  );
}

export function deactivate() {}
