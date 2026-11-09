'use strict';
(function(root){
 const defaults=Object.freeze({immersiveLayout:'vinyl',immersiveBackground:'album',immersiveBrightness:80,immersiveCoverSize:100});
 function validate(key,value){
  const choices={immersiveLayout:['vinyl','cover','lyrics'],immersiveBackground:['album','plain']};
  if(choices[key]){if(!choices[key].includes(value))throw Error('Visualização inválida');}
  else if(key==='immersiveBrightness'||key==='immersiveCoverSize'){const low=key==='immersiveBrightness'?25:65;if(!Number.isInteger(value)||value<low||value>100)throw Error('Ajuste visual inválido');}
  else throw Error('Preferência visual inválida');return value;
 }
 function normalize(input={}){const result={...defaults};for(const key of Object.keys(defaults)){try{if(input[key]!==undefined)result[key]=validate(key,input[key]);}catch{}}return result;}
 const api={defaults,validate,normalize};if(typeof module==='object'&&module.exports)module.exports=api;else root.MattozDisplay=api;
})(typeof window!=='undefined'?window:globalThis);
