const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

let mainWindow;

const ADDONS_DIR = path.join(app.getPath('userData'), 'addons');
if (!fs.existsSync(ADDONS_DIR)) {
  fs.mkdirSync(ADDONS_DIR, { recursive: true });
}

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

// --- Add-on system IPC ---

ipcMain.handle('list-addons', () => {
  try {
    if (!fs.existsSync(ADDONS_DIR)) return [];
    const files = fs.readdirSync(ADDONS_DIR).filter(f => f.endsWith('.gagaon'));
    return files.map(f => {
      const p = path.join(ADDONS_DIR, f);
      try {
        const zip = new AdmZip(p);
        const entry = zip.getEntry('package.json');
        if (!entry) return { file: f, error: 'Missing package.json' };
        const pkg = JSON.parse(entry.getData().toString('utf8'));
        return { file: f, name: pkg.name, icon: pkg.icon, description: pkg.description, version: pkg.version, enabled: true };
      } catch (e) {
        return { file: f, error: e.message };
      }
    });
  } catch (e) {
    return [];
  }
});

ipcMain.handle('install-addon', async (event, filePath) => {
  try {
    if (!filePath.endsWith('.gagaon')) return { success: false, error: 'Not a .gagaon file' };
    const dest = path.join(ADDONS_DIR, path.basename(filePath));
    fs.copyFileSync(filePath, dest);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('remove-addon', async (event, fileName) => {
  try {
    const p = path.join(ADDONS_DIR, fileName);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-addon-icon', async (event, fileName) => {
  try {
    const p = path.join(ADDONS_DIR, fileName);
    const zip = new AdmZip(p);
    const pkgEntry = zip.getEntry('package.json');
    if (!pkgEntry) return null;
    const pkg = JSON.parse(pkgEntry.getData().toString('utf8'));
    if (!pkg.icon) return null;
    const iconEntry = zip.getEntry(pkg.icon);
    if (!iconEntry) return null;
    const data = iconEntry.getData();
    return 'data:image/png;base64,' + data.toString('base64');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('pick-addon-file', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Game Add-ons', extensions: ['gagaon'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// --- Auth IPC (BrowserWindow-based Discord OAuth) ---

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
