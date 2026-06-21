const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqohfidpjiudduoqcppv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6y_g2CP3d7FTesjvTGIqXg_gy2NH6yW';
const ADMIN_CODE = '301472';

let mainWindow;
let supabase = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('verify-code', async (event, code) => {
  if (code === ADMIN_CODE) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('get-users', async () => {
  if (!supabase) return [];
  const { data } = await supabase.from('profiles').select('*').limit(100);
  return data || [];
});

ipcMain.handle('update-user', async (event, userId, updates) => {
  if (!supabase) return { success: false };
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  return { success: !error, error: error?.message };
});

ipcMain.handle('delete-user', async (event, userId) => {
  if (!supabase) return { success: false };
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  return { success: !error, error: error?.message };
});

ipcMain.handle('get-servers', async () => {
  if (!supabase) return [];
  const { data } = await supabase.from('servers').select('*').limit(100);
  return data || [];
});

ipcMain.handle('delete-server', async (event, serverId) => {
  if (!supabase) return { success: false };
  const { error } = await supabase.from('servers').delete().eq('id', serverId);
  return { success: !error, error: error?.message };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });
