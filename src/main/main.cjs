'use strict';

const { app, BrowserWindow, Menu, protocol, net, session, dialog } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { APP_URL, assetForURL } = require('./security.cjs');
const { MediaRegistry } = require('./media.cjs');
const media = new MediaRegistry();
const { Library } = require('./library.cjs');
const library = new Library(media);
const { registerIPC } = require('./ipc.cjs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'mattoz', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'mattoz-media', privileges: { standard: true, secure: true, stream: true, corsEnabled: true, supportFetchAPI: true } }
]);

let mainWindow = null,desktop=null;
const development = !app.isPackaged && process.argv.includes('--dev');
const rendererRoot = path.join(__dirname, '../renderer');

async function createWindow() {
  const window = new BrowserWindow({
    width: 1380, height: 900, minWidth: 800, minHeight: 620,
    icon:path.join(__dirname,'../../build/icon.png'),
    title: 'MATTOZ MUSIC PLAYER', backgroundColor: '#101112', show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false,
      webviewTag: false, devTools: development, spellcheck: false
    }
  });
  mainWindow = window;desktop?.attach(window);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });
  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('Interface encerrada:', details.reason);
    dialog.showErrorBox('MATTOZ', 'A interface foi encerrada inesperadamente. Feche e abra o aplicativo novamente.');
  });
  await window.loadURL(APP_URL);
  if (development) window.webContents.openDevTools({ mode: 'detach' });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event,argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      if(argv.includes('--launcher'))mainWindow.webContents.send('launcher:show');
    }
  });
  app.whenReady().then(async () => {
    app.setAppUserModelId('com.mattoz.musicplayer');
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    protocol.handle('mattoz', (request) => {
      const asset = assetForURL(request.url);
      if (request.method !== 'GET' || !asset) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(path.join(rendererRoot, asset)).href);
    });
    protocol.handle('mattoz-media', request => media.respond(request));
    registerIPC({ dialog, media, library, ipcMain: require('electron').ipcMain, app, getWindow: () => mainWindow });
    require('./updates.cjs').registerUpdates({...require('electron'),getWindow:()=>mainWindow,assertTrustedSender:require('./security.cjs').assertTrustedSender});
    const { Store } = require('./store.cjs');
    const store = new Store(path.join(app.getPath('userData'), 'mattoz.sqlite'));
    const save = require('./persistence.cjs').setupPersistence({fetcher:(url,options)=>net.fetch(String(url),options),store,library,media,ipcMain:require('electron').ipcMain,getWindow:()=>mainWindow,assertTrustedSender:require('./security.cjs').assertTrustedSender});
    require('./phase7.cjs').registerPhase7({fetcher:(url,options)=>net.fetch(String(url),options),store,library,media,dialog,save,ipcMain:require('electron').ipcMain,getWindow:()=>mainWindow,assertTrustedSender:require('./security.cjs').assertTrustedSender});
    const imports=require('./import-manager.cjs').registerImports({store,library,media,dialog,ipcMain:require('electron').ipcMain,getWindow:()=>mainWindow,assertTrustedSender:require('./security.cjs').assertTrustedSender});
    app.on('before-quit',()=>imports.stop());
    app.on('will-quit',()=>store.close());
    desktop=require('./desktop.cjs').setupDesktop({...require('electron'),store,getWindow:()=>mainWindow,assertTrustedSender:require('./security.cjs').assertTrustedSender});
    await createWindow();
    imports.start();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(fatal);
    });
  }).catch(fatal);
  app.on('before-quit', () => library.worker?.terminate());
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}

function fatal(error) {
  console.error(error);
  dialog.showErrorBox('Não foi possível abrir o MATTOZ', error.message || 'Erro de inicialização.');
  app.quit();
}
