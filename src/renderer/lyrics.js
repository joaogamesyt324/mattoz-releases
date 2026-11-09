'use strict';
(()=>{const $=id=>document.getElementById(id),audio=(window.mattozAudio || $('audio')),box=$('lyric-lines');let track=null,parsed={groups:[],offset:0},active=-2,token=0;const adjustments=new Map();const delay=()=>Number($('lyric-offset').value)||0;
let frame=0, lastFrame=null, targetScroll=null, velocity=0, position=null, buffering=false;
const frozen=new Set();
const visible=()=>!$('lyrics').hidden&&!document.hidden;
const moving=()=>visible()&&!audio.paused&&!audio.ended&&!buffering;
const reducedMotion=()=>reduced.matches||document.documentElement?.dataset.motion==='reduced';
function syncTransitions(){
 const animations=box.getAnimations?.({subtree:true})||[];
 if(!moving()){for(const animation of animations){if(animation.playState==='running'){animation.pause();frozen.add(animation);}}}
 else {for(const animation of frozen){if(animation.playState==='paused')animation.play();}frozen.clear();}
}
function stopAnimation(){if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=null;syncTransitions();}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function update(force=false){
 const index=LRC.activeIndex(parsed.groups,audio.currentTime,parsed.offset,delay());
 const changed=index!==active||force;
 if(changed){active=index;const gap=index>=0?(parsed.groups[index+1]?.time??parsed.groups[index].time+2)-parsed.groups[index].time:2;box.style.setProperty('--verse-duration',Math.min(650,Math.max(100,gap*450))+'ms');[...box.children].forEach((el,i)=>{el.classList.toggle('current-verse',i===index);el.classList.toggle('past-verse',i<index);if(i===index)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
 if(index>=0&&$('follow-lyrics').checked&&!$('lyrics').hidden){const el=box.children[index];targetScroll=Math.max(0,Math.min(box.scrollHeight-box.clientHeight,el.offsetTop-box.clientHeight/2+el.clientHeight/2));}else targetScroll=index<0&&$('follow-lyrics').checked?0:null;
 }
 if(index>=0){const current=parsed.groups[index],next=parsed.groups[index+1];const end=next?.time??(Number.isFinite(audio.duration)?audio.duration+parsed.offset-delay():current.time+4);const progress=Math.max(0,Math.min(1,(audio.currentTime+parsed.offset-delay()-current.time)/Math.max(.001,end-current.time)));box.children[index].style.setProperty('--verse-progress',String(progress));}
 if(changed)syncTransitions();startAnimation();
}
// One critically damped spring. Retarget from the current position AND velocity;
// never queue scrollIntoView/native smooth-scroll animations.
function tick(now){
 frame=0;if(!moving()){stopAnimation();return;}
 const dt=Math.min(.05,lastFrame===null?0:(now-lastFrame)/1000);lastFrame=now;
 update();
 if(targetScroll!==null&&$('follow-lyrics').checked){
  const target=Math.max(0,Math.min(box.scrollHeight-box.clientHeight,targetScroll));
  if(position===null||Math.abs(position-box.scrollTop)>1)position=box.scrollTop;
  const x=position-target;
  if(reducedMotion()||(Math.abs(x)<.35&&Math.abs(velocity)<2)){position=target;velocity=0;}
  else {const omega=11, decay=Math.exp(-omega*dt), c=velocity+omega*x;
   position=target+(x+c*dt)*decay;velocity=(velocity-omega*c*dt)*decay;}
 box.scrollTop=position;
 }else {velocity=0;position=null;}
 startAnimation();
}
function startAnimation(){if(!frame&&moving())frame=requestAnimationFrame(tick);}
function playbackChanged(){if(moving()){lastFrame=null;syncTransitions();startAnimation();}else stopAnimation();}
audio.addEventListener('playing',()=>{buffering=false;playbackChanged();});
audio.addEventListener('waiting',()=>{buffering=true;playbackChanged();});
['pause','ended'].forEach(event=>audio.addEventListener(event,playbackChanged));
audio.addEventListener('seeking',()=>{velocity=0;position=null;lastFrame=null;update(true);});
document.addEventListener('visibilitychange',()=>{if(visible())update(true);playbackChanged();});
window.addEventListener('mattoz-preferences',()=>{velocity=0;update(true);});
window.addEventListener('resize',()=>update(true));
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>update(true)).observe(box);
reduced.addEventListener?.('change',()=>{velocity=0;update(true);});
async function load(){const id=++token;stopAnimation();targetScroll=null;velocity=0;position=null;frozen.clear();parsed={groups:[],offset:0};active=-2;box.replaceChildren();if(!track)return;$('lyrics-title').textContent=track.title;$('lyrics-status').textContent='Lendo LRC…';try{const result=await window.mattoz.getLyrics(track.id);if(id!==token)return;if(result.status!=='ok'){$('lyrics-status').textContent=result.status==='missing'?'Coloque um .lrc com o mesmo nome do MP3 na mesma pasta e clique em Recarregar LRC.':'LRC indisponível ou inválido. Use UTF-8 ou UTF-16 LE e no máximo 1 MB.';return;}parsed=LRC.parseLRC(result.text);if(!parsed.groups.length){$('lyrics-status').textContent='Nenhum timestamp válido. Exemplo: [00:12.50]Verso';return;}$('lyrics-status').textContent='Clique num verso para avançar. Ajuste positivo atrasa a letra; negativo adianta.';const fragment=document.createDocumentFragment();for(const group of parsed.groups){const el=document.createElement('button');el.className='lyric-line';el.textContent=group.lines.join('\n')||'♪';el.onclick=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.max(0,Math.min(audio.duration,group.time-parsed.offset+delay()));};fragment.append(el);}box.append(fragment);update(true);}catch{if(id===token)$('lyrics-status').textContent='Erro ao carregar letra. Tente novamente.';}}
window.addEventListener('mattoz-track',e=>{track=e.detail;$('lyric-offset').value=adjustments.get(track.id)||0;load();});$('reload-lyrics').onclick=load;
$('online-lyrics').onclick=async()=>{if(!track)return;const selected=track.id;const searchButton=$('online-lyrics');searchButton.disabled=true;searchButton.textContent='Buscando…';const out=$('online-results');out.replaceChildren();$('lyrics-status').textContent='Buscando no LRCLIB (título e artista enviados ao serviço)…';try{const rows=await window.mattoz.onlineLyrics(selected);if(track.id!==selected)return;$('lyrics-status').textContent=rows.length?'Escolha a versão correspondente. O LRC local tem prioridade.':'Nenhuma letra sincronizada encontrada.';for(const row of rows){const button=document.createElement('button');button.className='online-result';button.textContent=`${row.title} · ${row.artist} · ${row.album} · ${row.duration}s`;button.onclick=async()=>{try{await window.mattoz.onlineLyrics(selected,row.id);if(track.id===selected){out.replaceChildren();load();}}catch(error){$('lyrics-status').textContent='Falha ao obter/salvar letra: '+String(error.message||error);}};out.append(button);}}catch(error){if(track?.id===selected){const message=String(error.message||error);$('lyrics-status').textContent=/HTTP 50[234]/.test(message)?'O serviço de letras está temporariamente indisponível. Sua música continua tocando. Tente novamente em alguns minutos.':/HTTP 429/.test(message)?'O serviço recebeu muitas consultas. Aguarde um pouco antes de tentar novamente.':/timeout|timed out/i.test(message)?'O serviço demorou a responder. Tente novamente.':'Não foi possível buscar a letra. Detalhe: '+message;}}finally{searchButton.disabled=false;searchButton.textContent='Buscar / tentar novamente';}};$('lyric-offset').oninput=()=>{const value=Math.max(-60,Math.min(60,delay()));$('lyric-offset').value=value;if(track)adjustments.set(track.id,value);update(true);};$('reset-offset').onclick=()=>{$('lyric-offset').value=0;if(track)adjustments.delete(track.id);update(true);};$('follow-lyrics').onchange=()=>{velocity=0;position=null;update(true);};['timeupdate','seeked','loadedmetadata'].forEach(e=>audio.addEventListener(e,()=>update()));new MutationObserver(()=>{if(visible())update(true);playbackChanged();}).observe($('lyrics'),{attributes:true,attributeFilter:['hidden']});})();
