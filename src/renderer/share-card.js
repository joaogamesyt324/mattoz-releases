'use strict';
(()=>{
 function fit(ctx,text,width){const chars=Array.from(String(text||'').replace(/\s+/g,' ').trim());if(ctx.measureText(chars.join('')).width<=width)return chars.join('');while(chars.length&&ctx.measureText(chars.join('')+'…').width>width)chars.pop();return chars.join('')+'…';}
 function paint(canvas,track,image,accent='#d8f880'){
  canvas.width=canvas.height=1080;const c=canvas.getContext('2d');if(!c)throw Error('Não foi possível gerar a imagem.');
  c.fillStyle='#101312';c.fillRect(0,0,1080,1080);const glow=c.createRadialGradient(820,160,0,820,160,900);glow.addColorStop(0,accent+'44');glow.addColorStop(1,'#10131200');c.fillStyle=glow;c.fillRect(0,0,1080,1080);
  c.fillStyle=accent;c.font='bold 34px "Segoe UI", sans-serif';c.fillText('m.',72,92);c.fillStyle='#f6f6ee';c.font='bold 24px "Segoe UI", sans-serif';c.fillText('MATTOZ MUSIC PLAYER',132,87);
  const x=260,y=150,size=560;c.save();c.beginPath();c.roundRect(x,y,size,size,24);c.clip();c.fillStyle='#292f2a';c.fillRect(x,y,size,size);
  if(image){const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,scale=Math.max(size/iw,size/ih);c.drawImage(image,x+(size-iw*scale)/2,y+(size-ih*scale)/2,iw*scale,ih*scale);}else{c.fillStyle=accent;c.font='bold 140px "Segoe UI", sans-serif';c.textAlign='center';c.fillText('m.',540,480);}c.restore();
  c.textAlign='center';c.fillStyle=accent;c.font='18px "Segoe UI", sans-serif';c.fillText('NA MINHA COLEÇÃO',540,767);c.fillStyle='#f6f6ee';c.font='bold 46px "Segoe UI", sans-serif';c.fillText(fit(c,track.title||'Música local',930),540,834);c.font='28px "Segoe UI", sans-serif';c.fillStyle='#c5cdc4';c.fillText(fit(c,track.artist||'Artista desconhecido',930),540,884);c.font='22px "Segoe UI", sans-serif';c.fillStyle='#94a090';c.fillText(fit(c,[track.album,track.year].filter(Boolean).join(' · '),930),540,928);c.font='19px "Segoe UI", sans-serif';c.fillStyle=accent;c.fillText('SUA MÚSICA. SEU ESPAÇO.',540,1010);
 }
 if(typeof module==='object'&&module.exports){module.exports={fit,paint};return;}
 let current=null;const el=MusicUI.element,buttons=[];
 for(const parent of [document.querySelector('.immersive-bar>div'),document.getElementById('now-panel')]){const b=el('button','','Criar cartão');b.disabled=true;b.onclick=open;parent.append(b);buttons.push(b);}
 window.addEventListener('mattoz-track',e=>{current={...e.detail};buttons.forEach(b=>b.disabled=false);});
 function loadImage(url){return new Promise(resolve=>{if(!url){resolve(null);return;}const img=new Image();const timer=setTimeout(()=>{img.onload=img.onerror=null;resolve(null);},5000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);resolve(null);};img.src=url;});}
 async function open(){if(!current||document.querySelector('.share-card-dialog'))return;const track={...current},dialog=el('dialog','share-card-dialog'),canvas=el('canvas'),status=el('p','muted','Preparando imagem…'),actions=el('div','playlist-actions'),save=el('button','primary','Salvar PNG'),close=el('button','','Fechar');save.disabled=true;status.setAttribute('role','status');close.onclick=()=>dialog.close();actions.append(save,close);dialog.append(el('h2','','Sua música em um cartão'),canvas,status,actions);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();close.focus();
  save.onclick=async()=>{save.disabled=true;try{const saved=await window.mattoz.collectionAction('card:export',{png:canvas.toDataURL('image/png')});status.textContent=saved?'Imagem salva. Pronta para você compartilhar.':'Salvamento cancelado.';}catch(e){status.textContent=e.message;}finally{save.disabled=false;}};
  try{const image=await loadImage(track.artwork);if(!dialog.isConnected)return;const accent=document.documentElement.style.getPropertyValue('--accent').trim()||{violet:'#cba8ff',rose:'#ff9ebe',lime:'#d8f880'}[document.documentElement.dataset.accent]||'#d8f880';paint(canvas,track,image,accent);save.disabled=false;status.textContent=(track.artwork&&!image?'Capa indisponível; usando a marca MATTOZ. ':'')+'PNG de 1080 × 1080. Nenhuma publicação automática.';}catch(e){status.textContent=e.message;}
 }
})();
