import { WebviewApi } from '@tomjs/vscode-webview';

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new WebviewApi<string>();
