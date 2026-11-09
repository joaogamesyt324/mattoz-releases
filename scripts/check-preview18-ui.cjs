'use strict';
const {app}=require('electron'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'mattoz-ui18-')));app.requestSingleInstanceLock=()=>true;
app.on('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{try{
 await w.webContents.executeJavaScript(`(async()=>{await mattoz.savedAction('create',{name:'Noite no MATTOZ'});navigate('home');})()`);
 await new Promise(r=>setTimeout(r,700));fs.writeFileSync(path.join(os.tmpdir(),'m18-home.png'),(await w.capturePage()).toPNG());
 await w.webContents.executeJavaScript(`navigate('playlists')`);await new Promise(r=>setTimeout(r,300));
 await w.webContents.executeJavaScript(`[...document.querySelectorAll('#saved-results .music-card')].find(x=>x.textContent.includes('Noite no MATTOZ')).click()`);
 await new Promise(r=>setTimeout(r,300));fs.writeFileSync(path.join(os.tmpdir(),'m18-playlist.png'),(await w.capturePage()).toPNG());console.log('UI home and playlist rendered');app.exit(0);
}catch(e){console.error(e);app.exit(1);}}));setTimeout(()=>app.exit(2),20000);require('../src/main/main.cjs');
