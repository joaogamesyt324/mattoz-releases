'use strict';
(()=>{
 const U=MusicUI,el=U.element,dialog=el('dialog','global-search'),title=el('h2','','Buscar na sua coleção'),input=el('input'),results=el('div'),close=el('button','','Fechar');
 title.id='global-search-title';dialog.setAttribute('aria-labelledby',title.id);input.type='search';input.placeholder='Música, artista, álbum ou playlist';input.setAttribute('aria-label','Busca global');close.onclick=()=>dialog.close();dialog.append(title,input,close,results);document.body.append(dialog);
 let tracks=[],playlists=[],generation=0;
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const action=(label,fn)=>{const b=el('button','global-result',label);b.onclick=()=>{dialog.close();fn();};return b;};
 function render(){results.replaceChildren();const q=normalize(input.value.trim());let count=0;
 const section=(label,items,draw)=>{if(!items.length)return;results.append(el('h3','',label));for(const item of items.slice(0,30)){results.append(draw(item));count++;}};
 section('Músicas',tracks.filter(t=>normalize(`${t.title} ${t.artist} ${t.album}`).includes(q)),t=>{const b=action(`${t.title} · ${t.artist||'Artista desconhecido'}`,()=>U.play([t]));b.disabled=!!t.missing;return b;});
 for(const [key,label] of [['artist','Artistas'],['album','Álbuns']]){const groups=new Map();for(const t of tracks){if(!t[key])continue;const id=key==='album'?`${t.artist}\0${t.album}`:t.artist;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(t);}section(label,[...groups.values()].filter(g=>normalize(g[0][key]).includes(q)),g=>action(`${g[0][key]} · ${g.length} faixas`,()=>U.play(g.slice().sort((a,b)=>(Number(a.disc)||1)-(Number(b.disc)||1)||(Number(a.track)||0)-(Number(b.track)||0)))));}
 section('Playlists',playlists.filter(p=>normalize(p.name).includes(q)),p=>action(p.name,()=>U.openPlaylist(p.id)));
 if(!count)results.append(el('p','','Nenhum resultado.'));
 }
 async function open(){if(dialog.open){input.focus();return;}dialog.showModal();input.focus();results.textContent='Carregando…';const id=++generation;try{const [lib,saved]=await Promise.all([window.mattoz.libraryAction('list'),window.mattoz.savedAction('list')]);if(id!==generation||!dialog.open)return;tracks=lib.tracks;playlists=saved.playlists;render();}catch{results.textContent='Não foi possível carregar a coleção. Feche e tente novamente.';}}
 input.oninput=render;dialog.addEventListener('close',()=>generation++);
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}});
 const launch=el('button','text-button','Buscar · Ctrl+K');launch.onclick=open;document.querySelector('.topbar').append(launch);
})();
