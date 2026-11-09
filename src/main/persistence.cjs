const {randomUUID}=require('node:crypto');
function setupPersistence({store,library,media,ipcMain,getWindow,assertTrustedSender,fetcher=(...args)=>fetch(...args)}){
 const saved=store.get('library',null);if(saved){library.tracks=new Map(saved.tracks);library.folders=new Set(saved.folders);media.files=new Map(saved.files);media.ids=new Map(saved.ids);}
 const save=()=>store.set('library',{tracks:[...library.tracks],folders:[...library.folders],files:[...media.files],ids:[...media.ids]});
 const original=library.import.bind(library);library.import=async (paths,progress)=>{const r=await original(paths,progress);save();return r;};
 const refresh=library.refresh.bind(library);library.refresh=async()=>{const r=await refresh();save();return r;};
 ipcMain.handle('saved:action',async(event,action,data={})=>{
  assertTrustedSender(event,getWindow());
  if(!data||typeof data!=='object'||JSON.stringify(data).length>100000)throw new Error('Dados inválidos');
  const playlists=store.get('playlists',[]);const find=()=>{const p=playlists.find(x=>x.id===data.id);if(!p)throw new Error('Playlist não encontrada');return p;};
  const name=()=>{if(typeof data.name!=='string'||!data.name.trim()||data.name.length>100)throw new Error('Nome inválido');return data.name.trim();};
  if(action==='list')return {smartPlaylists:require('./collection-tools.cjs').smartPlaylists(library.tracks.values(),{favorites:store.get('favorites',[]),recent:store.get('recent',[]),listening:store.get('listening',{})}),singles:store.get('singles',[]),favorites:store.get('favorites',[]),playlists,recent:store.get('recent',[]),preferences:store.get('preferences',{}),listening:store.get('listening',{total:0,tracks:{},days:{}})};
  if(action==='singles:add'||action==='singles:remove'){if(!Array.isArray(data.ids)||data.ids.length>10000||data.ids.some(id=>typeof id!=='string'||!library.tracks.has(id)))throw new Error('Singles inválidos');const ids=store.get('singles',[]);store.set('singles',action==='singles:add'?[...new Set([...ids,...data.ids])]:ids.filter(id=>!data.ids.includes(id)));return;}
  if(action==='favorite'){if(!library.tracks.has(data.id))throw new Error('Faixa inválida');const ids=store.get('favorites',[]);store.set('favorites',ids.includes(data.id)?ids.filter(id=>id!==data.id):[...ids,data.id]);return;}
  if(action==='duplicate'){const source=find();playlists.push({...source,id:randomUUID(),name:(source.name+' — cópia').slice(0,100),tracks:[...source.tracks]});}
  else if(action==='create')playlists.push({id:randomUUID(),name:name(),tracks:[]});
  else if(action==='rename'){const p=find();p.name=name();if(data.description!==undefined){if(typeof data.description!=='string'||data.description.length>500)throw new Error('Descrição inválida');p.description=data.description;}}
  else if(action==='delete'){const i=playlists.findIndex(x=>x.id===data.id);if(i>=0)playlists.splice(i,1);}
  else if(action==='tracks'){if(!Array.isArray(data.tracks)||data.tracks.length>10000||data.tracks.some(id=>!library.tracks.has(id)))throw new Error('Faixas inválidas');find().tracks=data.tracks;}
  else if(action==='listening'){if(!library.tracks.has(data.id))return;const date=new Date();const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');store.set('listening',require('./listening.cjs').addListening(store.get('listening',null),data.id,data.seconds,day));return;}
  else if(action==='played'){if(!library.tracks.has(data.id))return;library.tracks.get(data.id).lastPlayedAt=Date.now();save();const recent=store.get('recent',[]).filter(x=>x.id!==data.id);recent.unshift({id:data.id,at:Date.now()});store.set('recent',recent.slice(0,100));return;}
  else if(action==='preferences'){store.set('preferences',require('./preferences.cjs').mergePreferences(store.get('preferences',{}),data));return;}
  else throw new Error('Ação inválida');
  store.set('playlists',playlists);return playlists;
 });
 const localLyrics=media.lyrics.bind(media);media.lyrics=async id=>{const edited=store.get('lyrics:'+id,null);if(edited?.source==='editor')return {status:'ok',text:edited.text};const local=await localLyrics(id);if(local.status==='ok')return local;const cached=store.get('lyrics:'+id,null);return cached?{status:'ok',text:cached.text}:local;};
 ipcMain.handle('lyrics:online',async(event,id,choice)=>{
  assertTrustedSender(event,getWindow());const track=library.tracks.get(id);if(!track)throw new Error('Faixa inválida');
  if(choice!==undefined){if(!Number.isSafeInteger(choice)||choice<0)throw new Error('Resultado inválido');const r=await fetcher('https://lrclib.net/api/get/'+choice,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('LRCLIB respondeu HTTP '+r.status);const item=await r.json();if(typeof item.syncedLyrics!=='string'||item.syncedLyrics.length>1000000)throw new Error('Letra sincronizada indisponível');store.set('lyrics:'+id,{text:item.syncedLyrics,source:'LRCLIB',record:choice});return {saved:true};}
  const url=new URL('https://lrclib.net/api/search');url.searchParams.set('track_name',track.title);url.searchParams.set('artist_name',track.artist||'');const r=await fetcher(url,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('LRCLIB respondeu HTTP '+r.status);const rows=await r.json();if(!Array.isArray(rows))throw new Error('Resposta inesperada do LRCLIB');return rows.filter(x=>x.syncedLyrics).sort((a,b)=>Math.abs(a.duration-track.duration)-Math.abs(b.duration-track.duration)).slice(0,10).map(x=>({id:x.id,title:x.trackName,artist:x.artistName,album:x.albumName,duration:x.duration}));
 });
 return save;
}
module.exports={setupPersistence};
