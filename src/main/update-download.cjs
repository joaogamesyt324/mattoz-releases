'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
async function checksum(file){const hash=crypto.createHash('sha256');for await(const chunk of require('node:fs').createReadStream(file))hash.update(chunk);return hash.digest('hex');}
async function downloadVerified({release,directory,fetcher,signal,progress=()=>{}}){
 if(!/^https:\/\/github\.com\/joaogamesyt324\/mattoz-releases\/releases\/download\/[^/]+\/MATTOZ-(Portable|Setup)-[\w.-]+-x64\.exe$/.test(release.url)||!Number.isSafeInteger(release.size)||release.size<=0||release.size>2*1024**3||! /^[a-f0-9]{64}$/.test(release.sha256))throw Error('Pacote de atualização inválido.');
 await fs.mkdir(directory,{recursive:true});const folder=await fs.mkdtemp(path.join(directory,'download-')),file=path.join(folder,path.basename(new URL(release.url).pathname));let handle;
 try{
  const response=await fetcher(release.url,{credentials:'omit',signal,redirect:'follow'});if(!response.ok||!response.body)throw Error('Falha ao baixar a atualização.');
  handle=await fs.open(file+'.part','wx');const hash=crypto.createHash('sha256');let received=0,last=0;
  for await(const chunk of response.body){signal?.throwIfAborted();received+=chunk.byteLength;if(received>release.size)throw Error('Tamanho do download divergente.');hash.update(chunk);await handle.writeFile(chunk);if(Date.now()-last>100){last=Date.now();progress({received,total:release.size});}}
  signal?.throwIfAborted();await handle.close();handle=null;
  if(received!==release.size||hash.digest('hex')!==release.sha256)throw Error('Arquivo incompleto ou corrompido. Baixe novamente.');
  await fs.rename(file+'.part',file);progress({received,total:release.size});return file;
 }catch(error){if(handle)await handle.close();await fs.rm(folder,{recursive:true,force:true});throw error;}
}
module.exports={downloadVerified,checksum};
