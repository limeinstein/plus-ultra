/* 새 인물 20명·첨부 누락 장면 133개를 실제 대화·도감·세계 소식으로 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/missing-event-art-20261110/runtime');
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/missing_event_art_20261110/prompts.json'),'utf8'));
const partial=process.argv.includes('--partial');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks={portraits:[],scenes:[],catalog:[]};fs.mkdirSync(OUT,{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.ColonVoy&&G.PiriMap&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(async()=>{
   const s=G.Game.state=G.State.newGame({name:'새 사건 원화 검토',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(s.settings,{res:.35,sound:0,music:0,autosave:false});s.date={y:1560,m:5,d:1};G.State.save=()=>{};
   await G.Game.ensureGeo();await G.Game.go('city',{cityId:8,load:true});if(G.Town?.active())G.Town.hidden(true);
   G.Game.setScene(G.Scenes.city.view(G.CITY_DATA[8]));G.Game.showLayers(false,false,true);
   const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.appendChild(style);
  });
  async function close(){await page.waitForTimeout(250);await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'));await page.evaluate(()=>window.__missingArtSay);}
  for(const row of plan.portraits){
   const result=await page.evaluate(async row=>{
    const m=row.id==='cv_mendez',sp=m?{name:G.MATE.cv_mendez.name,portrait:G.Art.mateSpec('cv_mendez'),half:G.Img.chain.mateHalf('cv_mendez')}:G.Hist.speaker(row.id);
    const face=G.Img.pick(G.Art.portraitKeys(sp.portrait)||[]),half=G.Img.pick(sp.half||[]);
    if(face!==row.key||half!==row.key+'_half')throw Error('인물 외형 선택: '+row.id+' '+face+' / '+half);
    const hashes=[];
    for(const [key,w,h] of [[face,448,448],[half,1024,1536]]){
     const im=await G.Img.load(key);if(!im||im.naturalWidth!==w||im.naturalHeight!==h)throw Error('원화 크기: '+key);
     if(!G.PORTRAIT_FACES[key])throw Error('얼굴 자리: '+key);
    }
    if(['cv_isabel','pr_leyla'].includes(row.id)&&sp.portrait.g!=='f')throw Error('여성 인물 대체 성별: '+row.id);
    window.__missingArtSpeaker={...sp,special:true};window.__missingArtSay=G.UI.say('새 인물의 무릎상과 얼굴 위치를 확인합니다.',window.__missingArtSpeaker);
    return {id:row.id,face,half};
   },row);
   await page.waitForSelector('.dlg-actor.active.tall img');await page.waitForFunction(()=>{const im=document.querySelector('.dlg-actor.active.tall img');return im?.complete&&im.naturalWidth;});
   await page.waitForTimeout(80);await page.screenshot({path:path.join(OUT,row.id+'-half.png')});await close();
   await page.evaluate(()=>{window.__missingArtSay=G.UI.say('같은 원화의 얼굴상을 확인합니다.',{...window.__missingArtSpeaker,noStand:true});});
   await page.waitForSelector('.dlg .pframe canvas[data-img]');await page.screenshot({path:path.join(OUT,row.id+'-face.png')});await close();
   checks.portraits.push(result);
  }
  // 합류 전 레일라와 합류 뒤 레일라·멘데스도 같은 초상을 고른다.
  checks.joined=await page.evaluate(()=>{
   const s=G.Game.state;const out=[];
   for(const id of ['leyla','cv_mendez']){s.mates.push({id,role:'none',loyal:85});out.push({id,face:G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(id))),half:G.Img.pick(G.Img.chain.mateHalf(id))});}
   return out;
  });
  assert.deepStrictEqual(checks.joined.map(x=>x.face),['portraits/legendary/leyla','portraits/mates/cv_mendez']);
  const rows=[...plan.scenes.filter(x=>!x.kind),...plan.relations,...plan.history];
  for(const row of rows){
   const exists=await page.evaluate(k=>G.Img.has(k),row.key);if(!exists&&partial)continue;assert(exists,'장면 없음: '+row.key);
   await page.evaluate(async row=>{await G.Img.load(row.key);window.__missingArtPic=G.FamEv.showPic({img:row.key,title:row.name});const wait=G.FamEv.pendingPic();if(wait)await wait;},row);
   await page.waitForFunction(key=>[...document.querySelectorAll('canvas[data-img],img')].some(el=>el.dataset.img===key||(el.src&&decodeURIComponent(el.src).includes(G.Img.file(key)))),row.key);
   await page.screenshot({path:path.join(OUT,row.id+'-scene.png')});
   await page.evaluate(async()=>{await window.__missingArtPic.stop();});
   checks.scenes.push({id:row.id,key:row.key,kind:row.kind||'story'});
  }
  if(!partial){
   checks.routes=await page.evaluate(async()=>{
    const s=G.Game.state,UI=G.UI,save={say:UI.say,ask:UI.ask,pic:G.FamEv.showPic,events:G.REL_EVENTS,history:G.HISTORY};
    const seen=[],stopped=[];UI.say=async()=>{};UI.ask=async()=> 'no';G.FamEv.showPic=o=>{seen.push(o.img);return {stop:async()=>stopped.push(o.img)};};
    let world,notice;
    try{
     const e=G.REL_EVENTS.find(e=>e.id==='ib_wed1497');G.REL_EVENTS=[{...e,need:null}];s.date={y:e.y,m:e.m,d:e.d};delete s.rel;G.Rel.daily();s.rel.pend=[e.id];await G.Rel.present();
     const other=save.events.find(e=>e.id==='cr_rhodes');G.REL_EVENTS=[{...other,need:null,who:null,ask:null}];s.date={y:other.y,m:other.m,d:other.d||1};delete s.rel;notice=G.Rel.daily().find(n=>n.img===other.img);
     const h=save.history[0];G.HISTORY=[h];s.history=0;s.date={y:h.y,m:h.m,d:h.d||1};G.REL_EVENTS=[];world=G.World.daily().find(n=>n.text===h.text);
    }finally{UI.say=save.say;UI.ask=save.ask;G.FamEv.showPic=save.pic;G.REL_EVENTS=save.events;G.HISTORY=save.history;}
    return {seen,stopped,world,notice};
   });
   assert.deepStrictEqual(checks.routes.seen,['legend-events/rel_ib_wed1497']);assert.deepStrictEqual(checks.routes.stopped,checks.routes.seen);
   assert(checks.routes.world?.icon?.src,'세계 소식 그림 알림');assert(checks.routes.notice?.icon?.src,'왕실·정세 그림 알림');
  }
  // 플레이어 도감의 점검용 전체 보기에서 실제 썸네일 경로를 확인한다. 본 것만 보이는 규칙은 유지한다.
  await page.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href+'?view=player&all=1#events',{waitUntil:'load',timeout:120000});
  await page.locator('[data-tab="events"]').click();
  const catalogs=await page.evaluate(()=>{
   const tabs={};G.CatalogExtras.register({tab:(id,n,o)=>(tabs[id]={id,items:[],...o}),people:{chips:[],items:[]},add:(t,it)=>t.items.push(it),portrait:sp=>G.Art.portraitCanvas(sp,160),num:String});
   return tabs.events.items.filter(x=>x.group==='relations'||x.group==='world'||/^legend-events\/(cv_|pr_)/.test(x.key)).map(x=>({name:x.name,key:x.key,group:x.group,exists:G.Img.has(x.key)}));
  });
  assert.strictEqual(catalogs.length,133);if(!partial)assert(catalogs.every(x=>x.exists),'도감 빈 그림 없음');checks.catalog=catalogs;
  for(const [query,key,id] of [['열일곱 척','legend-events/cv_muster','colon'],['책방 거리의 지도 장수','legend-events/pr_bazaar','piri'],['마누엘 1세와 이사벨 공주의 혼례','legend-events/rel_ib_wed1497','relations'],['오스만 제국의 메흐메트 2세','legend-events/world_00_20261110','world']]){
   if(partial&&!(await page.evaluate(key=>G.Img.has(key),key)))continue;
   await page.locator('#q').fill(query);await page.waitForFunction(key=>G.Img.status(key)==='ok'&&document.querySelector('.card canvas'),key,{timeout:30000});
   await page.screenshot({path:path.join(OUT,'catalog-'+id+'.png')});
  }
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,partial?'partial-checks.json':'checks.json'),JSON.stringify({...checks,errors,failed},null,2));
  console.log(JSON.stringify({portraits:checks.portraits.length,scenes:checks.scenes.length,catalog:checks.catalog.length,partial,errors,failed}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
