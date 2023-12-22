import { commands, ExtensionContext, window } from 'vscode';

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand('hello-world.showHelloWorld', async () => {
    window.showInformationMessage('Hello World');
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);
}

export function deactivate() {}
