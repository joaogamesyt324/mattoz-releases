'use strict';
const fs=require('node:fs/promises');
function validateGIF(bytes){if(!Buffer.isBuffer(bytes)||bytes.length<13||bytes.length>3*1024*1024||!['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)))throw Error('Escolha um GIF de até 3 MB.');const width=bytes.readUInt16LE(6),height=bytes.readUInt16LE(8);if(!width||!height||width>2048||height>2048)throw Error('GIF deve ter dimensões de até 2048 × 2048.');return 'data:image/gif;base64,'+bytes.toString('base64');}
function validateAnimation(bytes){
 if(bytes.subarray(0,3).toString()==='GIF')return validateGIF(bytes);
 if(bytes.length<12||bytes.length>12*1024*1024)throw Error('Vídeo deve ter até 12 MB.');
 const type=bytes.toString('ascii',4,8)==='ftyp'?'mp4':bytes.readUInt32BE(0)===0x1a45dfa3?'webm':null;
 if(!type)throw Error('Escolha GIF, MP4 ou WebM.');
 return 'data:video/'+type+';base64,'+bytes.toString('base64');
}
async function animationAction(action,data,{library,dialog,getWindow,save}){const track=library.tracks.get(data.id);if(!track)throw Error('Música não encontrada.');if(action==='animation:remove'){delete track.customAnimation;save();return null;}if(action==='animation:get')return track.customAnimation||null;if(action!=='animation:choose')throw Error('Ação inválida.');const result=await dialog.showOpenDialog(getWindow(),{properties:['openFile'],filters:[{name:'Capa animada',extensions:['gif','mp4','webm']}]});if(result.canceled)return track.customAnimation||null;const file=result.filePaths[0];if((await fs.stat(file)).size>12*1024*1024)throw Error('Limite de 12 MB.');const image=validateAnimation(await fs.readFile(file));const current=library.tracks.get(data.id);if(!current)throw Error('Música removida durante a seleção.');current.customAnimation=image;save();return image;}
module.exports={validateGIF,animationAction};
