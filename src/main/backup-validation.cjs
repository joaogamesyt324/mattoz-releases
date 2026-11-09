function validateBackup(b){
 if(b?.format!=='mattoz-backup'||!Array.isArray(b.rows)||b.rows.length>100000)throw Error('Backup inválido');
 const parsed=new Map();for(const row of b.rows){if(!row||typeof row.key!=='string'||typeof row.value!=='string'||parsed.has(row.key))throw Error('Registro inválido');parsed.set(row.key,JSON.parse(row.value));}
 const lib=parsed.get('library');if(!lib||!['tracks','folders','files','ids'].every(k=>Array.isArray(lib[k])))throw Error('Biblioteca inválida');
 const pairs=x=>x.every(v=>Array.isArray(v)&&v.length===2&&typeof v[0]==='string');
 if(!pairs(lib.tracks)||!pairs(lib.files)||!pairs(lib.ids))throw Error('Biblioteca inválida');
 const tracks=new Map(lib.tracks),files=new Map(lib.files),ids=new Map(lib.ids),folders=new Set(lib.folders);
 for(const [id,t]of tracks){if(!t||t.id!==id||typeof t.title!=='string'||typeof files.get(id)!=='string'||!/\.mp3$/i.test(files.get(id)))throw Error('Faixa inválida no backup');t.url='mattoz-media://audio/'+encodeURIComponent(id);}
 for(const [id,file]of files)if(!tracks.has(id)||typeof file!=='string'||ids.get(file)!==id)throw Error('Caminhos inconsistentes');
 const ps=parsed.get('playlists')||[];if(!Array.isArray(ps)||ps.some(p=>!p||typeof p.id!=='string'||typeof p.name!=='string'||!Array.isArray(p.tracks)||p.tracks.some(id=>typeof id!=='string')))throw Error('Playlists inválidas');
 for(const key of ['favorites','recent','singles'])if(parsed.has(key)&&!Array.isArray(parsed.get(key)))throw Error('Coleção inválida');
 if(parsed.has('moments')){
  const moments=parsed.get('moments');
  if(!Array.isArray(moments)||moments.length>5000||moments.some(m=>!m||typeof m.id!=='string'||typeof m.trackId!=='string'||typeof m.label!=='string'||m.label.length>100||!Number.isFinite(m.position)||m.position<0||m.position>86400))throw Error('Momentos inválidos no backup');
 }
 return {parsed,tracks,files,ids,folders};
}
module.exports={validateBackup};
