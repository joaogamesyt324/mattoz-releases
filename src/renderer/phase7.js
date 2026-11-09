'use strict';
(()=>{
 const U=MusicUI,el=U.element;let tracks=[],state,current=null,timer=null,deadline=0,revision=0;
 const panel=el('section','page phase-seven');panel.id='discover-page';panel.hidden=true;document.querySelector('#content').append(panel);
 pages.discover={label:'Descobrir sua coleção',section:'discover-page'};
 const nav=el('button','','⌕ Buscar e descobrir');nav.dataset.page='discover';nav.onclick=()=>navigate('discover');document.querySelector('.sidebar nav').append(nav);
 const title=el('h1','','Sua coleção, novas descobertas.');const search=el('input','playlist-search');search.type='search';search.placeholder='Música, artista, álbum ou playlist';search.setAttribute('aria-label','Busca geral');
 const modes=el('div','playlist-actions'),results=el('div','playlist-table'),notice=el('p','muted');let mode='all';
 const button=(label,fn)=>{const b=el('button','',label);b.onclick=()=>Promise.resolve().then(fn).catch(e=>{notice.textContent=e.message;});return b;};
 for(const [key,label] of [['all','Todas'],['favorites','♥ Curtidas'],['forgotten','Pouco ouvidas'],['top','Mais ouvidas']])modes.append(button(label,()=>{mode=key;render();}));
 const timerBox=el('div','playlist-actions'),status=el('span','muted');timerBox.append(el('span','','Temporizador:'));
 window.mattozSleep=new SleepTimer((window.mattozAudio || document.querySelector('audio')),text=>{status.textContent=text;});
 const fade=el('input');fade.type='checkbox';fade.checked=true;const fadeLabel=el('label','','Reduzir volume nos últimos 10 segundos ');fadeLabel.append(fade);timerBox.append(fadeLabel);
 for(const minutes of [15,30,60])timerBox.append(button(minutes+' min',()=>window.mattozSleep.start(minutes,fade.checked?10:0)));
 timerBox.append(button('Fim desta faixa',()=>window.mattozSleep.endOfTrack()),button('Cancelar',()=>window.mattozSleep.cancel()),status);
 setInterval(()=>window.mattozSleep.tick(),100);
 for(const id of ['volume','pref-volume'])document.getElementById(id).addEventListener('input',()=>window.mattozSleep.cancel(),{capture:true});
 window.addEventListener('mattoz-track',()=>{if(window.mattozSleep.mode==='track')window.mattozSleep.cancel();});
 panel.append(title,search,modes,timerBox,notice,results);
 async function load(){const token=++revision;try{const [lib,saved]=await Promise.all([window.mattoz.libraryAction('list'),window.mattoz.savedAction('list')]);if(token!==revision)return;tracks=lib.tracks;state=saved;render();}catch(e){notice.textContent=e.message;}}
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function render(){if(!state)return;results.replaceChildren();const q=normalize(search.value);let list=tracks.filter(t=>normalize([t.title,t.artist,t.album].join(' ')).includes(q));
 if(mode==='favorites')list=list.filter(t=>state.favorites.includes(t.id));
 if(mode==='forgotten'||mode==='top'){const sign=mode==='top'?-1:1;list.sort((a,b)=>sign*((state.listening.tracks[a.id]||0)-(state.listening.tracks[b.id]||0)));list=list.slice(0,30);}
 const playable=list.filter(t=>!t.missing);const play=button('▶ Ouvir seleção ('+playable.length+')',()=>U.play(playable));play.disabled=!playable.length;results.append(play);
 for(const t of list.slice(0,200)){const row=el('div','add-song');row.append(U.cover([t]));const b=button(t.title+' · '+(t.artist||'Artista desconhecido')+' · '+(t.album||''),()=>U.play(playable,t.id));b.disabled=t.missing;row.append(b,button('A seguir',()=>window.dispatchEvent(new CustomEvent('mattoz-enqueue',{detail:{track:t,next:true}}))),button('+ Fila',()=>window.dispatchEvent(new CustomEvent('mattoz-enqueue',{detail:{track:t,next:false}}))),button(state.favorites.includes(t.id)?'♥ Curtida':'♡ Curtir',async()=>{await window.mattoz.savedAction('favorite',{id:t.id});await load();}));results.append(row);}
 if(!list.length)results.append(el('p','muted','Nenhuma faixa encontrada. Importe músicas na biblioteca ou altere sua busca.'));
 if(list.length>200)results.append(el('p','muted','Exibindo 200 resultados. Refine sua busca.'));
 if(mode==='all'){results.append(el('h2','','Playlists'));for(const p of state.playlists.filter(p=>normalize(p.name).includes(q)))results.append(button(p.name,()=>U.openPlaylist(p.id)));}
 }
 search.oninput=render;window.addEventListener('mattoz-page',e=>{if(e.detail==='discover')load();});
 window.addEventListener('mattoz-track',e=>{current=e.detail;});
})();
