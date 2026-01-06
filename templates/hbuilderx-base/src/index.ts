import type { ExtensionContext } from 'hbuilderx';
import { isAlphaVersion, setContext } from '@tomjs/hbuilderx';
import { commands, window } from 'hbuilderx';

export function activate(context: ExtensionContext) {
  setContext(context);

  context.subscriptions.push(
    commands.registerCommand('tomjs.xxx.showHello', async () => {
      window.showInformationMessage(`Hello World！这是 ${isAlphaVersion ? '测试' : '正式'}版本的 HBuilderX。`, ['确定1', '取消2']).then((result) => {
        window.showInformationMessage(`你点击了${result}`);
      });
    }),
  );
}

export function deactivate() { }
