'use strict';
const {app,net}=require('electron');
const assert=require('node:assert/strict');
const {checkGitHubRelease}=require('../src/main/updates.cjs');
const config=require('../src/main/release-feed.json');
app.whenReady().then(async()=>{
 try{
  // Fetch once through the same Electron networking stack used in the app.
  let data;
  const fetcher=async(url,options)=>{
   if(!data){const response=await net.fetch(url,options);assert.equal(response.status,200);data=await response.text();}
   return new Response(data);
  };
  for(const variant of ['portable','setup']){
   const result=await checkGitHubRelease(config,'0.9.0-preview.15',variant,fetcher);
   assert.equal(result.status,'available');assert.equal(result.version,'0.9.0-preview.16');
   console.log(variant,result.version,result.sha256);
  }
  const installed=await checkGitHubRelease(config,'0.9.0-preview.17','setup',fetcher);
  assert.equal(installed.status,'ahead');console.log('Live Electron query: PASS; preview17 avoids downgrade');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
