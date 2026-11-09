'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('mattoz', Object.freeze({
  checkRelease: ()=>ipcRenderer.invoke('updates:check'),
  downloadRelease: ()=>ipcRenderer.invoke('updates:download'),
  onLauncher: fn=>{const listener=()=>fn();ipcRenderer.on('launcher:show',listener);return ()=>ipcRenderer.removeListener('launcher:show',listener);},
  desktopSettings: enabled=>ipcRenderer.invoke('desktop:settings',enabled),
  desktopState: state=>ipcRenderer.invoke('desktop:state',state),
  onDesktopCommand: callback=>{const listener=(_event,command)=>callback(command);ipcRenderer.on('desktop:command',listener);return ()=>ipcRenderer.removeListener('desktop:command',listener);},
  watchFolders: (action,data) => ipcRenderer.invoke('library:watch',action,data),
  onImportProgress: callback => {const listener=(_event,data)=>callback(data);ipcRenderer.on('library:import-progress',listener);return ()=>ipcRenderer.removeListener('library:import-progress',listener);},
  collectionAction: (action,data) => ipcRenderer.invoke('collection:action',action,data),
  libraryAction: action => ipcRenderer.invoke('library:action', action),
  savedAction: (action,data) => ipcRenderer.invoke('saved:action',action,data),
  onlineLyrics: (id,choice) => ipcRenderer.invoke('lyrics:online',id,choice),
  setFullscreen: enabled => ipcRenderer.invoke('window:fullscreen', enabled),
  getLyrics: id => ipcRenderer.invoke('lyrics:get', id),
  selectAudioFiles: () => ipcRenderer.invoke('audio:select-files'),
  getAppInfo: () => ipcRenderer.invoke('app:get-info')
}));

// Resolve only files supplied by a real desktop drop, inside the isolated preload.
window.addEventListener('dragover',event=>{if([...event.dataTransfer?.types||[]].includes('Files'))event.preventDefault();},true);
window.addEventListener('drop',event=>{if(![...event.dataTransfer?.types||[]].includes('Files'))return;event.preventDefault();if(!event.isTrusted)return;const paths=[...event.dataTransfer.files].map(file=>webUtils.getPathForFile(file)).filter(Boolean);if(paths.length)ipcRenderer.invoke('library:drop',paths).catch(()=>{});},true);
