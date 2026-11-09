'use strict';
class SleepTimer {
 constructor(audio,changed=()=>{},clock=()=>Date.now()){this.audio=audio;this.changed=changed;this.clock=clock;this.mode=null;this.base=null;}
 cancel(){if(this.base!==null)this.audio.volume=this.base;this.base=null;this.mode=null;this.changed('Desativado');}
 start(minutes,fade=10){if(!Number.isFinite(minutes)||minutes<1||minutes>180)throw Error('Escolha de 1 a 180 minutos');if(typeof window!=='undefined')window.mattozAudio?.cancelTransition();this.cancel();this.mode='time';this.deadline=this.clock()+minutes*60000;this.fade=fade;this.tick();}
 endOfTrack(){if(typeof window!=='undefined')window.mattozAudio?.cancelTransition();this.cancel();this.mode='track';this.changed('Parar ao terminar esta faixa');}
 consumeEnd(){if(this.mode!=='track')return false;this.audio.pause();this.cancel();this.changed('Faixa concluída. Reprodução pausada.');return true;}
 tick(){if(this.mode!=='time')return;const left=(this.deadline-this.clock())/1000;if(left<=0){this.audio.pause();this.cancel();this.changed('Tempo encerrado. Reprodução pausada.');return;}if(this.fade>0&&left<=this.fade&&!this.audio.paused){if(this.base===null)this.base=this.audio.volume;this.audio.volume=this.base*Math.max(0,Math.min(1,left/this.fade));}this.changed(`Pausa em ${Math.ceil(left/60)} min${this.base!==null?' · reduzindo volume':''}`);}
}
if(typeof module==='object'&&module.exports)module.exports={SleepTimer};else window.SleepTimer=SleepTimer;
