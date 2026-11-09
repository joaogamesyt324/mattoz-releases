'use strict';
(() => {
  const el=MusicUI.element, api=(action,data)=>window.mattoz.collectionAction('personal:'+action,data);
  const audio=window.mattozAudio||document.getElementById('audio');
  let track=null,searchVersion=0,monthVersion=0,momentVersion=0,debounce;
  const panel=el('section','page personal-page');panel.id='personal-page';panel.hidden=true;
  pages.personal={label:'Minha coleção',section:panel.id};document.getElementById('content').append(panel);
  const nav=el('button','','♡ Minha coleção');nav.dataset.page='personal';nav.onclick=()=>navigate('personal');document.querySelector('.sidebar nav').append(nav);
  const notice=el('p','personal-status');notice.setAttribute('role','status');
  const clock=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
  const duration=value=>value<60?`${Math.floor(value)} s`:MusicUI.duration(value);
  function button(text,action){const b=el('button','',text);b.type='button';b.onclick=async()=>{b.disabled=true;try{await action();}catch(error){notice.textContent=error.message;}finally{if(b.isConnected)b.disabled=false;}};return b;}
  function playAt(item,position){
    if(!item||item.missing)return;
    window.dispatchEvent(new CustomEvent('mattoz-play-library',{detail:{tracks:[item],id:item.id,replace:true,position:position||0}}));
  }
  panel.append(el('p','eyebrow','SUAS MÚSICAS, SUAS HISTÓRIAS'),el('h1','','Minha coleção'),notice);
  const searchSection=el('section','personal-section'),query=el('input'),searchInfo=el('p','muted'),results=el('div','personal-list');
  query.type='search';query.placeholder='Qual verso ficou na sua cabeça?';query.maxLength=200;query.setAttribute('aria-label','Buscar nas letras salvas');
  searchSection.append(el('h2','','Encontre pelo verso'),query,searchInfo,results);panel.append(searchSection);
  async function search(){
    const version=++searchVersion,text=query.value.trim();results.replaceChildren();
    if(text.length<2){searchInfo.textContent='Digite ao menos duas letras. A busca usa as letras salvas na sua coleção.';return;}
    searchInfo.textContent='Procurando nas letras salvas…';
    try{
      const found=await api('search',{query:text});if(version!==searchVersion||found.cancelled)return;
      searchInfo.textContent=found.truncated?'Exibindo os primeiros 100 versos. Refine a busca.':`${found.rows.length} verso(s) encontrado(s) em ${found.scanned} músicas consultadas.`;
      for(const row of found.rows){
        const card=el('article','personal-row'),info=el('div');info.append(el('strong','',row.track.title),el('small','muted',row.track.artist||''),el('p','',row.text));
        const play=button(row.track.missing?'Arquivo indisponível':row.position===null?'Ouvir música':'Ouvir em '+clock(row.position),()=>playAt(row.track,row.position));play.disabled=!!row.track.missing;
        card.append(info,play);results.append(card);
      }
    }catch(error){if(version===searchVersion)searchInfo.textContent='Não foi possível buscar. '+error.message;}
  }
  query.oninput=()=>{searchVersion++;clearTimeout(debounce);api('search-cancel').catch(()=>{});debounce=setTimeout(search,350);};search();
  const momentsSection=el('section','personal-section'),momentList=el('div','personal-list');
  const save=button('♡ Guardar este momento',async()=>{
    if(!track||!Number.isFinite(audio.duration))return;
    const selected=track,position=audio.currentTime;
    const label=await window.askText('Dê um nome a este momento',(selected.title+' · '+clock(position)).slice(0,100));
    if(label===null)return;
    await api('moment-add',{trackId:selected.id,position,label});notice.textContent='Momento guardado em '+clock(position)+'.';await loadMoments();
  });save.disabled=true;
  momentsSection.append(el('h2','','Momentos favoritos'),el('p','muted','Guarde um solo, uma entrada ou o seu refrão favorito.'),save,momentList);panel.append(momentsSection);
  const shortcut=button('♡',()=>save.click());shortcut.title='Guardar momento da música';shortcut.setAttribute('aria-label','Guardar momento da música');shortcut.classList.add('moment-shortcut');shortcut.disabled=true;
  document.querySelector('.player-tools').prepend(shortcut);
  function syncMoment(){save.disabled=shortcut.disabled=!track||!Number.isFinite(audio.duration)||audio.duration<=0;}
  window.addEventListener('mattoz-track',event=>{track=event.detail;syncMoment();});audio.addEventListener('loadedmetadata',syncMoment);audio.addEventListener('emptied',syncMoment);
  async function loadMoments(){
    const version=++momentVersion,items=await api('moments');if(version!==momentVersion)return;
    momentList.replaceChildren();if(!items.length)momentList.append(el('p','muted','Seus momentos favoritos vão aparecer aqui.'));
    for(const item of items){
      const row=el('article','personal-row'),info=el('div');info.append(el('strong','',item.label),el('small','muted',`${item.track?.title||'Música removida da biblioteca'} · ${clock(item.position)}`));
      const play=button('Ouvir momento',()=>playAt(item.track,item.position));play.disabled=!item.track||!!item.track.missing;
      const remove=button('Remover',async()=>{await api('moment-remove',{id:item.id});await loadMoments();});remove.setAttribute('aria-label','Remover momento '+item.label);
      row.append(info,play,remove);momentList.append(row);
    }
  }
  const capsuleSection=el('section','personal-section'),month=el('input'),capsuleBody=el('div');month.type='month';month.setAttribute('aria-label','Mês da cápsula');
  const today=new Date();month.value=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0');
  capsuleSection.append(el('h2','','Sua cápsula do mês'),month,capsuleBody);panel.append(capsuleSection);
  async function loadCapsule(){
    const selected=month.value;if(!selected)return;
    const version=++monthVersion;capsuleBody.textContent='Preparando sua cápsula…';
    try{
      const data=await api('capsule',{month:selected});if(version!==monthVersion)return;
      capsuleBody.replaceChildren();
      if(!data.trackCount){capsuleBody.append(el('p','muted','Ainda não há escutas registradas neste mês. Escolha outro mês ou dê play para começar.'));return;}
      const counters=el('div','listening-stats');
      for(const [value,label]of [[duration(data.seconds),'de música ouvida'],[String(data.trackCount),'músicas diferentes']]){const card=el('div');card.append(el('strong','',value),el('small','',label));counters.append(card);}
      capsuleBody.append(counters,el('h3','','Artistas do mês'));
      for(const [artist,seconds]of data.artists)capsuleBody.append(el('p','',artist+' · '+duration(seconds)));
      const available=data.ranked.filter(row=>!row.track.missing).map(row=>row.track),actions=el('div','playlist-actions');
      const listen=button('▶ Ouvir cápsula',()=>MusicUI.play(available)),playlist=button('Salvar como playlist',async()=>{const result=await api('capsule-playlist',{month:selected});MusicUI.openPlaylist(result.id);});
      listen.disabled=playlist.disabled=!available.length;actions.append(listen,playlist);capsuleBody.append(actions,el('h3','','As mais ouvidas'));
      for(const [index,row]of data.ranked.entries()){const play=button(`${index+1}. ${row.track.title} · ${row.track.artist||''} · ${duration(row.seconds)}`,()=>MusicUI.play(available,row.track.id));play.classList.add('capsule-track');play.disabled=!!row.track.missing;capsuleBody.append(play);}
      if(data.removed)capsuleBody.append(el('p','muted',`${data.removed} música(s) do histórico foram removidas da biblioteca. O tempo ouvido permanece no total.`));
    }catch(error){if(version===monthVersion)capsuleBody.textContent=error.message;}
  }
  month.onchange=loadCapsule;
  window.addEventListener('mattoz-page',event=>{
    if(event.detail==='personal'){if(query.value.trim().length>=2)search();notice.textContent='';loadMoments().catch(error=>{notice.textContent=error.message;});loadCapsule();}
    else{clearTimeout(debounce);searchVersion++;api('search-cancel').catch(()=>{});}
  });
})();
