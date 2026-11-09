'use strict';
(()=>{
 function ordered(tracks){return [...tracks].sort((a,b)=>(a.disc||1)-(b.disc||1)||(a.track||0)-(b.track||0)||String(a.title).localeCompare(String(b.title),'pt-BR'));}
 function sides(tracks){const result=new Map(),discs=new Map();for(const t of ordered(tracks)){const disc=t.disc||1;if(!discs.has(disc))discs.set(disc,[]);discs.get(disc).push(t);}for(const [disc,list] of discs){const total=list.reduce((sum,t)=>sum+(t.duration||0),0);let elapsed=0;list.forEach((t,index)=>{result.set(t.id,`Disco ${disc} · Lado ${index>0&&(total?elapsed>=total/2:index>=Math.ceil(list.length/2))?'B':'A'}`);elapsed+=t.duration||0;});}return result;}
 if(typeof module!=='undefined'&&module.exports){module.exports={ordered,sides};return;}
 let currentId=null;
 window.addEventListener('mattoz-track',e=>{currentId=e.detail.id;mark();});
 function mark(){for(const row of document.querySelectorAll('.album-track')){const active=row.dataset.track===currentId;row.classList.toggle('is-current',active);if(active)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');}const label=document.querySelector('.album-current-side'),active=document.querySelector('.album-track.is-current');if(label)label.textContent=active?active.dataset.side:'Escolha uma faixa para ouvir o álbum.';}
 function render(out,input){
  const U=MusicUI,el=U.element,tracks=ordered(input),first=tracks[0];if(!first)return;const side=sides(tracks);
  const root=el('div','album-experience'),hero=el('div','album-listen-hero'),copy=el('div');out.append(root);
  copy.append(el('p','eyebrow','OUVIR O ÁLBUM'),el('h1','',first.album||'Álbum desconhecido'),el('p','',first.albumArtist||first.artist||'Artista desconhecido'),el('p','muted',`${tracks.length} faixas · ${U.duration(tracks.reduce((s,t)=>s+(t.duration||0),0))}${first.year?' · '+first.year:''}`));
  hero.append(U.cover(tracks),copy);root.append(hero);const status=el('p','muted');status.setAttribute('role','status');
  const button=(text,fn)=>{const b=el('button','',text);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};return b;};
  const play=(id,gapless=false)=>{const available=tracks.filter(t=>!t.missing);if(available.length)window.dispatchEvent(new CustomEvent('mattoz-play-library',{detail:{tracks:available,id:id||available[0].id,replace:true,albumMode:true,gapless}}));};
  const start=button('▶ Ouvir álbum em ordem',()=>play());start.classList.add('primary');start.disabled=tracks.every(t=>t.missing);const continuous=button('Ouvir álbum sem intervalos',()=>play(null,true));continuous.disabled=start.disabled;
  root.append(start,continuous,el('p','muted','Inicia uma nova fila em ordem, sem aleatório nem repetição. Você pode mudar esses controles depois.'),el('p','album-current-side'),el('small','muted','Lados A/B são uma divisão virtual pela duração de cada disco; não representam a edição física.'),status);
  const table=el('div','album-tracklist');for(const [index,t] of tracks.entries()){const row=button('',()=>play(t.id));row.classList.add('album-track');row.dataset.track=t.id;row.dataset.side=side.get(t.id);row.disabled=!!t.missing;row.append(el('span','',String(index+1).padStart(2,'0')),el('strong','',t.title),el('small','',side.get(t.id)),el('span','',t.missing?'Indisponível':`${Math.floor((t.duration||0)/60)}:${String(Math.floor((t.duration||0)%60)).padStart(2,'0')}`));table.append(row);}root.append(table);mark();
  const booklet=el('details','album-booklet');booklet.append(el('summary','','Encarte digital · créditos, contracapa e fotos'));root.append(booklet);const body=el('div');booklet.append(body);
  let data=null,busy=false;
  async function change(action,values={}){if(busy)return;busy=true;body.inert=true;try{const result=await window.mattoz.collectionAction(action,{id:first.id,...values});if(!root.isConnected)return;if(action==='album:export-pdf'){status.textContent=result?'PDF exportado. Abra-o no seu leitor de PDF.':'Exportação cancelada.';}else{data=result;draw();status.textContent='Encarte salvo neste computador.';}}finally{busy=false;body.inert=false;}}
  function draw(){body.replaceChildren();if(!data)return;const label=el('label','','Créditos e memórias do álbum'),text=el('textarea','album-credits');text.value=data.credits||'';text.maxLength=20000;text.rows=6;label.append(text);body.append(label,button('Salvar créditos',()=>change('album:credits',{text:text.value})));
   const controls=el('div','playlist-actions');controls.append(button('Escolher contracapa',()=>change('album:attach',{kind:'back'})),button('Adicionar foto',()=>change('album:attach',{kind:'photo'})),button(data.pdf?'Substituir PDF':'Adicionar PDF',()=>change('album:attach',{kind:'pdf'})));body.append(controls,el('p','muted','PNG/JPEG até 3 MB · até 8 fotos · PDF até 12 MB. Os anexos são copiados para a coleção e incluídos no backup.'));
   const gallery=el('div','album-booklet-gallery');const picture=(url,caption,kind,assetId)=>{const figure=el('figure'),img=el('img');img.src=url;img.alt=caption;img.loading='lazy';figure.append(img,el('figcaption','',caption),button('Remover',()=>change('album:remove',{kind,assetId})));gallery.append(figure);};if(data.back)picture(data.back,'Contracapa','back');for(const [i,p]of (data.photos||[]).entries())picture(p.image,`Foto ${i+1}`,'photo',p.id);body.append(gallery);
   if(data.pdf){const pdf=el('div','playlist-actions');pdf.append(el('span','',data.pdf.name),button('Exportar PDF para ler',()=>change('album:export-pdf')),button('Remover PDF',()=>change('album:remove',{kind:'pdf'})));body.append(pdf);}
  }
  window.mattoz.collectionAction('album:get',{id:first.id}).then(result=>{if(root.isConnected){data=result;draw();}}).catch(e=>{if(root.isConnected)status.textContent='Não foi possível carregar o encarte: '+e.message;});
 }
 window.MattozAlbum={render};
})();
