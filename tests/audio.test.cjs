const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { MediaRegistry, parseRange } = require('../src/main/media.cjs');
const { PlaybackQueue } = require('../src/renderer/queue.js');
const tracks = [0,1,2].map(i => ({id:String(i),title:`Faixa ${i}`}));

test('queue preserves selection on append and removes duplicates', () => {
 const q = new PlaybackQueue(); q.add(tracks); q.select(1); q.add(tracks);
 assert.equal(q.tracks.length,3); assert.equal(q.current.id,'1');
 assert.equal(q.select(999),false); assert.equal(q.current.id,'1');
});
test('sequential end, repeat one, manual next, repeat all and previous', () => {
 const q = new PlaybackQueue(); assert.equal(q.next(),false); q.add(tracks); q.next();
 q.repeat='one'; q.next(true); assert.equal(q.index,0);
 q.next(false); assert.equal(q.index,1); q.next(); assert.equal(q.index,2);
 q.repeat='off'; assert.equal(q.next(true),false);
 q.repeat='all'; q.next(true); assert.equal(q.index,0); q.previous(); assert.equal(q.index,2);
});
test('shuffle visits each track once and previous follows real history', () => {
 const q = new PlaybackQueue(()=>0); q.add(tracks); q.select(0); q.toggleShuffle();
 q.next(); const second=q.index; q.next(); assert.notEqual(q.index,second);
 assert.equal(q.next(),false); q.previous(); assert.equal(q.index,second);
 q.repeat='all'; assert.equal(q.next(),true); assert.equal(q.next(),true);
});
test('single item shuffle ends or repeats according to mode', () => {
 const q=new PlaybackQueue();q.add([tracks[0]]);q.select(0);q.toggleShuffle();
 assert.equal(q.next(true),false);q.repeat='all';assert.equal(q.next(true),true);
});
test('range parser supports closed/open/suffix and rejects malformed ranges',()=>{
 assert.deepEqual(parseRange('bytes=2-5',10),{start:2,end:5});
 assert.deepEqual(parseRange('bytes=7-',10),{start:7,end:9});
 assert.deepEqual(parseRange('bytes=-3',10),{start:7,end:9});
 for(const s of ['bytes=10-','bytes=4-2','bytes=0-1,4-5','bytes=-0','wat','bytes=-']) assert.throws(()=>parseRange(s,10));
});
test('media service streams authorized Unicode files, seeks, and rejects missing or unknown files',async()=>{
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'mattoz-'));
 try {
  const file=path.join(folder,'Canção # verão.MP3'); const data=Buffer.from('0123456789'); await fs.writeFile(file,data);
  const registry=new MediaRegistry(); const added=await registry.add([file,path.join(folder,'missing.mp3'),path.join(folder,'no.txt')]);
  assert.equal(added.tracks.length,1); assert.equal(added.skipped,2);
  assert.equal((await registry.add([file])).tracks[0].id,added.tracks[0].id);
  const url=added.tracks[0].url;
  let response=await registry.respond(new Request(url));assert.equal(response.status,200);assert.equal(await response.text(),'0123456789');
  response=await registry.respond(new Request(url,{headers:{range:'bytes=3-6'}}));assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 3-6/10');assert.equal(await response.text(),'3456');
  response=await registry.respond(new Request(url,{method:'HEAD'}));assert.equal(response.headers.get('content-length'),'10');assert.equal(await response.text(),'');
  assert.equal((await registry.respond(new Request(url,{headers:{range:'bytes=15-'}}))).status,416);
  assert.equal((await registry.respond(new Request('mattoz-media://audio/unknown'))).status,404);
  assert.equal((await registry.respond(new Request(url,{method:'POST'}))).status,404);
  await fs.unlink(file);assert.equal((await registry.respond(new Request(url))).status,404);
 }finally{await fs.rm(folder,{recursive:true,force:true});}
});
