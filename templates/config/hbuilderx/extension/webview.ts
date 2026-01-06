import type { WebViewDialog, WebViewPanel } from 'hbuilderx';
import { getContext } from '@tomjs/hbuilderx';
import { window } from 'hbuilderx';
import { getWebviewHtml } from 'virtual:hbuilderx';

/**
 * @description 显示webview
 */
function showWebView(webviewPanel: WebViewPanel | WebViewDialog) {
  const webview = webviewPanel.webView;

  webview.html = getWebviewHtml({
    // dev server
    serverUrl: process.env.VITE_DEV_SERVER_URL,
    // build
    context: getContext(),
    injectCode: `<script>window.__FLAG1__=666;window.__FLAG2__=888;console.log(window.__FLAG1__);</script>`,
  });

  // 插件接收webview发送的消息(可以被JSON化的数据)
  webview.onDidReceiveMessage((msg) => {
    console.log('extension msg:', msg);
    if (msg.command === 'alert') {
      window.showInformationMessage(msg.text);
    }
  });
};

let leftWebviewPanel: WebViewPanel;
export function createLeftWebview() {
  if (!leftWebviewPanel) {
    leftWebviewPanel = window.createWebView('tomjs.webview.left', {
      enableScripts: true,
    });
  }

  showWebView(leftWebviewPanel);

  window.showView({
    containerId: 'tomjsActivitybar',
    viewId: 'tomjs.webview.left',
  });
};

let rightWebviewPanel: WebViewPanel;
export function createRightWebview() {
  if (!rightWebviewPanel) {
    rightWebviewPanel = window.createWebView('tomjs.webview.right', {
      enableScripts: true,
    });
  }

  showWebView(rightWebviewPanel);

  window.showView({
    containerId: 'tomjsRightSide',
    viewId: 'tomjs.webview.right',
  });
};

export function createDialogWebview() {
  const dialogWebviewPanel = window.createWebViewDialog({
    title: 'Dialog Webview',
  }, {
    enableScripts: true,
  });

  showWebView(dialogWebviewPanel);

  dialogWebviewPanel.show();
};
