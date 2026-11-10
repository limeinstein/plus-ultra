/* 옛이야기 인물의 대화·합류와 사건 장면의 도감 연결 검사. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.FOLK_ART_SHOTS || path.join(ROOT,'artifacts/folktales-art-20261110/runtime');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const checks={portraits:[],scenes:[]},errors=[],failed=[];fs.mkdirSync(OUT,{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Folktales&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(async()=>{
   G.Game.state=G.State.newGame({name:'옛이야기 그림 검토',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(G.Game.state.settings,{res:.35,sound:0,music:0,autosave:false});G.State.save=()=>{};
   await G.Game.ensureGeo();await G.Game.go('city',{cityId:8,load:true});if(G.Town?.active())G.Town.hidden(true);
   G.Game.setScene(G.Scenes.city.view(G.CITY_DATA[8]));G.Game.showLayers(false,false,true);
   const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.appendChild(style);
  });
  async function close(){await page.waitForTimeout(200);await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'));await page.evaluate(()=>window.__folkSay);}
  const plan=await page.evaluate(()=>({
   portraits:G.FOLK_FIGS.map(id=>{
    const figure=G.HIST_FIG[id];
    return {id,name:figure.name,key:figure.face || 'portraits/history/'+id};
   }),
   scenes:[['ft_bat_contest','노팅엄의 활쏘기 대회'],['ft_bat_sherwood','셔우드 숲의 잔치'],
    ['ft_forest','문 없는 탑'],['ft_altdorf','알트도르프 광장의 모자'],['ft_storm','루체른 호수의 폭풍']]
    .map(([id,name])=>({id,name,key:'legend-events/'+id}))
  }));
  for(const row of plan.portraits){
   checks.portraits.push(await page.evaluate(async row=>{
    const sp=G.Hist.speaker(row.id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)||[]),half=G.Img.pick(sp.half||[]);
    if(face!==row.key||half!==row.key+'_half')throw Error('초상 선택: '+row.id+' '+face+' / '+half);
    for(const [key,w,h] of [[face,448,448],[half,1024,1536]]){const im=await G.Img.load(key);if(!im||im.naturalWidth!==w||im.naturalHeight!==h)throw Error('크기: '+key);if(!G.PORTRAIT_FACES[key])throw Error('얼굴 좌표: '+key);}
    if(['ft_cathy','ft_rapunzel','ft_gothel'].includes(row.id)&&sp.portrait.g!=='f')throw Error('성별: '+row.id);
    window.__folkSpeaker={...sp,special:true};window.__folkSay=G.UI.say('새 옛이야기 인물의 무릎상을 확인합니다.',window.__folkSpeaker);
    return {id:row.id,name:row.name,face,half};
   },row));
   await page.waitForSelector('.dlg-actor.active.tall img');await page.waitForFunction(()=>{const im=document.querySelector('.dlg-actor.active.tall img');return im?.complete&&im.naturalWidth;});
   await page.screenshot({path:path.join(OUT,row.id+'-half.png')});await close();
   await page.evaluate(()=>{window.__folkSay=G.UI.say('같은 인물의 얼굴상을 확인합니다.',{...window.__folkSpeaker,noStand:true});});
   await page.waitForSelector('.dlg .pframe canvas[data-img]');await page.screenshot({path:path.join(OUT,row.id+'-face.png')});await close();
  }
  for(const row of plan.scenes){
   await page.evaluate(async row=>{const im=await G.Img.load(row.key);if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('장면 크기: '+row.key);window.__folkPic=G.FamEv.showPic({img:row.key,title:row.name});const wait=G.FamEv.pendingPic();if(wait)await wait;},row);
   await page.waitForFunction(key=>Array.from(document.querySelectorAll('canvas[data-img],img')).some(el=>el.dataset.img===key||(el.src&&decodeURIComponent(el.src).includes(G.Img.file(key)))),row.key);
   await page.screenshot({path:path.join(OUT,row.id+'-scene.png')});await page.evaluate(async()=>{await window.__folkPic.stop();});checks.scenes.push({id:row.id,key:row.key});
  }
  // 실제 이야기의 전령·나무꾼·수사와 합류 전후 네 동료를 함께 확인한다.
  checks.routes=await page.evaluate(async()=>{
   const original={say:G.UI.say,ask:G.UI.ask,toast:G.UI.toast,pic:G.FamEv.showPic,battle:G.Scenes.land.landBattle};
   const speakers={},scenes=[],joins=[];let picks=[];
   G.UI.say=async(t,sp)=>{if(sp?.name&&sp.portrait)speakers[sp.name]={face:G.Img.pick(G.Art.portraitKeys(sp.portrait)||[]),half:G.Img.pick(sp.half||[])};};
   G.UI.ask=async(q,opts)=>{const want=picks.shift();return (opts.find(x=>x.value===want&&!x.dis)||opts[opts.length-1]).value;};G.UI.toast=()=>{};
   G.FamEv.showPic=o=>{scenes.push(o.img);return {stop:async()=>{}};};G.Scenes.land.landBattle=async()=> 'win';
   function fresh(city){const sk={};G.SKILLS.forEach(x=>sk[x.id]=3);const s=G.Game.state=G.State.newGame({name:'검토 선장',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});s.mates=[];const c=G.CITY_DATA[city];s.loc={mode:'city',city,lon:c.lon,lat:c.lat};G.Fame.add('ex',3000);return s;}
   function joined(ids){ids.forEach(id=>{if(!G.Game.state.mates.some(m=>m.id===id))throw Error('동료 합류: '+id);const sp=G.Legend.speaker(id);joins.push({id,face:G.Img.pick(G.Art.portraitKeys(sp.portrait)||[]),half:G.Img.pick(sp.half||[])});});}
   try{fresh(41);await G.Folktales.robinHint();picks=['help','toll','join'];await G.Folktales.robin();joined(['bat_hood','cathy']);fresh(53);picks=['ladder'];await G.Folktales.rapunzel();joined(['rapunzel']);fresh(55);picks=['wind','rock'];await G.Folktales.tell();joined(['tell']);}finally{G.UI.say=original.say;G.UI.ask=original.ask;G.UI.toast=original.toast;G.FamEv.showPic=original.pic;G.Scenes.land.landBattle=original.battle;}
   return {speakers,scenes,joins};
  });
  const expectedScenes=plan.scenes.map(row=>row.key).sort();
  assert.deepStrictEqual([...new Set(checks.routes.scenes)].sort(),expectedScenes);
  for(const row of plan.portraits){assert.strictEqual(checks.routes.speakers[row.name]?.face,row.key,'이야기 초상: '+row.name);}
  for(const j of checks.routes.joins){assert.strictEqual(j.face,'portraits/legendary/'+j.id);assert.strictEqual(j.half,j.face+'_half');}
  await page.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href+'?view=player&all=1#events',{waitUntil:'domcontentloaded',timeout:120000});
  checks.catalog=await page.evaluate(()=>({figures:G.FOLK_FIGS.map(id=>({id,face:G.Img.pick(G.Hist.faceKeys(id))})),scenes:G.CATALOG_SCENES.filter(x=>/^legend-events\/ft_/.test(x.key)).map(x=>({key:x.key,exists:G.Img.has(x.key)}))}));
  assert.strictEqual(checks.catalog.figures.length,plan.portraits.length);
  assert.deepStrictEqual(checks.catalog.scenes.map(row=>row.key).sort(),expectedScenes);
  assert(checks.catalog.scenes.every(x=>x.exists));
  await page.locator('[data-tab="events"]').click();await page.locator('#q').fill('노팅엄의 활쏘기 대회');await page.waitForFunction(()=>G.Img.status('legend-events/ft_bat_contest')==='ok'&&document.querySelector('.card canvas'));await page.screenshot({path:path.join(OUT,'catalog-events.png')});
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({...checks,errors,failed},null,2));console.log(JSON.stringify({portraits:checks.portraits.length,scenes:checks.scenes.length,joined:checks.routes.joins.length,catalog:checks.catalog.figures.length,errors,failed}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
