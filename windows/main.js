const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(720, height),
    fullscreen: true,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'resources', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'webdist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    mainWindow.webContents.send('window-minimized');
  });

  mainWindow.on('restore', () => {
    mainWindow.webContents.send('window-restored');
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });
}

ipcMain.handle('open-auth-window', async (event, authUrl) => {
  return new Promise((resolve) => {
    let resolved = false;
    let authWin = null;

    const finish = (hash) => {
      if (resolved) return;
      resolved = true;
      if (authWin && !authWin.isDestroyed()) {
        authWin.close();
      }
      resolve(hash || '');
    };

    authWin = new BrowserWindow({
      width: 800,
      height: 700,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    authWin.loadURL(authUrl);

    const checkUrl = (url) => {
      if (url && url.includes('access_token=')) {
        const hashIdx = url.indexOf('#');
        if (hashIdx >= 0) {
          finish(url.substring(hashIdx));
        }
      }
    };

    authWin.webContents.on('will-redirect', (e, url) => checkUrl(url));
    authWin.webContents.on('did-navigate', (e, url) => checkUrl(url));
    authWin.webContents.on('did-navigate-in-page', (e, url) => checkUrl(url));

    authWin.on('closed', () => {
      finish('');
    });

    setTimeout(() => finish(''), 300000);
  });
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('restore-window', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
