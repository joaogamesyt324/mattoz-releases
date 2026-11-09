'use strict';
// An album deck schedules decoded PCM on the same audio clock as its neighbour.
class AlbumDeck extends EventTarget {
  constructor(context, output) {
    super();
    this.context=context;
    this.gain=context.createGain();
    this.gain.connect(output);
    this.volume=1;
    this.muted=false;
    this.src='';
    this.offset=0;
    this.revision=0;
    this.readyState=0;
    this.ended=false;
    this.wantPlay=false;
  }
  emit(name){this.dispatchEvent(new Event(name));}
  get paused(){return !this.wantPlay;}
  get currentSrc(){return this.src;}
  get duration(){return this.buffer?.duration??NaN;}
  get currentTime(){
    if(!this.node)return this.offset;
    return Math.min(this.duration,this.offset+Math.max(0,this.context.currentTime-this.startTime));
  }
  set currentTime(time){
    const playing=this.wantPlay;
    this.emit('seeking');this.stopNode();
    this.offset=Math.max(0,Math.min(time,this.duration||0));this.ended=false;
    if(playing&&this.buffer)this.startAt(this.context.currentTime);
    this.emit('seeked');this.emit('timeupdate');
  }
  get boundary(){return this.node?this.startTime+this.duration-this.offset:NaN;}
  set volume(value){this.level=value;this.refreshGain();}
  get volume(){return this.level;}
  set muted(value){this.silent=value;this.refreshGain();}
  get muted(){return this.silent;}
  refreshGain(){this.gain.gain.value=this.silent?0:this.level??1;}
  removeAttribute(key){if(key==='src')this.src='';}
  stopNode(){
    if(!this.node)return;
    this.node.onended=null;this.node.stop();this.node.disconnect();this.node=null;
  }
  pause(){
    this.offset=this.currentTime;this.stopNode();this.wantPlay=false;this.emit('pause');
  }
  load(){
    this.revision++;this.controller?.abort();this.stopNode();
    this.offset=0;this.buffer=null;this.error=null;this.readyState=0;this.ended=false;this.wantPlay=false;
    if(!this.src)return;
    const generation=this.revision;
    this.controller=new AbortController();
    this.loading=this.decode(this.src,this.controller.signal).then(buffer=>{
      if(generation!==this.revision)return;
      this.buffer=buffer;this.readyState=4;this.emit('loadedmetadata');this.emit('durationchange');this.emit('canplay');
    }).catch(error=>{
      if(generation===this.revision){this.error=error;this.emit('error');}
    });
  }
  async decode(url,signal){
    const response=await fetch(url,{signal});
    if(!response.ok || Number(response.headers.get('content-length'))>32*1024*1024)throw Error('Faixa fora do limite de decodificação antecipada.');
    const bytes=await response.arrayBuffer();
    if(signal.aborted)throw new DOMException('Cancelado','AbortError');
    return this.context.decodeAudioData(bytes);
  }
  startAt(time){
    this.stopNode();
    const node=this.context.createBufferSource();node.buffer=this.buffer;node.connect(this.gain);
    this.node=node;this.startTime=time;this.wantPlay=true;this.ended=false;
    node.onended=()=>{
      if(this.node!==node)return;
      node.disconnect();this.node=null;this.offset=this.duration;this.wantPlay=false;this.ended=true;this.emit('ended');
    };
    node.start(time,this.offset);
  }
  async play(){
    if(this.node)return;
    const generation=this.revision;this.wantPlay=true;
    await this.context.resume();await this.loading;
    if(generation!==this.revision||!this.wantPlay)throw new DOMException('Cancelado','AbortError');
    if(this.error)throw this.error;
    if(this.ended)this.offset=0;
    if(!this.node)this.startAt(this.context.currentTime);
    this.emit('play');this.emit('playing');
  }
}
if(typeof module==='object'&&module.exports)module.exports={AlbumDeck};
else window.AlbumDeck=AlbumDeck;
