'use strict';
window.MusicUI={
 element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;},
 cover(tracks){const el=document.createElement('div');el.className='mix-cover';const arts=[...new Set(tracks.map(t=>t?.artwork).filter(Boolean))].slice(0,4);if(!arts.length){el.textContent='♫';return el;}if(arts.length<4)arts.splice(1);if(arts.length===4)el.classList.add('collage');for(const url of arts){const img=new Image();img.src=url;img.alt='';img.loading='lazy';el.append(img);}return el;},
 duration(seconds){seconds=Math.floor(seconds||0);return seconds>=3600?`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min`:`${Math.floor(seconds/60)} min`;},
 play(tracks,id){tracks=tracks.filter(t=>t&&!t.missing);if(tracks.length)window.dispatchEvent(new CustomEvent('mattoz-play-library',{detail:{tracks,id:id||tracks[0].id,replace:true}}));},
 openPlaylist(id){document.querySelector('.sidebar [data-page="playlists"]').click();window.dispatchEvent(new CustomEvent('mattoz-open-playlist',{detail:id}));}
};

window.askText=(label,value='')=>new Promise(resolve=>{const dialog=document.createElement('dialog'),form=document.createElement('form'),title=document.createElement('label'),input=document.createElement('input'),ok=document.createElement('button'),cancel=document.createElement('button');form.method='dialog';title.textContent=label;input.value=value;input.maxLength=100;title.append(input);ok.textContent='Salvar';ok.value='ok';cancel.textContent='Cancelar';cancel.value='cancel';form.append(title,ok,cancel);dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>{resolve(dialog.returnValue==='ok'?input.value:null);dialog.remove();},{once:true});dialog.showModal();input.focus();});
