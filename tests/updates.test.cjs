const test=require('node:test'),assert=require('node:assert/strict');
const {checkRelease}=require('../src/main/updates.cjs');
const host='https://updates.example.invalid/releases/release.json';
const checksum='a'.repeat(64);
function feed(file='MATTOZ-Portable-0.9.0-x64.exe'){
 return new Response(JSON.stringify({product:'mattoz-music-player',version:'0.9.0',windows:{portable:{file,sha256:checksum}}}));
}
test('unpublished launcher stays local and release check chooses correct portable upgrade', async()=>{
 assert.deepEqual(await checkRelease(null,'0.9.0-preview.15','portable',()=>assert.fail()),{status:'unconfigured'});
 const change=await checkRelease(host,'0.9.0-preview.15','portable',async()=>feed());
 assert.equal(change.status,'available');assert.equal(change.url,new URL('MATTOZ-Portable-0.9.0-x64.exe',host).href);
 assert.deepEqual(await checkRelease(host,'0.9.0','portable',async()=>feed()),{status:'current'});
});
test('release feed refuses redirected download locations and oversized manifests',async()=>{
 await assert.rejects(checkRelease(host,'0.8.1','portable',async()=>feed('https://other.invalid/app.exe')),/inválido/);
 await assert.rejects(checkRelease(host,'0.8.1','portable',async()=>new Response('x'.repeat(32769))),/inválida/);
});
const {checkGitHubRelease,registerUpdates}=require('../src/main/updates.cjs');
const config={owner:'joaogamesyt324',repository:'mattoz-releases'};
function github(version,options={}){return {tag_name:'v'+version,prerelease:version.includes('-'),draft:false,assets:['Portable','Setup'].map(kind=>({name:`MATTOZ-${kind}-${version}-x64.exe`,state:'uploaded',size:123,digest:'sha256:'+checksum,browser_download_url:`https://github.com/joaogamesyt324/mattoz-releases/releases/download/v${version}/MATTOZ-${kind}-${version}-x64.exe`})),...options};}
const respond=data=>async()=>new Response(JSON.stringify(data));
test('GitHub preview channel compares semver and selects each edition without downgrades',async()=>{
 const data=[github('0.9.0-preview.9'),github('0.9.0-preview.16'),github('9.0.0',{draft:true})];
 for(const variant of ['portable','setup']){
 const r=await checkGitHubRelease(config,'0.9.0-preview.15',variant,respond(data));assert.equal(r.version,'0.9.0-preview.16');assert.equal(r.status,'available');assert.ok(r.url.includes(variant==='portable'?'Portable':'Setup'));assert.equal(r.sha256,checksum);
 }
 assert.equal((await checkGitHubRelease(config,'0.9.0-preview.16','setup',respond(data))).status,'current');
 assert.equal((await checkGitHubRelease(config,'0.9.0-preview.17','setup',respond(data))).status,'ahead');
});
test('stable installs exclude previews and preview installs can upgrade to stable',async()=>{
 assert.equal((await checkGitHubRelease(config,'0.8.0','setup',respond([github('0.9.0-preview.16')]))).status,'empty');
 assert.equal((await checkGitHubRelease(config,'0.9.0-preview.16','setup',respond([github('0.9.0')]))).status,'available');
});
test('GitHub validates source, assets, digests, payload and rate limits',async()=>{
 for(const patch of [{browser_download_url:'https://evil.invalid/file.exe'},{digest:null},{state:'new'},{size:0},{name:'wrong.exe'}]){
 const r=github('0.9.0');Object.assign(r.assets[0],patch);
 await assert.rejects(checkGitHubRelease(config,'0.8.0','portable',respond([r])),/pacote válido/);
 }
 await assert.rejects(checkGitHubRelease(config,'0.8.0','setup',async()=>new Response('',{status:429})),/Limite/);
 await assert.rejects(checkGitHubRelease(config,'0.8.0','setup',respond({})),/inválida/);
 await assert.rejects(checkGitHubRelease(config,'0.8.0','setup',async()=>new Response('x'.repeat(2097153))),/grande/);
});
test('GitHub paginates releases and uses credential-free bounded requests',async()=>{
 let calls=0;
 const r=await checkGitHubRelease(config,'0.8.0','setup',async(url,options)=>{
 calls++;assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.ok(url.endsWith('page='+calls));
 return new Response(JSON.stringify(calls===1?Array.from({length:100},()=>github('0.7.0')):[github('0.9.0')]));
 });assert.equal(calls,2);assert.equal(r.status,'available');
});
test('IPC rejects stale concurrent checks and never opens a stale download',async()=>{
 const handlers={};let resolveFirst;let calls=0;const opened=[];
 registerUpdates({app:{getVersion:()=> '0.8.0'},ipcMain:{handle:(name,fn)=>handlers[name]=fn},net:{fetch:()=>++calls===1?new Promise(r=>resolveFirst=r):Promise.resolve(new Response(JSON.stringify([github('0.8.0')])))},shell:{openExternal:url=>opened.push(url)},getWindow:()=>null,assertTrustedSender:()=>{}});
 const first=handlers['updates:check']({});await handlers['updates:check']({});resolveFirst(new Response(JSON.stringify([github('0.9.0')])));
 await assert.rejects(first,/recente/);await assert.rejects(handlers['updates:download']({}),/Consulte/);assert.deepEqual(opened,[]);
});
