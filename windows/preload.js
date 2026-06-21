const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'windows',
  openAuthWindow: (url) => ipcRenderer.invoke('open-auth-window', url),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  onWindowMinimized: (callback) => ipcRenderer.on('window-minimized', callback),
  onWindowRestored: (callback) => ipcRenderer.on('window-restored', callback),
});
