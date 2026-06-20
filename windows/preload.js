const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'windows',
  isFullscreen: () => true,
});
