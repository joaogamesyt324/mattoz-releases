'use strict';
const {randomUUID}=require('node:crypto');
const {parseLRC}=require('../renderer/lrc.js');
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const summary=track=>({id:track.id,title:track.title,artist:track.artist,url:track.url,duration:track.duration,missing:track.missing});
function capsule(listening,tracks,month){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido.');
  const entries=Object.entries(listening.months?.[month]||{}).filter(([,seconds])=>Number.isFinite(seconds)&&seconds>0);
  const artists=new Map();
  const ranked=entries.sort((a,b)=>b[1]-a[1]).flatMap(([id,seconds])=>{
    const track=tracks.get(id);if(!track)return [];
    const artist=track.artist||'Artista desconhecido';artists.set(artist,(artists.get(artist)||0)+seconds);
    return [{track:summary(track),seconds}];
  });
  return {month,months:Object.keys(listening.months||{}).filter(m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m)).sort().reverse(),seconds:entries.reduce((sum,[,seconds])=>sum+seconds,0),trackCount:entries.length,removed:entries.length-ranked.length,ranked:ranked.slice(0,30),artists:[...artists].sort((a,b)=>b[1]-a[1]).slice(0,5)};
}
function personalCollection({store,library,media}){
  let searchGeneration=0;
  const moments=()=>store.get('moments',[]);
  return async(action,data)=>{
    if(action==='personal:search-cancel'){searchGeneration++;return;}
    if(action==='personal:search'){
      if(typeof data.query!=='string'||data.query.length>200)throw Error('Busca inválida.');
      const query=normalize(data.query.trim()),generation=++searchGeneration;
      if(query.length<2)return {rows:[],scanned:0,truncated:false};
      const rows=[];let scanned=0;
      for(const track of library.tracks.values()){
        const result=await media.lyrics(track.id);
        if(generation!==searchGeneration)return {cancelled:true};
        scanned++;
        if(result.status!=='ok')continue;
        const parsed=parseLRC(result.text);
        const lines=parsed.groups.length?parsed.groups.map(g=>({text:g.lines.join(' '),position:Math.max(0,g.time-parsed.offset)})):result.text.split(/\r?\n/).filter(line=>!/^\[[a-z]+:/i.test(line)).map(text=>({text,position:null}));
        for(const line of lines){
          if(!normalize(line.text).includes(query))continue;
          rows.push({track:summary(track),text:line.text.slice(0,500),position:line.position});
          if(rows.length>=100)return {rows,scanned,truncated:true};
        }
      }
      return {rows,scanned,truncated:false};
    }
    if(action==='personal:moments')return moments().map(m=>({...m,track:library.tracks.has(m.trackId)?summary(library.tracks.get(m.trackId)):null}));
    if(action==='personal:moment-add'){
      const track=library.tracks.get(data.trackId);
      if(!track||track.missing)throw Error('Música indisponível.');
      if(!Number.isFinite(data.position)||data.position<0||data.position>86400||(track.duration>0&&data.position>track.duration))throw Error('Posição inválida.');
      if(typeof data.label!=='string'||!data.label.trim()||data.label.length>100)throw Error('Use um nome de até 100 caracteres.');
      const all=moments();if(all.length>=5000)throw Error('Limite de 5.000 momentos atingido.');
      const moment={id:randomUUID(),trackId:track.id,position:data.position,label:data.label.trim(),createdAt:Date.now()};
      all.unshift(moment);store.set('moments',all);return moment;
    }
    if(action==='personal:moment-remove'){
      if(typeof data.id!=='string')throw Error('Momento inválido.');
      store.set('moments',moments().filter(m=>m.id!==data.id));return;
    }
    if(action==='personal:capsule'||action==='personal:capsule-playlist'){
      const result=capsule(store.get('listening',{}),library.tracks,data.month);
      if(action==='personal:capsule')return result;
      const ids=result.ranked.filter(row=>!row.track.missing).map(row=>row.track.id);
      if(!ids.length)throw Error('Este mês ainda não tem músicas disponíveis.');
      const playlists=store.get('playlists',[]);
      let playlist=playlists.find(p=>p.capsuleMonth===data.month);
      if(!playlist){playlist={id:randomUUID(),name:'Cápsula '+data.month,capsuleMonth:data.month,tracks:[]};playlists.push(playlist);}
      playlist.tracks=ids;store.set('playlists',playlists);return {id:playlist.id};
    }
    throw Error('Ação inválida.');
  };
}
module.exports={personalCollection,capsule};
