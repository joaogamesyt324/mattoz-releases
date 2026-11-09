const {test}=require('node:test'),a=require('node:assert/strict');
const {albumKey,validateAsset,albumAction}=require('../src/main/album-booklet.cjs');
const {ordered,sides}=require('../src/renderer/album-ui.js');
test('album grouping distinguishes artists and album order and virtual sides reset per disc',()=>{
 a.notEqual(albumKey({artist:'A',album:'X'}),albumKey({artist:'B',album:'X'}));
 a.equal(albumKey({artist:'Guest',albumArtist:'A',album:'X'}),albumKey({artist:'A',album:'X'}));
 const tracks=[{id:'c',disc:2,track:1,title:'C',duration:50},{id:'b',disc:1,track:2,title:'B',duration:50},{id:'a',disc:1,track:1,title:'A',duration:50}];
 a.deepEqual(ordered(tracks).map(t=>t.id),['a','b','c']);a.equal(sides(tracks).get('a'),'Disco 1 · Lado A');a.equal(sides(tracks).get('b'),'Disco 1 · Lado B');a.equal(sides(tracks).get('c'),'Disco 2 · Lado A');a.equal(tracks[0].id,'c');
});
test('booklet validates type and size before persistence',()=>{a.throws(()=>validateAsset(Buffer.from('<script>'),'photo'));a.throws(()=>validateAsset(Buffer.alloc(13*1024*1024),'pdf'));a.equal(validateAsset(Buffer.from('%PDF-1.7'),'pdf'),'application/pdf');});
test('booklet copies attachments, exports PDF, shares album data and persists after reopening SQLite',async()=>{
 const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{Store}=require('../src/main/store.cjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mattoz-booklet-'));let store=new Store(path.join(dir,'db'));const file=path.join(dir,'encarte.pdf'),destination=path.join(dir,'export.pdf');await fs.writeFile(file,'%PDF-1.7\nbooklet');
 const library={tracks:new Map([['a',{artist:'A',album:'X'}],['b',{artist:'A',album:'X'}]])};let canceled=false;
 const options={library,dialog:{showOpenDialog:async()=>({canceled,filePaths:[file]}),showSaveDialog:async()=>({canceled,filePath:destination})},getWindow:()=>null};
 const call=(action,data={})=>albumAction(action,{id:'a',...data},{...options,store});
 try{await call('album:credits',{text:'Produção independente'});const result=await call('album:attach',{kind:'pdf'});a.deepEqual(result.pdf,{name:'encarte.pdf'});await fs.unlink(file);a.equal(await call('album:export-pdf'),true);a.equal(await fs.readFile(destination,'utf8'),'%PDF-1.7\nbooklet');store.close();store=new Store(path.join(dir,'db'));a.equal((await call('album:get',{id:'b'})).credits,'Produção independente');canceled=true;a.equal(await call('album:export-pdf'),false);await a.rejects(call('album:get',{id:'unknown'}));await a.rejects(call('album:credits',{text:'x'.repeat(20001)}));await call('album:remove',{kind:'pdf'});a.equal((await call('album:get')).pdf,null);}finally{store.close();await fs.rm(dir,{recursive:true,force:true});}
});
test('album view requests sequential playback and highlights active track without seeking audio',async()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path');const dom=new JSDOM('<div id="out"></div>',{runScripts:'outside-only'}),w=dom.window;let request;
 w.mattoz={collectionAction:async()=>({credits:'Créditos',photos:[],pdf:null,back:null})};
 try{for(const file of ['music-ui.js','album-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'../src/renderer',file),'utf8'));w.addEventListener('mattoz-play-library',e=>request=e.detail);w.MattozAlbum.render(w.document.getElementById('out'),[{id:'b',title:'B',track:2,duration:20},{id:'a',title:'A',track:1,duration:20}]);await new Promise(r=>setTimeout(r,0));w.document.querySelector('.album-experience>.primary').click();a.equal(request.albumMode,true);a.equal(request.replace,true);a.equal(request.tracks[0].id,'a');w.dispatchEvent(new w.CustomEvent('mattoz-track',{detail:{id:'b'}}));a.equal(w.document.querySelector('.album-track[aria-current]').dataset.track,'b');a.equal(w.document.querySelector('.album-credits').value,'Créditos');}finally{w.close();}
});
