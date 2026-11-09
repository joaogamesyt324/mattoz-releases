'use strict';
const fs=require('node:fs/promises');
const {createHash,randomUUID}=require('node:crypto');
function albumKey(track){return 'album:'+createHash('sha256').update(JSON.stringify([track.albumArtist||track.artist||'',track.album||''])).digest('hex');}
function validateAsset(bytes,kind){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>(kind==='pdf'?12:3)*1024*1024)throw Error(kind==='pdf'?'PDF deve ter até 12 MB.':'Imagem deve ter até 3 MB.');
 if(kind==='pdf'){if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('PDF inválido.');return 'application/pdf';}
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 throw Error('Use uma imagem PNG ou JPEG.');
}
async function albumAction(action,d,{store,library,dialog,getWindow}){
 const track=library.tracks.get(d.id);if(!track)throw Error('Álbum não encontrado.');
 const key=albumKey(track),get=()=>store.get(key,{credits:'',photos:[],back:null,pdf:null});
 const publicData=()=>{const data=get();return {...data,pdf:data.pdf?{name:data.pdf.name}:null};};
 if(action==='album:get')return publicData();
 if(action==='album:credits'){if(typeof d.text!=='string'||d.text.length>20000)throw Error('Créditos devem ter até 20.000 caracteres.');store.set(key,{...get(),credits:d.text});return publicData();}
 if(action==='album:remove'){
  const data=get();if(d.kind==='photo')data.photos=data.photos.filter(p=>p.id!==d.assetId);else if(['back','pdf'].includes(d.kind))data[d.kind]=null;else throw Error('Anexo inválido.');store.set(key,data);return publicData();
 }
 if(action==='album:export-pdf'){
  const pdf=get().pdf;if(!pdf)throw Error('Nenhum PDF adicionado.');
  const result=await dialog.showSaveDialog(getWindow(),{defaultPath:'MATTOZ-encarte.pdf',filters:[{name:'PDF',extensions:['pdf']}]});
  if(result.canceled)return false;const bytes=Buffer.from(pdf.data,'base64');validateAsset(bytes,'pdf');await fs.writeFile(result.filePath,bytes);return true;
 }
 if(action!=='album:attach'||!['photo','back','pdf'].includes(d.kind))throw Error('Ação de encarte inválida.');
 if(d.kind==='photo'&&get().photos.length>=8)throw Error('Limite de 8 fotos por álbum.');
 const result=await dialog.showOpenDialog(getWindow(),{properties:['openFile'],filters:[{name:d.kind==='pdf'?'PDF':'Imagem',extensions:d.kind==='pdf'?['pdf']:['png','jpg','jpeg']}]});
 if(result.canceled)return publicData();
 const file=result.filePaths[0];const handle=await fs.open(file,'r');let bytes;
 try{const stat=await handle.stat();if(!stat.isFile()||stat.size>(d.kind==='pdf'?12:3)*1024*1024)throw Error('Arquivo excede o limite permitido.');bytes=await handle.readFile();}finally{await handle.close();}
 const mime=validateAsset(bytes,d.kind),data=get();
 if(d.kind==='pdf')data.pdf={name:require('node:path').basename(file),data:bytes.toString('base64')};
 else if(d.kind==='back')data.back='data:'+mime+';base64,'+bytes.toString('base64');
 else{if(data.photos.length>=8)throw Error('Limite de 8 fotos por álbum.');data.photos.push({id:randomUUID(),image:'data:'+mime+';base64,'+bytes.toString('base64')});}
 store.set(key,data);return publicData();
}
module.exports={albumKey,validateAsset,albumAction};
