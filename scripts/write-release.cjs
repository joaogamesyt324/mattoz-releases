'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {version}=require('../package.json');
async function main(){
  const windows={};
  for(const [key,label] of [['setup','Setup'],['portable','Portable']]){
    const file='MATTOZ-'+label+'-'+version+'-x64.exe',hash=crypto.createHash('sha256');
    for await(const bytes of fs.createReadStream(path.join('dist',file)))hash.update(bytes);
    windows[key]={file,sha256:hash.digest('hex')};
  }
  fs.writeFileSync('dist/release.json',JSON.stringify({product:'mattoz-music-player',version,windows},null,2)+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
