import { release } from 'node:os';

import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import '../polyfills';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1'))
  app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
  app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const isDev = process.env.NODE_ENV === 'development';

let win: BrowserWindow | null = null;
// package.json "type":"module", must use mjs extension
const preload = join(__dirname, '../preload/index.mjs');
const serverUrl = process.env.VITE_DEV_SERVER_URL as string;
const rendererDist = join(__dirname, '../renderer');
const indexHtml = join(rendererDist, 'index.html');
const publicPath = serverUrl ? join(__dirname, '../../public') : rendererDist;

function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    width: 800,
    height: 700,
    icon: join(publicPath, 'img/icon.png'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    win.loadURL(serverUrl);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  }
  else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:'))
      shell.openExternal(url);
    return { action: 'deny' };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(async () => {
  createWindow();
});

app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin')
    app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized())
      win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  }
  else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (serverUrl) {
    childWindow.loadURL(`${serverUrl}#${arg}`);
  }
  else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
