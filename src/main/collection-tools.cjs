const DAY=86400000;
function validateMetadata(data){
 if(!data||typeof data!=='object'||Object.keys(data).some(k=>!['title','artist','album','year'].includes(k)))throw Error('Informações inválidas');
 const result={};
 for(const key of ['title','artist','album']){if(typeof data[key]!=='string'||data[key].length>300)throw Error('Texto inválido');result[key]=data[key].trim();}
 if(!result.title)throw Error('Informe o título');
 if(!Number.isInteger(data.year)||data.year<0||data.year>9999)throw Error('Ano inválido');result.year=data.year;return result;
}
function smartPlaylists(tracks,saved,now=Date.now()){
 const all=[...tracks].filter(t=>!t.missing),favorites=new Set(saved.favorites||[]),recent=new Map((saved.recent||[]).map(x=>[x.id,x.at])),heard=saved.listening?.tracks||{};
 const definitions=[
 ['favorites','Favoritas',all.filter(t=>favorites.has(t.id))],
 ['new','Adicionadas recentemente',all.filter(t=>t.addedAt>=now-30*DAY).sort((a,b)=>b.addedAt-a.addedAt)],
 ['most','Mais ouvidas',all.filter(t=>heard[t.id]>0).sort((a,b)=>heard[b.id]-heard[a.id]).slice(0,50)],
 ['forgotten','Redescobrir',all.filter(t=>heard[t.id]>0&&(t.lastPlayedAt||recent.get(t.id)||now)<now-30*DAY)]
 ];return definitions.map(([id,name,list])=>({id:'smart:'+id,name,smart:true,tracks:list.map(t=>t.id)}));
}
module.exports={validateMetadata,smartPlaylists};
