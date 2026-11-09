'use strict';
const fs=require('node:fs');
const version=require('../package.json').version;
if(!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version))throw Error('Versão inválida');
fs.rmSync(`dist/MATTOZ-Setup-${version}-x64.exe`,{force:true});

fs.rmSync(`dist/MATTOZ-Portable-${version}-x64.exe`,{force:true});
