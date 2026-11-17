'use strict';
const assert=require('assert'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load|fonts\./.test(m.text()))errors.push(m.text());});
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;});
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname,'../index.html')).href));
 await page.waitForFunction(()=>window.G&&G.Game&&G.State);await page.evaluate(()=>G.Game.ensureGeo());
 const out=await page.evaluate(async()=>{
 const s=G.Game.state=G.State.newGame({name:'현상수배 시험',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
 s.flags.prologue=true;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.date={y:1600,m:5,d:1};
 const c=G.CITY_DATA.find(c=>c.name==='리스본');s.loc={mode:'city',city:c.id,lon:c.lon,lat:c.lat};
 const chance=G.U.chance,say=G.Scenes.city.say;G.U.chance=()=>true;G.Scenes.city.say=async()=>{};
 await G.Wanted.gossip(c);G.U.chance=chance;G.Scenes.city.say=say;
 const tip=s.maidTips.find(t=>t.kind==='named');if(!tip)throw Error('식당 소문 없음');
 s.loc={mode:'sea',lon:tip.lon,lat:tip.lat,heading:0};G.Game.go('sea',{fresh:true});
 const st=G.Scenes.sea.runtime();st.npcs=[];st.dayAcc=-1000;st.paused=true;
 G.Scenes.sea.update(1/60);
 const n=st.npcs.find(n=>n.tip===tip.id);if(!n)throw Error('실제 바다 갱신에서 출현 안 함');
 const spawn=n.cap.id===tip.cap&&n.wantedRumor;
 G.MaidTip.spawn(st.npcs);const unique=st.npcs.filter(n=>n.cap&&n.cap.id===tip.cap).length===1;
 s.loc.lon=n.lon;s.loc.lat=n.lat;st.tipScan=0;G.Scenes.sea.update(1/60);
 return {spawn,unique,revealed:n.wantedSeen,busy:st.busy,cap:tip.cap};
 });
 assert(out.spawn&&out.unique&&out.revealed&&out.busy,'소문 → 실제 출현 → 중복 방지 → 근접 수배서 '+JSON.stringify(out));
 await page.waitForSelector('.wanted-wind');
 const shotDir=path.resolve(__dirname,'../artifacts/wanted-sea-20261117');fs.mkdirSync(shotDir,{recursive:true});
 const transforms=[];
 for(const [time,name] of [[850,'flying'],[3000,'unfolding'],[3900,'opened']]){
  transforms.push(await page.evaluate(t=>{
   const root=document.querySelector('.wanted-wind');
   root.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t;});
   return {flight:getComputedStyle(root.querySelector('.wanted-flight')).transform,fold:getComputedStyle(root.querySelector('.wanted-fold-0')).transform,panels:root.querySelectorAll('.wanted-fold').length,noExplanation:!root.querySelector('p')};
  },time));
  await page.evaluate(()=>{for(let i=0;i<4;i++)G.Scenes.sea.update(1/60);});
  await page.screenshot({path:path.join(shotDir,name+'.png')});
 }
 assert(transforms.every(t=>t.panels===3&&t.noExplanation));assert.notEqual(transforms[0].flight,transforms[2].flight);assert.notEqual(transforms[1].fold,transforms[2].fold);

 await page.evaluate(()=>{for(let i=0;i<4;i++)G.Scenes.sea.update(1/60);});
 await page.waitForTimeout(4000);
 fs.mkdirSync(path.resolve(__dirname,'../artifacts/wanted-sea-20261117'),{recursive:true});
 await page.screenshot({path:path.resolve(__dirname,'../artifacts/wanted-sea-20261117/reveal.png')});
 await page.getByRole('button',{name:'수배서 접기',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.wanted-wind')&&G.Scenes.sea.runtime().busy===0);
 const checks=await page.evaluate(()=>{
 const s=G.Game.state,st=G.Scenes.sea.runtime();const n=st.npcs[0];st.tipScan=0;G.Scenes.sea.update(1/60);
 const once=!document.querySelector('.wanted-wind');
 G.LandSea.reset();const original=G.SeaFolk.voyages;let calls=0;G.SeaFolk.voyages=function(){calls++;return original.apply(this,arguments);};
 G.LandSea.step({lon:-9,lat:38,zoom:110},0,1/60,0,[-9,38]);G.SeaFolk.voyages=original;
 return {once,voyageCalls:calls};
 });
 assert(checks.once&&checks.voyageCalls===1);assert.deepStrictEqual(errors,[]);console.log(JSON.stringify({out,checks,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
