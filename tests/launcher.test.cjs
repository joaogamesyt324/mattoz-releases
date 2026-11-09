const {test}=require('node:test'),a=require('node:assert/strict'),{JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');
test('optional welcome screen opens once and enters the library without starting audio',async()=>{const dom=new JSDOM('<section id="settings"></section><audio id="audio"></audio>',{runScripts:'outside-only'}),w=dom.window;let page=null;w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};w.navigate=value=>page=value;w.mattoz={savedAction:async()=>({preferences:{showLauncher:true}}),getAppInfo:async()=>({version:'0.8.1'})};try{for(const name of ['music-ui.js','launcher.js'])w.eval(fs.readFileSync(path.join(__dirname,'../src/renderer',name),'utf8'));await new Promise(r=>setTimeout(r,0));a.equal(w.document.querySelectorAll('dialog[open]').length,1);[...w.document.querySelectorAll('dialog button')].find(b=>b.textContent==='Abrir biblioteca').click();a.equal(page,'library');a.equal(w.document.querySelector('dialog'),null);a.equal(w.document.getElementById('audio').paused,true);}finally{w.close();}});
test('launcher handles checking, ahead, empty, errors and manual download',async()=>{
 for(const result of [{status:'ahead',version:'0.9.0-preview.16'},{status:'empty'},{status:'current'},{status:'available',version:'0.9.0',sha256:'a'.repeat(64)},new Error('Limite temporário')]){
  const dom=new JSDOM('<section id="settings"></section>',{runScripts:'outside-only'}),w=dom.window;let downloads=0;
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.mattoz={savedAction:async()=>({preferences:{showLauncher:true}}),getAppInfo:async()=>({version:'0.9.0-preview.17'}),checkRelease:async()=>{if(result instanceof Error)throw result;return result;},downloadRelease:async()=>downloads++};
  try{
   for(const name of ['music-ui.js','launcher.js'])w.eval(fs.readFileSync(path.join(__dirname,'../src/renderer',name),'utf8'));
   await new Promise(r=>setTimeout(r,0));const button=[...w.document.querySelectorAll('button')].find(b=>b.textContent==='Consultar atualização');
   button.click();a.equal(button.disabled,true);await new Promise(r=>setTimeout(r,0));a.equal(button.disabled,false);
   const status=w.document.querySelector('[role=status]').textContent;
   if(result.status==='available'){a.match(status,/SHA-256/);button.click();await new Promise(r=>setTimeout(r,0));a.equal(downloads,1);}
   else{a.equal(downloads,0);a.match(status,result instanceof Error?/Limite/:result.status==='ahead'?/mais recente que/:result.status==='empty'?/Ainda não/:/mais recente/);}
  }finally{w.close();}
 }
});
