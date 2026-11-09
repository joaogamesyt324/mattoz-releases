// Run with Electron. Uses synthetic MP3s, a temporary profile and a test file picker.
'use strict';
const {app,dialog}=require('electron');
const {mkdtempSync,writeFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path'),os=require('node:os');
const temp=mkdtempSync(path.join(os.tmpdir(),'mattoz-audio-'));
app.setPath('userData',temp);
app.requestSingleInstanceLock=()=>true;
const files=['A','B'].map((name,index)=>{
  const file=path.join(temp,name+'.mp3');
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency='+[440,660][index]+':duration=8','-metadata','title='+name,'-metadata','album=Teste','-c:a','libmp3lame',file]);
  writeFileSync(path.join(temp,name+'.lrc'),'[00:00.00]'+name+' início\n[00:02.00]'+name+' segundo verso\n');
  return file;
});
const video=path.join(temp,'cover.webm');
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=purple:s=96x96:d=1','-c:v','libvpx','-threads','1',video]);
dialog.showOpenDialog=async(_,options)=>({canceled:false,filePaths:options.filters?.[0]?.extensions.includes('webm')?[video]:files});
async function exercise(){
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function until(condition){for(let i=0;i<100;i++){if(condition())return;await wait(50);}throw Error('Tempo esgotado: '+condition.toString());}
 const a=window.mattozAudio,ui=id=>document.getElementById(id);
 const tracks=(await mattoz.selectAudioFiles()).tracks;
 const play=(gapless)=>window.dispatchEvent(new CustomEvent('mattoz-play-library',{detail:{tracks,id:tracks[0].id,replace:true,albumMode:true,gapless}}));

 play(false);await until(()=>a.currentTime>.1);a.currentTime=3;
 navigate('personal');
 document.querySelector('.moment-shortcut').click();
 await until(()=>document.querySelector('dialog[open] input'));
 document.querySelector('dialog[open] input').value='Meu solo';
 document.querySelector('dialog[open] button[value=ok]').click();
 await until(()=>document.querySelector('.personal-list').parentElement&&document.querySelector('.personal-page').textContent.includes('Meu solo'));
 const moment=[...document.querySelectorAll('.personal-row button')].find(b=>b.textContent==='Ouvir momento');
 moment.click();await wait(300);if(a.currentTime<3||a.currentTime>4)throw Error('Momento fora da posição');
 const query=document.querySelector('.personal-section input[type=search]');query.value='segundo verso';query.dispatchEvent(new Event('input'));
 await until(()=>query.closest('section').querySelector('.personal-row'));
 const result=query.closest('section').querySelector('.personal-row button');result.click();await wait(300);if(a.currentTime<2||a.currentTime>3)throw Error('Busca fora do verso '+a.currentTime+' / '+result.textContent);
 const now=new Date(),month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
 await mattoz.savedAction('listening',{id:tracks[0].id,seconds:15});
 navigate('home');navigate('personal');
 await until(()=>document.querySelector('.capsule-track'));
 [...document.querySelectorAll('.personal-section button')].find(b=>b.textContent==='Salvar como playlist').click();
 await until(()=>!document.getElementById('saved-page').hidden);
 const state=await mattoz.savedAction('list');if(!state.playlists.some(p=>p.capsuleMonth===month&&p.tracks.includes(tracks[0].id)))throw Error('Cápsula não virou playlist');
 navigate('personal');await wait(450);
 return {moment:true,lyricSearch:true,monthlyPlaylist:true,month};
}
app.on('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{
 try{const result=await w.webContents.executeJavaScript('('+exercise.toString()+')()',true);console.log('MATTOZ_SMOKE',JSON.stringify(result));require('node:fs').writeFileSync('/tmp/mattoz16-personal.png',(await w.capturePage()).toPNG());app.exit(0);}
 catch(error){console.error('MATTOZ_FAILURE',error);app.exit(1);}
}));
setTimeout(()=>app.exit(2),30000);
const entry=process.argv.includes('--packaged-app')?'../dist/win-unpacked/resources/app.asar/src/main/main.cjs':'../src/main/main.cjs';
require(entry);
