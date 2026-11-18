'use strict';
const assert=require('assert'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'no-preference'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;});
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.resolve(__dirname,'../index.html')).href),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.G&&G.Game&&G.State,undefined,{polling:50});await page.evaluate(()=>G.Game.ensureGeo());
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
 const shotDir=(process.env.OUT||path.resolve(__dirname,'../artifacts/wanted-sea-20261118'));fs.mkdirSync(shotDir,{recursive:true});
 const sheet=await page.evaluate(async()=>{
  const root=document.querySelector('.wanted-wind');
  const cfg=G.FX.wantedReveal;
  root.getAnimations({subtree:true}).forEach(a=>a.pause());
  const fonts=await document.fonts.load('900 24px "Noto Serif KR Wanted"','현상수배 3,400닢');
  return {flyMs:cfg.flyMs,inkMs:cfg.inkMs,canvases:root.querySelectorAll('.wp-face canvas').length,
   paperOnly:root.querySelectorAll('button').length===1&&!!root.querySelector('button.wanted-paper .wp-sheet'),
   noExplanation:!root.querySelector('p'),font:fonts.length===1&&fonts[0].status==='loaded'};
 });
 assert(sheet.canvases===1&&sheet.paperOnly&&sheet.noExplanation&&sheet.font);
 await page.waitForFunction(()=>!document.querySelector('.wanted-wind .wp-face .img-wait'),undefined,{polling:50});
 await page.evaluate(()=>{for(let i=0;i<4;i++)G.Scenes.sea.update(1/60);});
 const transforms=[];
 for(const [time,name] of [[sheet.flyMs*.22,'flying'],[sheet.inkMs*.49,'impact'],[sheet.inkMs,'opened']]){
  transforms.push(await page.evaluate(t=>{
   const root=document.querySelector('.wanted-wind');
   root.getAnimations({subtree:true}).forEach(a=>{a.currentTime=t;});
   return {flight:getComputedStyle(root.querySelector('.wanted-flight')).transform,
    ink:getComputedStyle(root.querySelector('.wp-amount')).color};
  },time));
  await page.screenshot({path:path.join(shotDir,name+'.png')});
 }
 assert.equal(new Set(transforms.map(t=>t.flight)).size,3);
 assert(transforms[0].ink===transforms[2].ink&&transforms[1].ink==='rgb(255, 245, 206)',JSON.stringify(transforms));
 await page.evaluate(()=>document.querySelector('.wanted-flight').getAnimations().forEach(a=>a.finish()));
 const dismiss=page.getByRole('button',{name:'수배서 닫기',exact:true});
 await page.waitForSelector('.wanted-ready');
 const bend=await dismiss.evaluate(paper=>{
  const hover=paper.getAnimations().find(a=>a.animationName==='wanted-hover');
  hover.pause();hover.currentTime=G.FX.wantedReveal.hoverMs*.23;
  const raised=getComputedStyle(paper).transform;
  hover.currentTime=G.FX.wantedReveal.hoverMs*.43;
  return raised!==getComputedStyle(paper).transform;
 });
 assert(bend,'중앙에 도착한 종이가 바람에 계속 펄럭인다');
 await page.screenshot({path:path.join(shotDir,'reveal.png')});
 await dismiss.locator('.wp-face').click({position:{x:120,y:160}});
 assert(await page.locator('.wanted-leaving').count(),'닫으면 종이가 날아간다');
 assert(await page.evaluate(()=>G.Scenes.sea.runtime().busy>0),'종이가 날아가는 동안 항해를 멈춘다');
 await page.evaluate(()=>{
  const flight=document.querySelector('.wanted-flight');
  const a=flight.getAnimations().find(a=>a.animationName==='wanted-depart');
  a.pause();a.currentTime=G.FX.wantedReveal.leaveMs*.5;
 });
 await page.screenshot({path:path.join(shotDir,'leaving.png')});
 await page.evaluate(()=>document.querySelector('.wanted-flight').getAnimations().forEach(a=>a.finish()));

 await page.waitForFunction(()=>!document.querySelector('.wanted-wind')&&G.Scenes.sea.runtime().busy===0,undefined,{polling:50});
 const checks=await page.evaluate(()=>{
 const s=G.Game.state,st=G.Scenes.sea.runtime();const n=st.npcs[0];st.tipScan=0;G.Scenes.sea.update(1/60);
 const once=!document.querySelector('.wanted-wind');
 G.LandSea.reset();const original=G.SeaFolk.voyages;let calls=0;G.SeaFolk.voyages=function(){calls++;return original.apply(this,arguments);};
 G.LandSea.step({lon:-9,lat:38,zoom:110},0,1/60,0,[-9,38]);G.SeaFolk.voyages=original;
 return {once,voyageCalls:calls};
 });
 assert(checks.once&&checks.voyageCalls===1);
 await page.setViewportSize({width:320,height:640});
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await page.evaluate(cap=>{
  const n={cap:{id:cap}};
  G.Wanted.reveal(n);
  const root=document.querySelector('.wanted-ready');
  return root&&root.getAnimations({subtree:true}).length===0;
 },out.cap);
 assert(reduced,'동작 줄이기 설정에서는 즉시 수배서를 읽을 수 있다');
 const mobile=await page.evaluate(()=>{
  const paper=document.querySelector('.wanted-paper').getBoundingClientRect();
  return paper.left>=0&&paper.right<=innerWidth&&paper.top>=0&&paper.bottom<=innerHeight;
 });
 assert(mobile,'작은 화면에서도 수배서가 들어간다');
 await page.keyboard.press('Tab');
 assert(await dismiss.evaluate(paper=>paper===document.activeElement),'탭을 누르면 수배서에 초점이 간다');
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('.wanted-wind').count(),0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 const lifecycle=await page.evaluate(async cap=>{
  const button=document.createElement('button');button.textContent='초점 복원 검사';document.body.appendChild(button);button.focus();
  const early=G.Wanted.reveal({cap:{id:cap}});document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await early;
  const earlyFocus=document.activeElement===button&&!document.querySelector('.wanted-wind');
  const pending=G.Wanted.reveal({cap:{id:cap}});G.Scenes.sea.exit();await pending;
  const sceneExit=!document.querySelector('.wanted-wind')&&!G.Wanted.cancelReveal,focusRestored=document.activeElement===button;button.remove();
  return{earlyFocus,sceneExit,focusRestored};
 },out.cap);
 assert(lifecycle.earlyFocus&&lifecycle.sceneExit&&lifecycle.focusRestored,'조기 닫기·장면 종료·초점 복원 '+JSON.stringify(lifecycle));
 assert.deepStrictEqual(errors,[]);console.log(JSON.stringify({out,checks,font:sheet.font,mobile,reduced,lifecycle,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
