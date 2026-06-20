const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'windows',
  openBrowser: (url) => ipcRenderer.send('open-browser', url),
  closeBrowser: () => ipcRenderer.send('close-browser'),
  onAuthCallback: (callback) => {
    ipcRenderer.on('auth-callback', (event, hash) => callback(hash));
  },
});