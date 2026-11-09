(function(root){
function parseLRC(text){const groups=[],entries=[],metadata={};let offset=0;
for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){const tag=/^\[([a-z]+):([^\]]*)\]\s*$/i.exec(line.trim());if(tag){if(tag[1].toLowerCase()==='offset'){const n=Number(tag[2]);if(Number.isFinite(n))offset=n/1000;}else metadata[tag[1].toLowerCase()]=tag[2];continue;}const stamps=[...line.matchAll(/\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];const content=line.replace(/\[\d+:[0-5]\d(?:[.:]\d{1,3})?\]/g,'').trim();for(const m of stamps)entries.push({time:Number(m[1])*60+Number(m[2])+Number('0.'+(m[3]||'0')),text:content});}
entries.sort((a,b)=>a.time-b.time);for(const e of entries){const last=groups.at(-1);if(last&&last.time===e.time)last.lines.push(e.text);else groups.push({time:e.time,lines:[e.text]});}return {groups,offset,metadata};}
function activeIndex(groups,time,offset=0,delay=0){let lo=0,hi=groups.length-1,result=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(groups[mid].time<=time+offset-delay){result=mid;lo=mid+1;}else hi=mid-1;}return result;}
const api={parseLRC,activeIndex};if(typeof module==='object'&&module.exports)module.exports=api;else root.LRC=api;
})(globalThis);
