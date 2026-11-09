'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const semver=require('semver');

async function publish({root=path.resolve(__dirname,'..'),env=process.env,fetcher=fetch,run=(args)=>execFileSync('gh',args,{stdio:'inherit',env})}={}) {
  const repository='joaogamesyt324/mattoz-releases';
  if(env.GITHUB_REPOSITORY!==repository||env.GITHUB_REF!=='refs/heads/main'||!['push','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME))throw Error('Publicação permitida somente na branch main do repositório oficial.');
  if(!env.GH_TOKEN||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||''))throw Error('Contexto de publicação ausente.');
  const {version}=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  if(!semver.valid(version)||semver.valid(version)!==version||version.includes('+'))throw Error('Versão inválida.');
  const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
  if(lock.version!==version||lock.packages?.['']?.version!==version)throw Error('Versões do package.json e lock divergentes.');
  const tag='v'+version,api='https://api.github.com/repos/'+repository;
  async function get(endpoint){
    const response=await fetcher(api+endpoint,{headers:{Authorization:'Bearer '+env.GH_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'error',signal:AbortSignal.timeout(30000)});
    if(response.status===404)return null;
    if(!response.ok)throw Error('GitHub respondeu HTTP '+response.status);
    return response.json();
  }
  const existing=await get('/releases/tags/'+tag);
  const drafts=await get('/releases?per_page=100');
  let draft=Array.isArray(drafts)?drafts.find(r=>r.draft&&r.tag_name===tag):null;
  if(existing){
    if(existing.draft)throw Error('Já existe um rascunho desta versão. Revise-o antes de publicar novamente.');
    console.log(tag+' já publicada; os arquivos existentes foram preservados.');return {status:'existing',tag};
  }
  if(!draft&&await get('/git/ref/tags/'+tag))throw Error('Tag já existente sem release. Use um novo número de versão para preservar o histórico.');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/release.json'),'utf8'));
  if(manifest.product!=='mattoz-music-player'||manifest.version!==version)throw Error('Manifesto não corresponde à versão.');
  const files=[],checksums=[];
  for(const [kind,label] of [['portable','Portable'],['setup','Setup']]){
    const name=`MATTOZ-${label}-${version}-x64.exe`,item=manifest.windows?.[kind];
    if(item?.file!==name||!/^[a-f0-9]{64}$/.test(item.sha256||''))throw Error('Pacote inválido.');
    const file=path.join(root,'dist',name),hash=crypto.createHash('sha256');
    for await(const chunk of fs.createReadStream(file))hash.update(chunk);
    if(hash.digest('hex')!==item.sha256)throw Error('SHA-256 divergente: '+name);
    files.push(file);checksums.push(item.sha256+'  '+name);
  }
  const sumPath=path.join(root,'dist/SHA256SUMS.txt');fs.writeFileSync(sumPath,checksums.join('\n')+'\n');
  files.push(path.join(root,'dist/release.json'),sumPath);
  const notes=path.join(root,'RELEASE-NOTES.md');
  if(!fs.readFileSync(notes,'utf8').includes(version))throw Error('Atualize RELEASE-NOTES.md para esta versão.');
  const args=['release','create',tag,...files,'--repo',repository,'--target',env.GITHUB_SHA,'--title','MATTOZ Music Player — '+version,'--notes-file',notes,'--draft'];
  if(semver.prerelease(version))args.push('--prerelease');
  // If any upload fails, gh exits nonzero and the release stays a draft.
  if(draft){await run(['release','upload',tag,...files,'--repo',repository,'--clobber']);}else{await run(args);}
  const releases=await get('/releases?per_page=100');
  draft=Array.isArray(releases)?releases.find(r=>r.draft&&r.tag_name===tag):null;
  if(!draft?.draft)throw Error('Rascunho não confirmado; publicação interrompida.');
  for(const file of files){
    const asset=draft.assets?.find(a=>a.name===path.basename(file));
    if(!asset||asset.state!=='uploaded'||asset.size!==fs.statSync(file).size)throw Error('Upload incompleto; release mantida em rascunho.');
  }
  await run(['api','--method','PATCH',`repos/${repository}/releases/${draft.id}`,'-F','draft=false','-f','target_commitish='+env.GITHUB_SHA,...(semver.prerelease(version)?['-f','make_latest=false']:[])]);
  console.log('Publicada: https://github.com/'+repository+'/releases/tag/'+tag);
  return {status:'published',tag};
}
if(require.main===module)publish().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={publish};
