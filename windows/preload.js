const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'windows',
  // Auth
  openAuthWindow: (url) => ipcRenderer.invoke('open-auth-window', url),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  onWindowMinimized: (callback) => ipcRenderer.on('window-minimized', callback),
  onWindowRestored: (callback) => ipcRenderer.on('window-restored', callback),
  // Add-ons
  listAddons: () => ipcRenderer.invoke('list-addons'),
  installAddon: (filePath) => ipcRenderer.invoke('install-addon', filePath),
  removeAddon: (fileName) => ipcRenderer.invoke('remove-addon', fileName),
  getAddonIcon: (fileName) => ipcRenderer.invoke('get-addon-icon', fileName),
  pickAddonFile: () => ipcRenderer.invoke('pick-addon-file'),
});
