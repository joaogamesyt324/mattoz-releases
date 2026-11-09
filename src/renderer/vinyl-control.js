'use strict';
(()=>{
 const delta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
 const position=(time,radians,duration)=>Math.max(0,Math.min(duration,time+radians*30/(2*Math.PI)));
 if(typeof module==='object'&&module.exports){module.exports={delta,position};return;}
 const disc=document.getElementById('playing-vinyl'),audio=(window.mattozAudio || document.getElementById('audio')),panel=document.getElementById('immersive');
 let drag=null,rotation=0,frame=0,lastSeek=0;
 disc.removeAttribute('aria-hidden');disc.tabIndex=0;disc.setAttribute('role','slider');disc.setAttribute('aria-label','Posição da música pelo vinil');disc.setAttribute('aria-valuemin','0');disc.title='Arraste para avançar ou retroceder · uma volta = 30 s · setas = 5 s';
 const valid=()=>Number.isFinite(audio.duration)&&audio.duration>0&&!audio.error;
 const describe=()=>{disc.setAttribute('aria-disabled',String(!valid()));disc.setAttribute('aria-valuemax',String(valid()?audio.duration:0));disc.setAttribute('aria-valuenow',String(audio.currentTime||0));disc.setAttribute('aria-valuetext',`${Math.floor((audio.currentTime||0)/60)} min ${Math.floor((audio.currentTime||0)%60)} s`);};
 const angle=e=>{const r=disc.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;return Math.hypot(x,y)<Math.min(r.width,r.height)*.12?null:Math.atan2(y,x);};
 function draw(now){frame=0;if(!drag)return;disc.style.transform=`rotate(${rotation}rad)`;if(now-lastSeek>=60){audio.currentTime=drag.target;lastSeek=now;}}
 function finish(resume=true){if(!drag)return;const state=drag;drag=null;if(frame)cancelAnimationFrame(frame);frame=0;disc.style.transform=`rotate(${rotation}rad)`;if(valid()&&resume)audio.currentTime=state.target;if(disc.hasPointerCapture?.(state.pointer))disc.releasePointerCapture(state.pointer);disc.classList.remove('is-dragging');if(resume&&state.playing&&!audio.error)audio.play().catch(()=>{document.getElementById('status').textContent='Pressione reproduzir para continuar.';});describe();}
 disc.addEventListener('pointerdown',e=>{if(drag||!valid()||e.button!==0)return;const a=angle(e);if(a===null)return;e.preventDefault();disc.focus();drag={pointer:e.pointerId,last:a,target:audio.currentTime,playing:!audio.paused};audio.pause();disc.classList.add('is-dragging');disc.setPointerCapture(e.pointerId);lastSeek=0;});
 disc.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();const a=angle(e);if(a===null){drag.last=null;return;}if(drag.last!==null){const step=delta(drag.last,a);rotation+=step;drag.target=position(drag.target,step,audio.duration);}drag.last=a;if(!frame)frame=requestAnimationFrame(draw);});
 disc.addEventListener('pointerup',e=>{if(drag?.pointer===e.pointerId)finish();});
 for(const event of ['pointercancel','lostpointercapture'])disc.addEventListener(event,e=>{if(drag?.pointer===e.pointerId)finish();});
 disc.addEventListener('keydown',e=>{if(!valid()||drag)return;const shifts={ArrowRight:5,ArrowUp:5,ArrowLeft:-5,ArrowDown:-5};if(e.key in shifts){e.preventDefault();audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+shifts[e.key]));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();audio.currentTime=e.key==='Home'?0:audio.duration;}});
 window.addEventListener('mattoz-track',()=>{finish(false);rotation=0;disc.style.transform='';describe();});
 audio.addEventListener('error',()=>finish(false));
 audio.addEventListener('play',()=>{if(drag)finish(false);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 new MutationObserver(()=>{if(panel.hidden||panel.dataset.layout!=='vinyl'&&panel.dataset.layout)finish();}).observe(panel,{attributes:true,attributeFilter:['hidden','data-layout']});
 for(const event of ['timeupdate','seeked','loadedmetadata','emptied'])audio.addEventListener(event,describe);
 describe();
})();
