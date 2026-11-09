'use strict';
const semver=require('semver');
const feed=require('./release-feed.json');

async function checkRelease(endpoint,current,variant,fetcher) {
  if(!endpoint)return {status:'unconfigured'};
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Endereço oficial inválido.');
  const response=await fetcher(url.href,{redirect:'error',credentials:'omit',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Falha ao consultar a versão publicada.');
  const reader=response.body.getReader();
  const chunks=[];let length=0;
  try{
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      length+=value.byteLength;
      if(length>32*1024){await reader.cancel();throw Error('Resposta de atualização inválida.');}
      chunks.push(Buffer.from(value));
    }
  }finally{reader.releaseLock();}
  const release=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(release.product!=='mattoz-music-player'||!semver.valid(release.version)||!semver.valid(current))throw Error('Versão publicada inválida.');
  if(!semver.gt(release.version,current))return {status:'current'};
  const item=release.windows?.[variant];
  if(!item||!/^MATTOZ-[A-Za-z0-9.-]+-x64\.exe$/.test(item.file)||!/^([0-9a-f]{64})$/i.test(item.sha256))throw Error('Pacote publicado inválido.');
  return {status:'available',version:release.version,url:new URL(item.file,url).href,sha256:item.sha256};
}
// Public releases only. No account or token is required.
async function checkGitHubRelease(config,current,variant,fetcher) {
  if(!semver.valid(current)||!['portable','setup'].includes(variant))throw Error('Versão instalada inválida.');
  if(!/^[A-Za-z0-9-]+$/.test(config.owner)||! /^[A-Za-z0-9._-]+$/.test(config.repository))throw Error('Canal oficial inválido.');
  const base=`https://api.github.com/repos/${config.owner}/${config.repository}/releases`;
  const previews=Boolean(semver.prerelease(current));
  const candidates=[];
  for(let page=1;page<=3;page++) {
    const response=await fetcher(`${base}?per_page=100&page=${page}`,{
      headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
      redirect:'error',credentials:'omit',signal:AbortSignal.timeout(10000)
    });
    if(response.status===403||response.status===429)throw Error('Limite temporário de consultas. Tente novamente mais tarde.');
    if(!response.ok)throw Error('Não foi possível consultar o canal oficial. Verifique sua conexão e tente novamente.');
    const reader=response.body.getReader();let length=0;const chunks=[];
    try {for(;;){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;
      if(length>2*1024*1024){await reader.cancel();throw Error('Resposta de atualização muito grande.');}chunks.push(Buffer.from(value));
    }}finally{reader.releaseLock();}
    const releases=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!Array.isArray(releases))throw Error('Resposta do canal inválida.');
    for(const release of releases){
      if(!release||release.draft||typeof release.tag_name!=='string')continue;
      const version=semver.valid(release.tag_name.replace(/^v/,''));
      if(!version||(!previews&&(release.prerelease||semver.prerelease(version))))continue;
      candidates.push({release,version});
    }
    if(releases.length<100)break;
  }
  candidates.sort((a,b)=>semver.rcompare(a.version,b.version));
  if(!candidates.length)return {status:'empty'};
  const {release,version}=candidates[0];
  if(semver.eq(version,current))return {status:'current',version};
  if(semver.lt(version,current))return {status:'ahead',version};
  const file=`MATTOZ-${variant==='portable'?'Portable':'Setup'}-${version}-x64.exe`;
  const expected=`https://github.com/${config.owner}/${config.repository}/releases/download/${encodeURIComponent(release.tag_name)}/${file}`;
  const asset=release.assets?.find(a=>a.name===file);
  if(!asset||asset.state!=='uploaded'||!Number.isSafeInteger(asset.size)||asset.size<=0||asset.size>2*1024**3||asset.browser_download_url!==expected||!/^sha256:[a-f0-9]{64}$/i.test(asset.digest||''))throw Error('A nova versão ainda não tem um pacote válido para esta edição do MATTOZ. Tente novamente mais tarde.');
  return {status:'available',version,url:expected,size:asset.size,sha256:asset.digest.slice(7).toLowerCase()};
}
function registerUpdates({app,ipcMain,net,shell,getWindow,assertTrustedSender}){
  let download=null,sequence=0,controller=null,verified=null;
  const {downloadVerified,checksum}=require('./update-download.cjs');
  ipcMain.handle('updates:check',async event=>{
    assertTrustedSender(event,getWindow());if(controller)throw Error('Aguarde ou cancele o download atual.');download=null;const request=++sequence;
    const variant=process.env.PORTABLE_EXECUTABLE_DIR?'portable':'setup';
    const fetcher=(url,options)=>net.fetch(url,options);
    const release=feed.type==='github'
      ?await checkGitHubRelease(feed,app.getVersion(),variant,fetcher)
      :await checkRelease(feed.url,app.getVersion(),variant,fetcher);
    if(request!==sequence)throw Error('Uma consulta mais recente foi iniciada.');
    download=release.status==='available'?release:null;return {status:release.status,version:release.version,sha256:release.sha256};
  });
  ipcMain.handle('updates:download',async event=>{
    assertTrustedSender(event,getWindow());
    if(!download)throw Error('Consulte a versão disponível primeiro.');
    if(controller)throw Error('Download já em andamento.');
    controller=new AbortController();verified=null;const selected=download;
    try{
      const file=await downloadVerified({release:selected,directory:require('node:path').join(app.getPath('userData'),'updates'),fetcher:(url,options)=>net.fetch(url,options),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15*60*1000)]),progress:data=>{const w=getWindow();if(w&&!w.isDestroyed())w.webContents.send('updates:progress',data);}});
      verified={file,sha256:selected.sha256};return {status:'ready'};
    }catch(error){throw Error(controller.signal.aborted?'Download cancelado.':error.message);}finally{controller=null;}

  });
  ipcMain.handle('updates:cancel',event=>{assertTrustedSender(event,getWindow());controller?.abort();});
  ipcMain.handle('updates:open',async event=>{
    assertTrustedSender(event,getWindow());if(!verified)throw Error('Baixe e verifique uma atualização primeiro.');
    if(await checksum(verified.file)!==verified.sha256){verified=null;throw Error('O arquivo foi alterado. Baixe novamente.');}
    if(require('node:path').basename(verified.file).startsWith('MATTOZ-Portable-')){shell.showItemInFolder(verified.file);return {status:'revealed'};}
    const error=await shell.openPath(verified.file);if(error)throw Error(error);
  });
  app.on?.('before-quit',()=>controller?.abort());
}
module.exports={checkRelease,checkGitHubRelease,registerUpdates};
