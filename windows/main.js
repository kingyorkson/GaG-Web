const { app, BrowserWindow, BrowserView, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let authView;

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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  setupAuthHandlers();
}

function setupAuthHandlers() {
  ipcMain.on('open-browser', (event, url) => {
    if (authView) destroyAuthView();

    const bounds = mainWindow.getBounds();
    authView = new BrowserView({
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    mainWindow.setBrowserView(authView);
    const margin = 40;
    authView.setBounds({
      x: margin, y: margin,
      width: bounds.width - margin * 2,
      height: bounds.height - margin * 2,
    });
    authView.setAutoResize({ width: true, height: true });

    authView.webContents.loadURL(url);

    authView.webContents.on('will-redirect', (event, redirectUrl) => {
      checkAuthCallback(redirectUrl);
    });
    authView.webContents.on('did-navigate', (event, navUrl) => {
      checkAuthCallback(navUrl);
    });
  });

  ipcMain.on('close-browser', () => {
    destroyAuthView();
  });
}

function checkAuthCallback(url) {
  if (!url || !url.includes('/auth/callback.html')) return;
  const hash = url.split('#')[1];
  if (hash) {
    mainWindow.webContents.send('auth-callback', '#' + hash);
  }
  destroyAuthView();
}

function destroyAuthView() {
  if (authView) {
    mainWindow.removeBrowserView(authView);
    authView.webContents.destroy();
    authView = null;
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});