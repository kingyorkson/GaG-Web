const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'windows',
  openAuthUrl: (url) => ipcRenderer.invoke('open-auth-url', url),
  closeAuthUrl: () => ipcRenderer.send('close-auth-server'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  onWindowMinimized: (callback) => ipcRenderer.on('window-minimized', callback),
  onWindowRestored: (callback) => ipcRenderer.on('window-restored', callback),
});