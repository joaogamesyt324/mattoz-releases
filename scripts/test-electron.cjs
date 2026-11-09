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
 const eq=[...document.querySelectorAll('button')].find(b=>b.textContent==='Ativar equalizador');
 mattozTransitions.seconds=2;play(false);await until(()=>a.currentTime>.05&&a.preparedReady);
 eq.click();await until(()=>eq.textContent==='Ouvir som original');
 a.currentTime=5.9;await until(()=>a.tail&&a.currentTime>.15);
 if(!a.decks.every(d=>!d.paused&&d.volume>0)||ui('track-title').textContent!=='B')throw Error('Sobreposição inválida');
 ui('play').click();const frozen=a.currentTime;await wait(200);
 if(Math.abs(a.currentTime-frozen)>.02||a.decks.some(d=>!d.paused))throw Error('Pausa inválida');
 ui('play').click();await until(()=>a.currentTime>frozen+.05);
 a.currentTime=3;if(a.tail||a.active.volume!==a.volume)throw Error('Busca inválida');
 play(true);await until(()=>a.scheduled&&a.currentTime>.05);
 a.currentTime=7;await until(()=>a.scheduled);
 const before=a.active,following=a.scheduled,difference=following.startTime-before.boundary;
 if(Math.abs(difference)>1/a.context.sampleRate)throw Error('Intervalo na programação de áudio');
 const samples=1024,rate=a.context.sampleRate;
 const offline=new OfflineAudioContext(1,samples*2,rate);
 const last=offline.createBufferSource(),first=offline.createBufferSource();
 last.buffer=before.buffer;first.buffer=following.buffer;last.connect(offline.destination);first.connect(offline.destination);
 last.start(0,last.buffer.duration-samples/rate);first.start(samples/rate);
 const signal=(await offline.startRendering()).getChannelData(0);
 for(const start of [samples-128,samples]){
   if(!signal.subarray(start,start+128).some(sample=>Math.abs(sample)>.01))throw Error('Silêncio na emenda dos MP3s de teste');
 }
 await until(()=>ui('track-title').textContent==='B'&&a.active===following);
 await until(()=>ui('lyric-lines').textContent.includes('B início'));
 ui('open-immersive').click();
 const check=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Usar capas animadas')).querySelector('input');
 if(!check.checked)check.click();
 [...document.querySelectorAll('button')].find(b=>b.textContent==='Escolher animação').click();
 await until(()=>ui('large-art').querySelector('video')?.currentTime>0);
 if(!ui('large-art').querySelector('video').muted)throw Error('Capa com som');
 ui('play').click();if(!a.paused||ui('large-art').querySelector('video'))throw Error('Modo álbum ou capa não pausou');
 return {animatedVideo:true,crossfade:true,eq:true,pause:true,seek:true,gaplessScheduledSamples:difference*a.context.sampleRate,lyrics:ui('lyric-lines').textContent};
}
app.on('browser-window-created',(_,w)=>w.webContents.once('did-finish-load',async()=>{
 try{const result=await w.webContents.executeJavaScript('('+exercise.toString()+')()',true);console.log('MATTOZ_SMOKE',JSON.stringify(result));app.exit(0);}
 catch(error){console.error('MATTOZ_FAILURE',error);app.exit(1);}
}));
setTimeout(()=>app.exit(2),30000);
const entry=process.argv.includes('--packaged-app')?'../dist/win-unpacked/resources/app.asar/src/main/main.cjs':'../src/main/main.cjs';
require(entry);
