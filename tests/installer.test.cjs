const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {spawnSync}=require('node:child_process');
test('installer verification rejects truncated and corrupted payloads',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mattoz-nsis-'));const file=path.join(dir,'test.exe');
 try{
  const data=Buffer.alloc(1028);data.writeUInt32LE(8,512);Buffer.from('efbeadde4e756c6c736f6674496e7374','hex').copy(data,516);data.writeUInt32LE(516,536);
  let crc=0xffffffff;for(let i=512;i<1024;i++){crc^=data[i];for(let k=0;k<8;k++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;}data.writeUInt32LE((crc^0xffffffff)>>>0,1024);
  const check=()=>spawnSync(process.execPath,[path.join(__dirname,'../scripts/check-installer.cjs'),file],{encoding:'utf8'});
  fs.writeFileSync(file,data);assert.equal(check().status,0);
  fs.writeFileSync(file,data.subarray(0,1000));assert.match(check().stderr,/incompleto/);
  data[800]^=1;fs.writeFileSync(file,data);assert.match(check().stderr,/CRC interno/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
