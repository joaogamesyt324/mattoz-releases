const {mergePreferences}=require('./preferences.cjs');
const required=['theme','accent','lyricSize','motion'];const fields=[...required,'font','customAccent'];
function validateTheme(data){if(!data||typeof data.name!=='string'||!data.name.trim()||data.name.length>60||!data.preferences||required.some(k=>typeof data.preferences[k]!=='string')||Object.keys(data.preferences).some(k=>!fields.includes(k)))throw Error('Tema inválido');const validated=mergePreferences({},data.preferences);if(!data.preferences.customAccent)validated.customAccent=({lime:'#d8f880',violet:'#cba8ff',rose:'#ff9ebe'})[validated.accent];return {name:data.name.trim(),preferences:Object.fromEntries(fields.map(k=>[k,validated[k]]))};}
module.exports={validateTheme};
