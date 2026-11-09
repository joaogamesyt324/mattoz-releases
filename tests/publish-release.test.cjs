'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {publish}=require('../scripts/publish-release.cjs');
const version='0.9.0-preview.18';
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mattoz-publish-'));fs.mkdirSync(path.join(root,'dist'));
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version}));fs.writeFileSync(path.join(root,'package-lock.json'),JSON.stringify({version,packages:{'':{version}}}));
 fs.writeFileSync(path.join(root,'RELEASE-NOTES.md'),version+' Teste');const windows={};
 for(const [kind,label]of [['portable','Portable'],['setup','Setup']]){const file=`MATTOZ-${label}-${version}-x64.exe`;fs.writeFileSync(path.join(root,'dist',file),'test fixture');windows[kind]={file,sha256:crypto.createHash('sha256').update('test fixture').digest('hex')};}
 fs.writeFileSync(path.join(root,'dist/release.json'),JSON.stringify({product:'mattoz-music-player',version,windows}));
 return {root,env:{GITHUB_REPOSITORY:'joaogamesyt324/mattoz-releases',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_SHA:'a'.repeat(40),GH_TOKEN:'test'},cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
test('published versions are never replaced',async()=>{const f=fixture();try{const r=await publish({...f,fetcher:async()=>response({draft:false}),run:()=>assert.fail('Must not publish')});assert.equal(r.status,'existing');}finally{f.cleanup();}});
test('publishing refuses forks, PRs, mismatched lockfiles and orphaned tags',async()=>{const f=fixture();try{
 for(const env of [{...f.env,GITHUB_REPOSITORY:'other/repo'},{...f.env,GITHUB_EVENT_NAME:'pull_request'}])await assert.rejects(publish({...f,env}),/somente/);
 await assert.rejects(publish({...f,fetcher:async url=>url.includes('/git/')?response({ref:'tag'}):response({},404)}),/Tag já existente/);
 fs.writeFileSync(path.join(f.root,'package-lock.json'),'{}');await assert.rejects(publish(f),/divergentes/);
}finally{f.cleanup();}});
test('a preview publishes only after every draft asset is uploaded',async()=>{const f=fixture(),calls=[];let gets=0;try{
 const r=await publish({...f,fetcher:async()=>{if(++gets<=2)return response({},404);return response({draft:true,assets:fs.readdirSync(path.join(f.root,'dist')).map(name=>({name,state:'uploaded',size:fs.statSync(path.join(f.root,'dist',name)).size}))});},run:async args=>calls.push(args)});
 assert.equal(r.status,'published');assert.equal(calls.length,2);assert.ok(calls[0].includes('--draft'));assert.ok(calls[0].includes('--prerelease'));assert.ok(calls[1].includes('--draft=false'));
}finally{f.cleanup();}});
test('upload failures or missing assets never publish the draft',async()=>{for(const fail of [true,false]){const f=fixture();let calls=0,gets=0;try{
 await assert.rejects(publish({...f,fetcher:async()=>++gets<=2?response({},404):response({draft:true,assets:[]}),run:async()=>{calls++;if(fail)throw Error('upload failed');}}));assert.equal(calls,1);
}finally{f.cleanup();}}});
test('corrupted build files stop before uploading',async()=>{const f=fixture();try{fs.writeFileSync(path.join(f.root,'dist',`MATTOZ-Portable-${version}-x64.exe`),'corrupt');await assert.rejects(publish({...f,fetcher:async()=>response({},404),run:()=>assert.fail()}),/SHA-256/);}finally{f.cleanup();}});
