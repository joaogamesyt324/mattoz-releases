const {test}=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),fs=require('node:fs');
test('playlist searches accents, artist and album; bulk selection follows filtered results',async()=>{
 const dom=new JSDOM('<h1 id="saved-title"></h1><div id="playlist-create"></div><input id="playlist-name"><button id="create-playlist"></button><p id="saved-message"></p><div id="saved-results"></div>',{runScripts:'outside-only'}),w=dom.window,calls=[];
 const tracks=[{id:'a',title:'Canção',artist:'José',album:'Azul'},{id:'b',title:'Outro som',artist:'Banda',album:'Noite'}];
 w.mattoz={savedAction:async(action,data)=>{calls.push({action,data});return {playlists:[{id:'p',name:'Teste',tracks:['a','b']}],recent:[]};},libraryAction:async()=>({tracks})};
 try{for(const file of ['music-ui.js','saved-ui.js'])w.eval(fs.readFileSync('src/renderer/'+file,'utf8'));w.dispatchEvent(new w.CustomEvent('mattoz-open-playlist',{detail:'p'}));await new Promise(r=>setTimeout(r,0));
 const input=w.document.querySelector('.playlist-search');input.value='jose';input.dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.playlist-song').length,1);
 const button=text=>[...w.document.querySelectorAll('button')].find(b=>b.textContent===text);button('Selecionar resultados').click();await new Promise(r=>setTimeout(r,0));assert.equal(w.document.querySelector('.playlist-song input').checked,true);button('Remover selecionadas').click();await new Promise(r=>setTimeout(r,0));assert.deepEqual(JSON.parse(JSON.stringify(calls.find(c=>c.action==='tracks').data.tracks)),['b']);
 }finally{w.close();}
});
