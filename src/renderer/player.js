'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const audio = (window.mattozAudio || $('audio'));
  const queue = new PlaybackQueue();
  let loadVersion = 0;
  let loadedId=null;
  let seeking = false;const selection=new Set();
  const time = n => Number.isFinite(n) ? `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}` : '0:00';
  const message = text => { $('status').textContent = text; };
  let plan;
  function drawQueue() {
    plan=undefined; audio.unschedule?.();
    $('queue-count').textContent = `${queue.tracks.length} faixa(s)`;
    const list = $('queue-list'); list.replaceChildren();
    if (!queue.tracks.length) { const p = document.createElement('p'); p.textContent = 'Sua fila está vazia. Adicione MP3s para ouvir.'; list.append(p); }
    const saveButton=document.createElement('button');saveButton.textContent='Salvar fila como playlist';saveButton.disabled=!queue.tracks.length;saveButton.onclick=async()=>{const name=await window.askText('Nome da playlist');if(!name)return;try{const entries=await window.mattoz.savedAction('create',{name});await window.mattoz.savedAction('tracks',{id:entries[entries.length-1].id,tracks:queue.tracks.map(t=>t.id)});message('Fila salva como playlist.');}catch(e){message(e.message);}};list.append(saveButton);
    const bulk=document.createElement('div');bulk.className='queue-bulk';for(const [label,fn]of [['Selecionar todas',()=>{queue.tracks.forEach(t=>selection.add(t.id));drawQueue();}],['Limpar seleção',()=>{selection.clear();drawQueue();}],['Remover selecionadas',()=>{const id=queue.current?.id;queue.tracks=queue.tracks.filter(t=>t.id===id||!selection.has(t.id));queue.index=queue.tracks.findIndex(t=>t.id===id);selection.clear();queue.history=[];queue.bag=[];drawQueue();saveSession();message('Seleção removida. A música atual foi preservada.');}],['Tocar selecionadas a seguir',()=>{const id=queue.current?.id;const picked=queue.tracks.filter(t=>t.id!==id&&selection.has(t.id));queue.tracks=queue.tracks.filter(t=>t.id===id||!selection.has(t.id));queue.index=queue.tracks.findIndex(t=>t.id===id);queue.tracks.splice(queue.index+1,0,...picked);queue.history=[];queue.bag=[];selection.clear();drawQueue();saveSession();}]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;bulk.append(b);}list.append(bulk);
    queue.tracks.forEach((track, index) => {const check=document.createElement('input');check.type='checkbox';check.checked=selection.has(track.id);check.setAttribute('aria-label','Selecionar '+track.title);check.onchange=()=>{if(check.checked)selection.add(track.id);else selection.delete(track.id);};list.append(check);
      const button = document.createElement('button'); button.className = 'queue-track';
      button.textContent = `${index === queue.index ? '♫' : String(index + 1).padStart(2, '0')}   ${track.title}`;
      button.setAttribute('aria-label', `Reproduzir ${track.title}`);
      if (index === queue.index) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', () => { queue.select(index); loadTrack(); });
      button.draggable=true;button.ondragstart=e=>e.dataTransfer.setData('text/plain',String(index));button.ondragover=e=>e.preventDefault();button.ondrop=e=>{e.preventDefault();const raw=e.dataTransfer.getData('text/plain');if(!/^\d+$/.test(raw))return;const from=Number(raw);if(from>=queue.tracks.length)return;const id=queue.current?.id;queue.tracks.splice(index,0,queue.tracks.splice(from,1)[0]);queue.index=queue.tracks.findIndex(t=>t.id===id);queue.history=[];queue.bag=[];drawQueue();saveSession();};
      const remove=document.createElement('button');remove.textContent='Remover';remove.setAttribute('aria-label','Remover '+track.title+' da fila');remove.onclick=()=>{if(index===queue.index){message('Para remover esta faixa, selecione outra primeiro.');return;}const id=queue.current?.id;queue.tracks.splice(index,1);queue.index=queue.tracks.findIndex(t=>t.id===id);queue.history=[];queue.bag=[];drawQueue();saveSession();};list.append(button,remove);
    });
  }
  function drawControls() {
    for (const id of ['play', 'next', 'previous']) $(id).disabled = !queue.current;
    $('play').innerHTML = audio.paused ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 3v18l15-9z"/></svg>' : '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M5 3h5v18H5zm9 0h5v18h-5z"/></svg>';
    $('next').innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 4v16l12-8zM18 4h3v16h-3z"/></svg>';$('previous').innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M20 4v16L8 12zM3 4h3v16H3z"/></svg>';
    $('play').setAttribute('aria-label', audio.paused ? 'Reproduzir' : 'Pausar');
    $('shuffle').setAttribute('aria-pressed', String(queue.shuffle));
    const label = { off: 'Repetição desativada', all: 'Repetir todas', one: 'Repetir uma' }[queue.repeat];
    $('repeat').textContent = queue.repeat === 'one' ? '↻¹' : '↻';
    $('repeat').setAttribute('aria-label', label); $('repeat').title = label;
    $('repeat').classList.toggle('active-control', queue.repeat !== 'off');
  }
  async function safePlay() {
    const version = loadVersion;
    try { await audio.play(); }
    catch (error) {
      if (version !== loadVersion || error.name === 'AbortError') return;
      message('Não foi possível tocar esta faixa. Confira se o arquivo está acessível e é um MP3 válido; tente outra faixa.');
    }
    drawControls();
  }
  function showTrack() {
    if (!queue.current) return;
    const cover=document.querySelector('.cover-placeholder');cover.replaceChildren();if(queue.current.artwork){const img=new Image();img.src=queue.current.artwork;img.alt='';img.style.width='100%';img.style.height='100%';img.style.objectFit='cover';cover.append(img);}else cover.textContent='♫';
    $('track-title').textContent = queue.current.title;
    $('track-title').title = queue.current.title;
    $('track-subtitle').textContent = (queue.current?.artist || 'MP3 local') + ' · Fila desta sessão';
    $('elapsed').textContent = '0:00'; $('duration').textContent = '0:00'; $('seek').value = 0; $('seek').disabled = true;
    window.dispatchEvent(new CustomEvent('mattoz-track', { detail: queue.current }));
    message(''); drawQueue(); drawControls();
  }
  function loadTrack(autoplay=true,position=0) {
    if(!queue.current)return;
    if(audio.albumMode&&(!queue.current.duration||queue.current.duration>900))audio.setAlbumMode(false);
    loadVersion++;audio.pause();loadedId=queue.current.id;audio.src=queue.current.url;audio.load();
    if(Number.isFinite(position)&&position>0){
      const revision=loadVersion;
      const seekToMoment=()=>{audio.removeEventListener('loadedmetadata',seekToMoment);if(revision===loadVersion&&Number.isFinite(audio.duration))audio.currentTime=Math.min(position,audio.duration);};
      audio.addEventListener('loadedmetadata',seekToMoment);
    }
    showTrack();if(autoplay)safePlay();
  }
  async function addFiles() {
    const buttons = document.querySelectorAll('[data-add-audio]'); buttons.forEach(b => { b.disabled = true; });
    try {
      const result = await window.mattoz.selectAudioFiles();
      queue.add(result.tracks); drawQueue();
      if (!queue.current && queue.tracks.length) { queue.select(0); loadTrack(); }
      if (result.skipped) message(`${result.skipped} arquivo(s) não puderam ser abertos. Confira a disponibilidade e a extensão MP3.`);
    } catch { message('Não foi possível selecionar as músicas. Feche o diálogo e tente novamente.'); }
    finally { buttons.forEach(b => { b.disabled = false; }); }
  }
  document.querySelectorAll('[data-add-audio]').forEach(button => button.addEventListener('click', addFiles));
  function toggle() {
    if (!queue.current) return;
    if (!audio.paused) audio.pause();
    else if (audio.error) loadTrack();
    else { if (audio.ended) audio.currentTime = 0; safePlay(); }
  }
  function planNext(){
    if(plan!==undefined)return plan;
    const snapshot=new PlaybackQueue(queue.random);
    Object.assign(snapshot,queue,{tracks:[...queue.tracks],history:[...queue.history],bag:[...queue.bag]});
    plan=snapshot.next(true)?snapshot:null;
    return plan;
  }
  function commit(planned){
    Object.assign(queue,planned);loadVersion++;loadedId=queue.current.id;
    showTrack();saveSession();
  }
  async function next(ended=false){
    const planned=ended&&audio.prepare&&!window.mattozSleep?.mode?planNext():null;
    if(planned&&audio.preparedReady&&audio.prepared.url===planned.current.url){
      const revision=loadVersion;
      if(await audio.promote(0,()=>commit(planned),()=>plan===planned))return;
      if(revision!==loadVersion||!audio.ended)return;
    }
    if(queue.next(ended))loadTrack();
    else {audio.cancelTransition?.();audio.pause();if(ended)message('Fim da fila. Adicione músicas ou ative Repetir todas.');}
    drawControls();
  }
  setInterval(()=>{
    if(!audio.prepare||!queue.current||audio.tail||audio.pending)return;
    if(!audio.albumMode&&!window.mattozTransitions?.preload){audio.clearPrepared();return;}
    const planned=planNext();
    if(audio.albumMode && planned && (!planned.current.duration||planned.current.duration>900)){audio.clearPrepared();return;}
    audio.prepare(planned?.current.url);
    if(!planned||!audio.preparedReady||audio.paused||audio.seeking||audio.readyState<3)return;
    if(audio.albumMode){if(!window.mattozSleep?.mode)audio.schedule();else audio.unschedule();return;}
    const seconds=window.mattozTransitions.seconds,left=audio.duration-audio.currentTime;
    if(seconds>0&&!window.mattozSleep?.mode&&audio.duration>seconds*2&&audio.prepared.deck.duration>seconds*2&&left>0&&left<=seconds&&planned.current.id!==queue.current.id){
      audio.promote(left,()=>commit(planned),()=>plan===planned&&!window.mattozSleep?.mode).catch(()=>{});
    }
  },80);
  function previous() {
    if (!queue.current) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (queue.previous()) loadTrack(); else audio.currentTime = 0;
  }
  $('play').addEventListener('click', toggle);
  $('next').addEventListener('click', () => next());
  $('previous').addEventListener('click', previous);
  $('shuffle').addEventListener('click', () => { queue.toggleShuffle(); plan=undefined; audio.unschedule?.(); drawControls(); });
  $('repeat').addEventListener('click', () => { queue.repeat = { off: 'all', all: 'one', one: 'off' }[queue.repeat]; plan=undefined; audio.unschedule?.(); drawControls(); });
  function volumeUI() { $('mute').setAttribute('aria-pressed', String(audio.muted)); $('mute').setAttribute('aria-label', audio.muted ? 'Ativar som' : 'Silenciar'); $('mute').textContent = audio.muted ? '×' : '♪'; }
  audio.volume = .7;
  $('volume').addEventListener('input', () => { audio.volume = Number($('volume').value) / 100; audio.muted = false; volumeUI(); });
  $('mute').addEventListener('click', () => { audio.muted = !audio.muted; volumeUI(); });
  $('seek').addEventListener('input', () => { seeking = true; $('elapsed').textContent = time(Number($('seek').value)); });
  $('seek').addEventListener('change', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(Number($('seek').value), audio.duration); seeking = false; });
  function progress() {
    const valid = Number.isFinite(audio.duration) && audio.duration > 0;
    $('seek').disabled = !valid;
    if (valid) $('seek').max = audio.duration;
    $('duration').textContent = time(audio.duration);
    if (!seeking) { $('seek').value = audio.currentTime; $('elapsed').textContent = time(audio.currentTime); }
    $('seek').setAttribute('aria-valuetext', `${time(audio.currentTime)} de ${time(audio.duration)}`);
  }
  ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked'].forEach(event => audio.addEventListener(event, progress));
  ['play', 'pause'].forEach(event => audio.addEventListener(event, drawControls));
  audio.addEventListener('ended', () => {if(window.mattozSleep?.consumeEnd())return;next(true);});
  audio.addEventListener('error', () => { if(audio.albumMode){audio.setAlbumMode(false);loadTrack();return;}message('Arquivo indisponível ou MP3 inválido. Se estiver em um pendrive, reconecte-o e pressione play, ou escolha outra faixa.'); drawControls(); });
  audio.addEventListener('waiting', () => { $('track-subtitle').textContent = 'Carregando áudio…'; });
  audio.addEventListener('playing', () => { $('track-subtitle').textContent = (queue.current?.artist || 'MP3 local') + ' · Fila desta sessão'; message(''); });
  document.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, button, [contenteditable="true"]') || event.repeat) return;
    if (event.code === 'Space' && !event.ctrlKey && !event.altKey) { event.preventDefault(); toggle(); }
    if (event.ctrlKey && event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.ctrlKey && event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
  });
  window.addEventListener('mattoz-enqueue',event=>{const t=event.detail.track;if(!t||t.missing)return;const id=queue.current?.id;if(t.id===id)return;queue.tracks=queue.tracks.filter(x=>x.id!==t.id);queue.index=queue.tracks.findIndex(x=>x.id===id);queue.tracks.splice(event.detail.next?queue.index+1:queue.tracks.length,0,t);queue.history=[];queue.bag=[];if(!queue.current){queue.select(0);loadTrack(false);}drawQueue();saveSession();});
  let restoring=true;
  function saveSession(){if(restoring||!queue.current||queue.current.id!==loadedId)return;window.mattoz.collectionAction('session:set',{ids:queue.tracks.map(t=>t.id),id:queue.current.id,position:audio.currentTime||0}).catch(()=>{});}
  Promise.all([window.mattoz.collectionAction('session:get'),window.mattoz.libraryAction('list')]).then(([session,lib])=>{if(!session||queue.current)return;const map=new Map(lib.tracks.map(t=>[t.id,t]));queue.add(session.ids.map(id=>map.get(id)).filter(t=>t&&!t.missing));queue.select(Math.max(0,queue.tracks.findIndex(t=>t.id===session.id)));if(queue.current){const id=queue.current.id;audio.addEventListener('loadedmetadata',()=>{if(queue.current?.id===id&&Number.isFinite(audio.duration)&&id===session.id)audio.currentTime=Math.min(session.position,audio.duration);},{once:true});loadTrack(false);}}).catch(()=>{}).finally(()=>{restoring=false;});
  setInterval(saveSession,3000);audio.addEventListener('pause',saveSession);
  window.addEventListener('mattoz-play-library', event => { audio.setAlbumMode?.(event.detail.gapless===true); if(event.detail.albumMode){queue.shuffle=false;queue.repeat='off';} if(event.detail.replace){queue.tracks=[];queue.index=-1;queue.history=[];queue.bag=[];} for (const incoming of event.detail.tracks) { const existing = queue.tracks.find(t => t.id === incoming.id); if (existing) Object.assign(existing, incoming); } queue.add(event.detail.tracks); queue.select(queue.tracks.findIndex(t => t.id === event.detail.id)); loadTrack(true,event.detail.position);  });
  window.mattoz.savedAction('list').then(s=>{ if(typeof s.preferences.volume==='number'){audio.volume=s.preferences.volume;$('volume').value=audio.volume*100;} }).catch(()=>{});
  $('volume').addEventListener('change',()=>window.mattoz.savedAction('preferences',{volume:audio.volume}).catch(()=>{}));
  let lastRecorded=null;audio.addEventListener('playing',()=>{if(queue.current&&lastRecorded!==queue.current.id){lastRecorded=queue.current.id;window.mattoz.savedAction('played',{id:lastRecorded}).catch(()=>{});}});
  drawQueue(); drawControls();
})();
