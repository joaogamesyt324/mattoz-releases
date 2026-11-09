'use strict';
const path=require('node:path');
function setupDesktop({app,ipcMain,Tray,Menu,nativeImage,store,getWindow,assertTrustedSender,platform=process.platform}){
 let tray=null,quitting=false,state={playing:false,available:false,title:''};const icons={};
 const supported=platform==='win32';
 const show=()=>{const w=getWindow();if(w&&!w.isDestroyed()){if(w.isMinimized())w.restore();w.show();w.focus();}};
 const send=command=>{const w=getWindow();if(w&&!w.isDestroyed())w.webContents.send('desktop:command',command);};
 function update(){if(!supported)return;const w=getWindow();if(!w||w.isDestroyed())return;
  const items=[['previous','Anterior'],[state.playing?'pause':'play',state.playing?'Pausar':'Reproduzir'],['next','Próxima']];
  try{w.setThumbarButtons(items.map(([name,tooltip])=>({tooltip,icon:icons[name],flags:state.available?[]:['disabled'],click:()=>send(name==='play'||name==='pause'?'toggle':name)})));}catch{}
  if(tray){tray.setToolTip(('MATTOZ'+(state.title?' — '+state.title:'')).slice(0,120));tray.setContextMenu(Menu.buildFromTemplate([{label:'Abrir MATTOZ',click:show},...items.map(([name,label])=>({label,enabled:state.available,click:()=>send(name==='play'||name==='pause'?'toggle':name)})),{type:'separator'},{label:'Sair do MATTOZ',click:()=>app.quit()}]));}
 }
 function ensureTray(){if(tray)return;tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'../../build/icon.png')));tray.on('double-click',show);tray.on('click',show);update();}
 if(supported)for(const name of ['previous','play','pause','next'])icons[name]=nativeImage.createFromPath(path.join(__dirname,'../../build/controls',name+'.png'));
 ipcMain.handle('desktop:settings',(event,enabled)=>{assertTrustedSender(event,getWindow());if(enabled!==undefined){if(typeof enabled!=='boolean'||!supported)throw Error('Opção indisponível');if(enabled)ensureTray();store.set('close-to-tray',enabled);if(!enabled&&tray){show();tray.destroy();tray=null;}}return {supported,closeToTray:!!store.get('close-to-tray',false)};});
 ipcMain.handle('desktop:state',(event,data)=>{assertTrustedSender(event,getWindow());if(!data||typeof data.playing!=='boolean'||typeof data.available!=='boolean'||typeof data.title!=='string'||data.title.length>300)throw Error('Estado inválido');state=data;update();});
 app.on('before-quit',()=>{quitting=true;});app.on('will-quit',()=>{tray?.destroy();tray=null;});
 return {attach(window){window.on('close',event=>{if(!supported||quitting||!store.get('close-to-tray',false))return;try{ensureTray();event.preventDefault();window.hide();}catch{}});window.on('ready-to-show',()=>{if(supported&&store.get('close-to-tray',false)){try{ensureTray();}catch{}}update();});},update};
}
module.exports={setupDesktop};
