'use strict';
const fs=require('node:fs/promises');
function decodeCard(value){
 if(typeof value!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)||value.length>7000000)throw Error('Cartão PNG inválido.');
 const bytes=Buffer.from(value.slice(22),'base64');
 if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)!==1080||bytes.readUInt32BE(20)!==1080)throw Error('O cartão deve ser um PNG de 1080 × 1080.');
 return bytes;
}
async function exportCard(data,{dialog,getWindow}){const bytes=decodeCard(data.png);const result=await dialog.showSaveDialog(getWindow(),{defaultPath:'MATTOZ-musica.png',filters:[{name:'Imagem PNG',extensions:['png']}]});if(result.canceled)return false;await fs.writeFile(result.filePath,bytes);return true;}
module.exports={decodeCard,exportCard};
