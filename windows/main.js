const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');

let mainWindow;
let authServer = null;
let authResolve = null;
let authTimer = null;

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

  setupAuthHandlers();
}

const CALLBACK_HTML = `<!DOCTYPE html><html><body><script>
var h=window.location.hash.substring(1);
fetch('/auth/done?'+h).then(function(){window.close()});
<\/script></body></html>`;

function getRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function setupAuthHandlers() {
  ipcMain.handle('open-auth-url', async (event, url) => {
    if (authTimer) clearTimeout(authTimer);
    stopAuthServer();

    const port = await getRandomPort();
    const callbackUrl = `http://127.0.0.1:${port}/auth/callback.html`;
    const modifiedUrl = url.replace(/(redirect_to=)[^&]*/, '$1' + encodeURIComponent(callbackUrl));

    return new Promise((resolve) => {
      authResolve = resolve;
      authTimer = setTimeout(() => {
        stopAuthServer();
        resolve('');
      }, 120000);

      authServer = http.createServer((req, res) => {
        if (req.url.startsWith('/auth/callback.html')) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(CALLBACK_HTML);
        } else if (req.url.startsWith('/auth/done?')) {
          const hash = '#' + req.url.substring('/auth/done?'.length);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('ok');
          stopAuthServer();
          resolve(hash);
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      authServer.listen(port, '127.0.0.1', () => {
        shell.openExternal(modifiedUrl);
      });
    });
  });

  ipcMain.on('close-auth-server', () => {
    if (authResolve) {
      clearTimeout(authTimer);
      authResolve('');
      authResolve = null;
    }
    stopAuthServer();
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
}

function stopAuthServer() {
  if (authServer) {
    authServer.close();
    authServer = null;
  }
  if (authTimer) {
    clearTimeout(authTimer);
    authTimer = null;
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