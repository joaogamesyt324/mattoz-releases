'use strict';
const path=require('node:path');
const {build,Platform,Arch}=require('electron-builder');
const targets=()=>Platform.WINDOWS.createTarget(['nsis'],Arch.x64);
async function main(){
  const prepackaged=path.resolve('dist/win-unpacked');
  if(!process.argv.includes('--prepackaged'))await build({targets:Platform.WINDOWS.createTarget(['dir'],Arch.x64)});
  await build({targets:targets(),prepackaged});
  await build({
    targets:targets(),
    prepackaged:path.resolve('dist/win-unpacked'),
    config:{artifactName:'MATTOZ-Portable-${version}-${arch}.${ext}',nsis:{script:'build/portable.nsi'}}
  });
}
main().catch(error=>{console.error(error);process.exitCode=1;});
