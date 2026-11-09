'use strict';
(function(root) {
  class AudioTransport extends EventTarget {
    constructor(first, second) {
      super();
      this.decks = [first, second];
      this.active = first;
      this.master = first.volume;
      this.silent = first.muted;
      this.generation = 0;
      this.prepared = this.tail = this.mix = this.pending = null;
      this.outputDecks=this.decks;
      for(const deck of this.decks){
        deck.crossOrigin='anonymous';deck.preload='auto';this.listen(deck);
      }
      this.applyVolume();
    }
    getContext(){return this.context ||= new AudioContext();}
    setAlbumMode(enabled){
      if(enabled===Boolean(this.albumMode))return;
      this.pause();this.cancelTransition();this.clearPrepared();
      if(enabled&&!this.albumDecks){
        const context=this.getContext();this.albumBus=context.createGain();this.albumBus.connect(this.eqInput||context.destination);
        this.albumDecks=[new AlbumDeck(context,this.albumBus),new AlbumDeck(context,this.albumBus)];
        for(const deck of this.albumDecks)this.listen(deck);
      }
      if(this.albumMode){for(const deck of this.albumDecks){deck.removeAttribute('src');deck.load();}}
      this.albumMode=enabled;
      this.outputDecks=enabled?this.albumDecks:this.decks;this.active=this.outputDecks[0];this.applyVolume();
    }
    listen(deck){
      const events=['play','playing','pause','ended','error','waiting','seeking','seeked','timeupdate','durationchange','loadedmetadata','canplay','emptied'];
      for(const type of events)deck.addEventListener(type,()=>{
        if(deck!==this.active)return;
        if(type==='waiting')this.tail?.pause();
        if(type==='playing'&&this.tail&&!this.paused)this.tail.play().catch(()=>{});
        this.dispatchEvent(new Event(type));
      });
    }
    unschedule(){
      if(!this.scheduled)return;
      const deck=this.scheduled;this.scheduled=null;
      deck.pause();deck.currentTime=0;deck.volume=0;
    }
    schedule(){
      if(!this.albumMode||!this.preparedReady||this.paused||this.scheduled)return;
      const when=this.active.boundary;
      if(!Number.isFinite(when)||when<=this.context.currentTime)return;
      const deck=this.prepared.deck;deck.volume=this.master;deck.muted=this.silent;
      deck.startAt(when);this.scheduled=deck;
    }
    get src(){ return this.active.src; }
    set src(value){ this.cancelTransition(); this.clearPrepared(); this.active.src=value; }
    get currentSrc(){ return this.active.currentSrc; }
    get currentTime(){ return this.active.currentTime; }
    set currentTime(value){ this.cancelTransition(); this.active.currentTime=value; }
    get duration(){ return this.active.duration; }
    get paused(){ return this.active.paused; }
    get ended(){ return this.active.ended; }
    get seeking(){ return this.active.seeking; }
    get error(){ return this.active.error; }
    get readyState(){ return this.active.readyState; }
    get volume(){ return this.master; }
    set volume(value){
      if (!Number.isFinite(value) || value<0 || value>1) throw new RangeError('Volume inválido');
      this.master=value; this.applyVolume(); this.dispatchEvent(new Event('volumechange'));
    }
    get muted(){ return this.silent; }
    set muted(value){ this.silent=Boolean(value); this.applyVolume(); this.dispatchEvent(new Event('volumechange')); }
    load(){ this.active.load(); }
    async play(){ await this.active.play(); }
    pause(){ this.unschedule(); this.abortPending(); this.active.pause(); this.tail?.pause(); }
    abortPending(){
      this.generation++;
      if(this.pending){this.pending.pause();this.pending=null;}
    }
    applyVolume(){
      const progress=this.mix?Math.max(0,Math.min(1,(this.currentTime-this.mix.start)/this.mix.seconds)):1;
      for(const deck of this.outputDecks){
        deck.muted=this.silent;
        const factor=deck===this.active?progress:deck===this.tail?1-progress:deck===this.scheduled?1:0;
        deck.volume=this.master*factor;
      }
    }
    cancelTransition(){
      this.unschedule(); this.abortPending(); this.tail?.pause(); this.tail=null; this.mix=null; this.applyVolume();
    }
    clearPrepared(){
      if(!this.prepared)return;
      this.unschedule();this.abortPending();
      const deck=this.prepared.deck;this.prepared=null;
      deck.pause();deck.removeAttribute('src');deck.load();
    }
    prepare(url){
      if(this.tail || this.pending || this.prepared?.url===url)return;
      this.clearPrepared();
      if(!url)return;
      const deck=this.outputDecks.find(d=>d!==this.active);
      deck.src=url;deck.load();this.prepared={url,deck};this.applyVolume();
    }
    get preparedReady(){ return !!this.prepared && !this.prepared.deck.error && this.prepared.deck.readyState>=3; }
    async promote(seconds,commit,valid=()=>true){
      if(!this.preparedReady || this.pending || this.tail)return false;
      const {deck}=this.prepared, generation=++this.generation;
      this.pending=deck;
      try {await deck.play();}
      catch {if(generation===this.generation)this.clearPrepared();return false;}
      if(generation!==this.generation)return false;
      if(!valid()){this.clearPrepared();return false;}
      this.pending=null;this.prepared=null;this.scheduled=null;
      const outgoing=this.active;
      this.active=deck;
      this.tail=seconds>0 && !outgoing.ended?outgoing:null;
      this.mix=this.tail?{start:deck.currentTime,seconds}:null;
      if(!this.tail)outgoing.pause();
      this.applyVolume();commit();
      for(const type of ['loadedmetadata','durationchange','play','playing','timeupdate'])this.dispatchEvent(new Event(type));
      return true;
    }
    tick(){
      if(this.albumMode&&!this.paused&&this.context.currentTime-(this.lastProgress||0)>.1){this.lastProgress=this.context.currentTime;this.dispatchEvent(new Event('timeupdate'));}
      if(!this.mix || this.paused)return;
      if(this.currentTime-this.mix.start>=this.mix.seconds || this.tail.ended)this.cancelTransition();
      else this.applyVolume();
    }
  }
  if(typeof module==='object' && module.exports){module.exports={AudioTransport};return;}
  const second=document.createElement('audio');second.hidden=true;document.body.append(second);
  root.mattozAudio=new AudioTransport(document.getElementById('audio'),second);
  setInterval(()=>root.mattozAudio.tick(),20);
})(globalThis);
