const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('adminAPI', {
  verifyCode: (code) => ipcRenderer.invoke('verify-code', code),
  getUsers: () => ipcRenderer.invoke('get-users'),
  updateUser: (id, updates) => ipcRenderer.invoke('update-user', id, updates),
  deleteUser: (id) => ipcRenderer.invoke('delete-user', id),
  getServers: () => ipcRenderer.invoke('get-servers'),
  deleteServer: (id) => ipcRenderer.invoke('delete-server', id),
});
