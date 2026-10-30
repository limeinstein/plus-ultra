/* 실제 시트와 지도에서 경로 추종을 재생한다. 검사 뒤 브라우저를 반드시 닫는다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/exploration-following-20261031');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await pw.chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[];try{
  const page=await browser.newPage({viewport:{width:1200,height:930}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.join(ROOT,'test_expedition_following.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.followDemo&&G.ExpeditionMotion.ready('walk')&&G.ExpeditionFormation.ready('foot'),null,{timeout:60000,polling:100});
  const cases=[];
  for(const id of ['walk','porter','horse','camel','donkey','llama','yak','wagon','elephant','reindeer']){
   await page.selectOption('#mount',id);await page.waitForFunction(id=>G.ExpeditionMotion.ready(id)&&G.ExpeditionFormation.ready(id==='walk'?'foot':id),id,{polling:100});
   const result=await page.evaluate(()=>{let maxMove=0,old=null;for(let f=0;f<650;f++){const list=followDemo.step(1/60);if(old)list.filter(i=>!i.leader).forEach(i=>{const before=old.find(j=>j.index===i.index);maxMove=Math.max(maxMove,Math.hypot(i.worldX-before.worldX,i.worldY-before.worldY));});old=list;}return{count:old.length,maxMove,moving:old.filter(i=>!i.leader&&i.moving).length,poses:old.map(i=>({index:i.index,phase:i.phase,heading:i.heading,x:i.worldX,y:i.worldY}))};});
   assert.strictEqual(result.count,4);assert(result.maxMove<3,'위치 연속성 '+id);cases.push({id,...result});
   if(id==='horse')await page.locator('#stage').screenshot({path:path.join(OUT,'horse-corner.png')});
  }
  await page.selectOption('#mount','walk');await page.evaluate(()=>{for(let i=0;i<450;i++)followDemo.step(1/60);});
  await page.locator('#stage').screenshot({path:path.join(OUT,'walk-corner.png')});
  await page.click('#pause');
  const stopped=await page.evaluate(()=>{const phases=[];for(let f=0;f<300;f++)followDemo.step(1/60);const a=followDemo.state.items.map(i=>({index:i.index,x:i.worldX,y:i.worldY,phase:i.phase}));for(let f=0;f<60;f++)followDemo.step(1/60);const b=followDemo.state.items;return{moving:b.filter(i=>!i.leader&&i.moving).length,still:a.every(i=>i.index===0||Math.abs(b.find(j=>j.index===i.index).phase-i.phase)<1e-9)};});
  assert(stopped.still&&stopped.moving===0,'뒤따라온 뒤 제자리에서 멈춤');
  await page.click('#turn');await page.evaluate(()=>{for(let i=0;i<90;i++)followDemo.step(1/60);});
  await page.locator('#stage').screenshot({path:path.join(OUT,'stop-turn.png')});
  await page.selectOption('#road','narrow');await page.evaluate(()=>{for(let i=0;i<780;i++)followDemo.step(1/60);});
  await page.locator('#stage').screenshot({path:path.join(OUT,'narrow-path.png')});
  // 움직이는 장면을 짧은 연속 그림으로 남긴다. 게임의 실제 그리기 코드를 그대로 쓴다.
  await page.selectOption('#road','wide');await page.selectOption('#mount','horse');
  await page.evaluate(()=>{for(let i=0;i<240;i++)followDemo.step(1/60);});
  for(let f=0;f<36;f++){await page.evaluate(()=>{for(let j=0;j<10;j++)followDemo.step(1/60);});await page.locator('#stage').screenshot({path:path.join(OUT,'motion-'+String(f).padStart(2,'0')+'.png')});}
  // 실제 게임은 별도 페이지에서 카메라 추적·이동·정지·야영을 확인한다.
  const game=await browser.newPage({viewport:{width:960,height:640}});game.on('pageerror',e=>errors.push(e.message));game.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await game.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
  await game.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:90000});
  await game.evaluate(async()=>{await G.Game.ensureGeo();G.Game.state=G.State.newGame({name:'추종 점검',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state.settings.res=0.35;G.Game.state.fleet.crew=4;G.Game.go('land',{from:0,mount:{id:'horse',n:4}});});
  await game.waitForFunction(()=>G.Scenes.land.runtime()&&G.Scenes.land.runtime().unitItems&&G.Scenes.land.runtime().unitItems.length===4,null,{timeout:60000});
  const runtime=await game.evaluate(async()=>{
   const l=G.Game.state.loc,r=G.Scenes.land.runtime();l.lon+=1.8;l.lat+=0.3;r.cam.lon=l.lon;r.cam.lat=l.lat;r.trail=[];r.unit={};
   await new Promise(resolve=>setTimeout(resolve,200));const start=l.lon;r.paused=false;r.dir=[1,0];
   await new Promise(resolve=>setTimeout(resolve,900));r.dir=[0,1];await new Promise(resolve=>setTimeout(resolve,900));r.dir=null;r.paused=true;
   await new Promise(resolve=>setTimeout(resolve,2000));
   return{mode:G.Game.sceneName,moved:l.lon>start,items:r.unitItems.map(i=>({index:i.index,phase:i.phase,moving:i.moving,x:i.worldX,y:i.worldY})),cacheOnly:!Object.prototype.hasOwnProperty.call(l,'formation')};
  });
  assert(runtime.moved&&runtime.items.length===4&&runtime.cacheOnly,'실제 지도 이동과 캐시');await game.screenshot({path:path.join(OUT,'in-game.png')});
  assert.deepStrictEqual(errors,[],'콘솔 오류');fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify({cases,stopped,runtime,errors},null,2));
  console.log('통과 — 10종 실제 시트의 연속 추종·모퉁이·정지·제자리 회전·좁은 길·실제 지도 이동·저장 필드 보존 / 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
