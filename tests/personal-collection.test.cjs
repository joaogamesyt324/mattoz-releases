'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {personalCollection,capsule}=require('../src/main/personal-collection.cjs');
function setup(){
 const values=new Map(),store={get:(k,d)=>values.has(k)?structuredClone(values.get(k)):d,set:(k,v)=>values.set(k,structuredClone(v))};
 const track={id:'a',title:'Canção',artist:'Artista',duration:120,url:'mattoz-media://audio/a'};
 const library={tracks:new Map([['a',track]])};
 const action=personalCollection({store,library,media:{lyrics:async()=>({status:'ok',text:'[offset:1000]\n[00:04.00]Coração na estrada\n[00:05.00]Outra linha'})}});
 return {action,store,library};
}
test('lyric search ignores accents and applies LRC offset to seek positions',async()=>{
 const {action}=setup(),result=await action('personal:search',{query:'coracao'});
 assert.equal(result.rows[0].position,3);assert.equal(result.rows[0].track.id,'a');
 assert.equal((await action('personal:search',{query:'['})).rows.length,0);
});
test('moments validate times, retain missing-track labels and remove by unique id',async()=>{
 const {action,library}=setup();
 await assert.rejects(action('personal:moment-add',{trackId:'a',label:'solo',position:Infinity}));
 await assert.rejects(action('personal:moment-add',{trackId:'a',label:'solo',position:130}));
 const item=await action('personal:moment-add',{trackId:'a',label:'solo',position:35});
 assert.equal((await action('personal:moments',{}))[0].position,35);
 library.tracks.clear();assert.equal((await action('personal:moments',{}))[0].track,null);
 await action('personal:moment-remove',{id:item.id});assert.deepEqual(await action('personal:moments',{}),[]);
});
test('monthly capsule separates months and updates the same generated playlist',async()=>{
 const {action,store,library}=setup();store.set('listening',{months:{'2026-10':{a:60},'2026-11':{a:120,gone:30}}});
 const data=await action('personal:capsule',{month:'2026-11'});assert.equal(data.seconds,150);assert.equal(data.removed,1);assert.equal(data.artists[0][1],120);
 const one=await action('personal:capsule-playlist',{month:'2026-11'}),two=await action('personal:capsule-playlist',{month:'2026-11'});
 assert.equal(one.id,two.id);assert.equal(store.get('playlists').length,1);
 assert.equal(capsule(store.get('listening'),library.tracks,'2026-09').seconds,0);
 assert.throws(()=>capsule({},library.tracks,'2026-99'));
});
test('cancelling a search prevents returning results after the pending LRC read',async()=>{
 let release;const action=personalCollection({store:{},library:{tracks:new Map([['a',{id:'a'}]])},media:{lyrics:()=>new Promise(resolve=>{release=resolve;})}});
 const pending=action('personal:search',{query:'verso'});await action('personal:search-cancel',{});release({status:'ok',text:'[00:01]verso'});assert.equal((await pending).cancelled,true);
});
