const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');const LRC=require('../src/renderer/lrc.js');
test('animation follows audio timestamps, interpolates scroll and never writes audio time',async()=>{
 class Element extends EventTarget{constructor(){super();this.children=[];this.hidden=false;this.value='0';this.checked=true;this.clientHeight=200;this.scrollHeight=1000;this.scrollTop=0;this.clientHeight=40;this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};this.style={setProperty:()=>{}};}setAttribute(){}removeAttribute(){}replaceChildren(){this.children=[];}append(el){if(el.fragment)this.children.push(...el.children);else{el.offsetTop=300+this.children.length*100;this.children.push(el);}}}
 const ids=new Map();const get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};let time=0,writes=0;const audio=get('audio');Object.defineProperty(audio,'currentTime',{get:()=>time,set:()=>writes++});audio.duration=20;get('lyric-lines').clientHeight=200;
 const doc=new EventTarget();doc.getElementById=get;doc.createElement=()=>new Element();doc.createDocumentFragment=()=>Object.assign(new Element(),{fragment:true});doc.hidden=false;
 const win=new EventTarget();win.mattoz={getLyrics:async()=>({status:'ok',text:'[00:01]A\n[00:03]B'})};let nextFrame;let observe;let cancellations=0;
 const context={document:doc,window:win,LRC,matchMedia:()=>({matches:false}),cancelAnimationFrame:()=>{nextFrame=null;cancellations++;},requestAnimationFrame:callback=>{assert.ok(!nextFrame,'only one animation frame may be pending');nextFrame=now=>{nextFrame=null;callback(now);};return 1;},MutationObserver:class{constructor(fn){observe=fn;}observe(){}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/lyrics.js'),'utf8'),context);
 const e=new Event('mattoz-track');e.detail={id:'a',title:'Test'};win.dispatchEvent(e);await new Promise(resolve=>setImmediate(resolve));observe();time=1.01;nextFrame(0);nextFrame(16);const box=get('lyric-lines');assert.ok(box.children[0].classes.has('current-verse'));assert.ok(box.scrollTop>0&&box.scrollTop<220);time=3;nextFrame(32);assert.ok(box.children[1].classes.has('current-verse'));time=1.5;nextFrame(48);assert.ok(box.children[0].classes.has('current-verse'));assert.equal(writes,0);
 // Pause cancels the only pending frame and freezes scroll, resume has no elapsed-time jump.
 const transition={playState:'running',pause(){this.playState='paused';},play(){this.playState='running';}};box.getAnimations=()=>[transition];
 audio.paused=true;audio.dispatchEvent(new Event('pause'));const pausedAt=box.scrollTop;
 assert.equal(nextFrame,null);assert.ok(cancellations>0);assert.equal(transition.playState,'paused');
 time=1.7;audio.dispatchEvent(new Event('timeupdate'));assert.equal(box.scrollTop,pausedAt);
 audio.paused=false;audio.dispatchEvent(new Event('playing'));assert.equal(transition.playState,'running');nextFrame(10000);
 assert.equal(box.scrollTop,pausedAt);nextFrame(10016);assert.notEqual(box.scrollTop,pausedAt);
 // Buffering and hidden readers stop consuming frames; a new LRC clears the old target.
 audio.dispatchEvent(new Event('waiting'));assert.equal(nextFrame,null);
 audio.dispatchEvent(new Event('playing'));get('lyrics').hidden=true;observe();assert.equal(nextFrame,null);
 get('lyrics').hidden=false;observe();nextFrame(11000);nextFrame(11016);
 get('follow-lyrics').checked=false;get('follow-lyrics').onchange();const manual=box.scrollTop;
 nextFrame(11032);assert.equal(box.scrollTop,manual);
 get('follow-lyrics').checked=true;get('follow-lyrics').onchange();
 time=0;audio.dispatchEvent(new Event('seeking'));for(let n=0;n<180;n++)nextFrame(12000+n*16);
 assert.equal(box.scrollTop,0);assert.equal(writes,0);
 // Integer scroll positions must not strand the spring short of its target.
 let rounded=0;Object.defineProperty(box,'scrollTop',{get:()=>rounded,set:value=>{rounded=Math.round(value);}});
 time=3;audio.dispatchEvent(new Event('seeking'));
 for(let n=0;n<180;n++)nextFrame(16000+n*16);
 assert.equal(box.scrollTop,box.children[1].offsetTop-100+20);
 // Reduced motion honors the same target without interpolation.
 doc.documentElement={dataset:{motion:'reduced'}};time=1;audio.dispatchEvent(new Event('seeking'));nextFrame(20000);
 assert.equal(box.scrollTop,box.children[0].offsetTop-100+20);
});
