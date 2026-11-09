'use strict';
(()=>{
 class TrackFade{
  constructor(audio){this.audio=audio;this.seconds=0;this.base=null;this.phase=null;}
  cancel(){if(this.base!==null)this.audio.volume=this.base;this.base=null;this.phase=null;}
  configure(seconds){if(!Number.isInteger(seconds)||seconds<0||seconds>5)throw Error('Transição inválida');this.cancel();this.seconds=seconds;}
  tick(allowed=true){const a=this.audio;if(!allowed||!this.seconds){this.cancel();return;}if(Number.isFinite(a.duration)&&a.duration<=this.seconds*2){this.cancel();return;}if(a.paused||!Number.isFinite(a.duration))return;if(this.phase==='in'){const gain=Math.min(1,a.currentTime/this.seconds);a.volume=this.base*gain;if(gain>=1)this.cancel();return;}const left=a.duration-a.currentTime;if(left>this.seconds){if(this.phase==='out')this.cancel();return;}if(left>=0){if(this.base===null)this.base=a.volume;this.phase='out';a.volume=this.base*Math.max(0,left/this.seconds);}}
  beginNext(){const fading=this.phase==='out';this.cancel();if(fading&&this.seconds){this.base=this.audio.volume;this.phase='in';this.audio.volume=0;}}
 }
 if(typeof module==='object'&&module.exports){module.exports={TrackFade};return;}
 const el=MusicUI.element,section=el('section','settings-card'),select=el('select'),status=el('p','muted');
 const options=window.mattozTransitions={seconds:0,preload:true};
 const label=el('label','','Crossfade ');for(let i=0;i<=5;i++){const option=el('option','',i?i+' segundo(s)':'Desativado');option.value=i;select.append(option);}label.append(select);
 const preload=el('input');preload.type='checkbox';preload.checked=true;
 const prelabel=el('label','','Preparar a próxima música antecipadamente ');prelabel.append(preload);
 section.append(el('h2','','Transição entre músicas'),label,prelabel,el('p','muted','O crossfade mistura o fim de uma música com o início da próxima. As letras acompanham a faixa que entra.'),status);
 document.getElementById('settings').append(section);
 let revision=0,pending=Promise.resolve();
 function save(){
   revision++;options.seconds=Number(select.value);options.preload=preload.checked;select.disabled=!options.preload;
   if(!options.seconds||!options.preload)window.mattozAudio?.cancelTransition();
   const patch={crossfade:options.seconds,preloadNext:options.preload};
   pending=pending.catch(()=>{}).then(()=>window.mattoz.savedAction('preferences',patch)).then(()=>{status.textContent='Transição salva.';}).catch(e=>{status.textContent=e.message;});
 }
 select.onchange=save;preload.onchange=save;
 window.mattoz.savedAction('list').then(s=>{if(revision)return;options.seconds=s.preferences.crossfade||0;options.preload=s.preferences.preloadNext!==false;select.value=options.seconds;preload.checked=options.preload;select.disabled=!options.preload;}).catch(()=>{});
})();
