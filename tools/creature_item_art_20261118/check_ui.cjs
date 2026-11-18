'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const repo=path.resolve(__dirname,'../..'),out=path.join(repo,'artifacts/creature-item-art-20261118');
const pw=require(path.join(repo,'tools/procedural_art/node_modules/playwright-core'));
const plan=JSON.parse(fs.readFileSync(path.join(out,'prompts.json'),'utf8'));
const mapping=JSON.parse(fs.readFileSync(path.join(out,'asset-overrides.json'),'utf8'));
const errors=[];let browser,page,watchdog,stage='launch';
(async()=>{try{
 const chrome=process.env.BROWSER_EXE||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(f=>fs.existsSync(f));
 browser=await pw.chromium.launch({headless:true,...(chrome?{executablePath:chrome}:{}),args:['--no-sandbox',...(process.platform==='win32'?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=swiftshader','--enable-unsafe-swiftshader'])]});
 page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 watchdog=setTimeout(()=>page.close().catch(()=>{}),180000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
 await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>f.name==='loop'?0:raf(f);});
 await page.goto(pathToFileURL(path.join(repo,'index.html')).href,{waitUntil:'domcontentloaded',timeout:60000});stage='title';console.log('CHECK title');await page.waitForFunction(()=>window.G?.Game?.sceneName==='title'&&!G.Scenes.title.bootPending&&(!G.Loader||!G.Loader.shown()),null,{timeout:60000,polling:100});
 const H={
  init:async p=>p.evaluate(()=>{const sk={};G.SKILLS.forEach(k=>sk[k.id]=2);const s=G.Game.state=G.State.newGame({name:'원화 확인',given:'원화',surname:'확인',nation:'PT',job:'explorer',age:35,birth:{m:4,d:12},st:{str:70,int:75,mar:72,cha:75},sk,lg:G.LANGS.map(()=>3),diff:'normal'});Object.assign(s.settings,{res:.35,music:0,sound:0,sfx:0,autosave:false});s.flags.prologue=true;G.State.save=()=>false;G.State.saveAsync=async()=>({ok:false});G.Tutorial.active=()=>false;const c=G.CITY_DATA[0];s.loc={mode:'city',city:0,lon:c.lon,lat:c.lat};G.Game.scene?.exit?.();G.Game.scene=null;G.Game.sceneName='capture';G.UI.clearScreen();G.Game.showLayers(false,false,true);G.Game.setScene(G.Scenes.city.interior('harbor',c));}),
  info:async(p,tab)=>{await p.evaluate(tab=>{G.Info.open(tab);},tab);await p.locator('.win').waitFor();await p.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager'));await p.waitForFunction(()=>[...document.images].filter(i=>i.getBoundingClientRect().width&&(i.currentSrc||i.getAttribute('src'))).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000,polling:100});await p.locator('.toast').evaluateAll(es=>es.forEach(e=>e.click()));await p.waitForTimeout(600);},
  close:async p=>{await p.keyboard.press('Escape');await p.waitForTimeout(350);}
 };
 await H.init(page);
 stage='images';console.log('CHECK images');
 const loaded=await page.evaluate(async({jobs,mapping})=>{const rr=[];for(const j of jobs){const a=j.key.startsWith('relics/')?G.RELIC[j.id]:G.ITEM[j.id];if(!a)throw Error('물건 자료 없음: '+j.id);if(G.IMAGE_FILES[j.key]!==mapping[j.key])throw Error('그림 연결 불일치: '+j.id);const chain=j.key.startsWith('relics/')?G.Img.chain.relic(a):G.Img.chain.item(a),r=await G.Img.resolve(chain);if(!r||r.key!==j.key||r.img.naturalWidth!==256)throw Error('그림 해독 실패: '+j.id);rr.push({id:j.id,name:a.name,key:r.key,width:r.img.naturalWidth,height:r.img.naturalHeight});}return rr;},{jobs:plan.jobs,mapping});
 for(const typ of ['mount','fossil','fan','baby','relic']){
  stage=typ;console.log('CHECK '+typ);
  const jobs=plan.jobs.filter(j=>j.type===typ);
  if(typ==='baby'){const restored=['r_siberiancrane_baby','r_wolverine_baby','r_amurleopard_baby'];jobs.sort((a,b)=>Number(restored.includes(b.id))-Number(restored.includes(a.id)));}
  await page.evaluate(ids=>{const s=G.Game.state;s.player.items=[];s.player.equip={};for(const id of ids)G.R.addItem(id);},jobs.map(j=>j.id));
  await H.info(page,'items');
  await page.screenshot({path:path.join(out,'game-'+typ+'.png')});await H.close(page);
 }
 await page.goto(pathToFileURL(path.join(out,'index.html')).href);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000,polling:100});
 const gallery=await page.evaluate(()=>({images:document.images.length,sections:document.querySelectorAll('section').length}));
 if(gallery.images!==54)throw Error('갤러리 그림 누락');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'ui_checks.json'),JSON.stringify({fileProtocol:true,loaded:loaded.length,items:loaded,gallery,errors},null,2));console.log(JSON.stringify({loaded:loaded.length,gallery,errors}));
 }catch(e){const state=await page?.evaluate(()=>({body:document.body.innerText.slice(-4000),scene:window.G?.Game?.sceneName,boot:window.G?.Scenes?.title?.bootPending,loader:window.G?.Loader?.shown?.()})).catch(()=>null);await page?.screenshot({path:path.join(out,'ui-failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'ui_failure.json'),JSON.stringify({stage,state,error:e.message,errors},null,2));throw e;}finally{clearTimeout(watchdog);await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
