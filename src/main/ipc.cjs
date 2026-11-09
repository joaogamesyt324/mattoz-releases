'use strict';

const { assertTrustedSender } = require('./security.cjs');

function registerIPC({ ipcMain, app, getWindow, dialog, media, library }) {
  if (dialog && media) {
    let selecting = false;
    ipcMain.handle('audio:select-files', async (event, ...args) => {
      assertTrustedSender(event, getWindow());
      if (args.length) throw new Error('Parâmetros não permitidos.');
      if (selecting) return { tracks: [], skipped: 0 };
      selecting = true;
      try {
        const result = await dialog.showOpenDialog(getWindow(), { title: 'Adicionar MP3s à fila', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Músicas MP3', extensions: ['mp3'] }] });
        if (result.canceled) return { tracks: [], skipped: 0 };
        const selected = await media.add(result.filePaths);
        if (!library) return selected;
        await library.import(result.filePaths);
        return { tracks: selected.tracks.map(t => library.tracks.get(t.id) || t), skipped: selected.skipped };
      } finally { selecting = false; }
    });
  }
  ipcMain.handle('lyrics:get', async (event, id) => {
    assertTrustedSender(event, getWindow());
    if (typeof id !== 'string' || id.length > 100) throw new Error('Identificador inválido');
    return media.lyrics(id);
  });
  if (library) ipcMain.handle('library:action', async (event, action) => {
    assertTrustedSender(event, getWindow());
    if (!['list','files','folder','refresh'].includes(action)) throw new Error('Ação inválida');
    if (action === 'list') return { tracks: [...library.tracks.values()], skipped: 0 };
    if (action === 'refresh') return library.refresh();
    const result = await dialog.showOpenDialog(getWindow(), action === 'folder' ? { properties:['openDirectory'] } : {properties:['openFile','multiSelections'],filters:[{name:'MP3',extensions:['mp3']}]});
    if(result.canceled) return {tracks:[...library.tracks.values()],skipped:0};
    return action === 'folder' ? library.scan(result.filePaths[0]) : library.import(result.filePaths);
  });
  ipcMain.handle('window:fullscreen', (event, enabled) => {
    assertTrustedSender(event, getWindow());
    if(typeof enabled !== 'boolean') throw new Error('Estado inválido');
    getWindow().setFullScreen(enabled);
    return enabled;
  });
  // One method, one capability. Do not expose a generic invoke/send bridge.
  ipcMain.handle('app:get-info', (event, ...args) => {
    assertTrustedSender(event, getWindow());
    if (args.length) throw new Error('Esta operação não recebe parâmetros.');
    return {
      name: 'MATTOZ MUSIC PLAYER',
      version: app.getVersion(),
      phase: 9,
      launcher:process.argv.includes('--launcher'),
      platform: process.platform,
      electron: process.versions.electron
    };
  });
}

module.exports = { registerIPC };
