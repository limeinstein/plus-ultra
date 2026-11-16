/* 해방자: 현재 편성·출신 분류·한 번의 보상·저장·고용/해고·업적샷·수첩·도감. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/liberator-achievement-20261116'));
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const errors=[],failures=[];
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage();
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});};
  watch(page);
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Achieve&&G.Game.sceneName==='title',null,{timeout:120000});
  assert.deepEqual(errors,[]);
  const report=await page.evaluate(async()=>{
   const A=G.Achieve,a=A.get('liberator'),checks=[];
   function check(ok,msg){if(!ok)throw Error(msg);checks.push(msg);}
   function fresh(otherDone=true){
    const s=G.Game.state=G.State.newGame({name:'해방자 시험',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
    s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.date.y=1600;
    s.mates=[];s.wander={seq:0,gen:G.Wander.genOf(s.date.y),defs:{}};s.achv={};s.achvPend=[];
    if(otherDone)G.ACHIEVEMENTS.filter(x=>x.id!=='liberator').forEach(x=>s.achv[x.id]={d:14800101});
    return s;
   }
   function put(d){
    const s=G.Game.state,index=G.MATES.findIndex(x=>x.id===d.id);
    if(index>=0)G.MATES[index]=d;else G.MATES.push(d);
    G.MATE[d.id]=d;G.MATE_RANGE[d.id]={zones:d.zones||[],home:d.home};if(d.wd)s.wander.defs[d.id]=d;
    return {id:d.id,role:'none',loyal:100,joinedDay:s.day,items:[]};
   }
   function wander(nat='AF',g='m'){return put(G.Wander.make({nat,g,type:'nav'}));}
   function progress(){return A.progress(a,[]);}
   let s=fresh();check(a&&a.fame===2000&&a.notoriety===-20&&!a.gold,'명성 2000·악명 -20·추가 금화 없음');
   s.fleet.crew=200;check(!progress().done&&!A.onCrewComposition().length,'빈 동료 명단·일반 선원 200명 제외');
   let af=wander(),foreign=wander('EN'),north=wander('AR');
   check(G.MATE[af.id].blackAfrican&&A.isBlackAfrican(af.id)&&!A.isBlackAfrican(north.id),'서아프리카 생성 표식·북아프리카 별도');
   const swCity=G.CITY_DATA.find(c=>c.name==='잔지바르'),sw=put(G.RegionFolk.make('eafrica',swCity.id));
   check(G.MATE[sw.id].nat==='SW'&&G.MATE[sw.id].blackAfrican&&A.isBlackAfrican(sw.id),'스와힐리 고장 동료 포함');
   const folk=put(G.FolkJoin.make(G.DISC.folk_yoruba,'m'));
   check(G.MATE[folk.id].blackAfrican&&A.isBlackAfrican(folk.id),'아프리카 민족 합류 동료 포함');
   const amazon=put(G.FolkJoin.make(G.DISC.folk_tuareg,'m'));
   check(!A.isBlackAfrican(amazon.id),'다른 아프리카 출신을 무조건 흑인으로 판정하지 않음');
   Object.assign(G.MATE[foreign.id],{style:'af',face:'portraits/mates/african-windsalt/af21',lg:{10:3},reg:[3],zones:['wafrica']});
   check(!A.isBlackAfrican(foreign.id),'초상·복장·언어·활동 지역으로 오인하지 않음');
   s.crewEver={[af.id]:16000101};s.mates=[foreign];check(!progress().done,'과거 고용 이력 제외');
   s.mates=[af,foreign];check(!progress().done&&!A.onCrewComposition().length,'한 명이라도 다른 출신이면 미달성');
   s.mates=[af,{id:'missing_mate'}];check(!progress().done,'정의가 없는 동료도 전원 조건에서 제외하지 않음');
   const woman=wander('AF','f');s.mates=[af,sw,folk,woman];
   check(progress().done&&progress().have===4&&progress().need===4,'현재 동료 전원·여성 동료도 같은 출신 판정');
   s.player.notoriety=85;const before=G.Fame.get(),gold=s.player.gold;
   check(A.onCrewComposition().length===1&&A.done('liberator')&&G.Fame.get()===before+2000&&s.player.notoriety===65&&s.player.gold===gold,'정확한 명성·악명 보상');
   A.onCrewComposition();A.check();check(G.Fame.get()===before+2000&&s.player.notoriety===65&&s.achvPend.filter(x=>x==='liberator').length===1,'반복 검사·장면 대기열 중복 방지');
   G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;G.Wander.apply();
   A.check();A.onCrewComposition();check(A.done('liberator')&&s.player.fame===before+2000&&s.player.notoriety===65,'실제 저장 복원 뒤 재지급 없음');
   s.mates=[put(G.Wander.make({nat:'EN',g:'m',type:'nav'}))];check(A.done('liberator'),'달성 뒤 편성이 바뀌어도 업적 유지');
   for(const noto of [0,7,20]){
    s=fresh();s.mates=[wander()];s.player.notoriety=noto;A.onCrewComposition();
    check(s.player.notoriety===0&&s.player.fame===2000,'악명 하한 0: '+noto);
   }
   s=fresh(false);s.mates=[wander()];A.onCrewComposition();A.check();
   check(s.player.fame===2000&&s.achvPend.filter(x=>x==='liberator').length===1,'명성 이정표 연쇄 검사에도 한 번만 지급');
   s=fresh();af=wander();delete G.MATE[af.id].blackAfrican;s.mates=[af];
   const legacyFolk=put(G.FolkJoin.make(G.DISC.folk_akan,'m'));delete G.MATE[legacyFolk.id].blackAfrican;s.mates.push(legacyFolk);
   check(progress().done,'새 표식 없는 옛 저장은 기존 국적·민족 자료로 판정');
   A.daily();check(A.done('liberator')&&s.achvPend.includes('liberator'),'옛 저장 첫 하루도 전용 업적샷 대기');
   const played=[],scene=A.scene,confirm=G.UI.confirm,say=G.UI.say,hud=G.Game.refreshHud;
   A.scene=async x=>{played.push(x.id);};G.UI.confirm=async()=>true;G.UI.say=async()=>{};G.Game.refreshHud=()=>{};
   try{
    s=fresh();af=wander();s.mates=[af];await A.afterHire(af.id);
    check(A.done('liberator')&&played.filter(id=>id==='liberator').length===1,'실제 고용 뒤 업적·장면');
    s=fresh();af=wander();foreign=wander('EN');foreign.devoted=true;s.mates=[af,foreign];played.length=0;
    check(await G.MateDismiss.fire(foreign,G.CITY_DATA[0]),'실제 해고 성공');
    check(s.mates.length===1&&A.done('liberator')&&played.includes('liberator'),'마지막 다른 출신을 해고하면 즉시 달성');
   }finally{A.scene=scene;G.UI.confirm=confirm;G.UI.say=say;G.Game.refreshHud=hud;}
   s=fresh();s.mates=[wander()];s.player.notoriety=50;A.onCrewComposition();
   const el=document.createElement('div');A.page(el);
   check(el.textContent.includes('해방자')&&el.textContent.includes('악명 -20'),'수첩에 조건·악명 보상');
   const im=await G.Img.load(G.ACHV_EVENTS.liberator.pic);
   check(im&&im.naturalWidth===1881&&im.naturalHeight===836,'전용 이벤트샷 실물 규격');
   if(G.Loader)await G.Loader.hide();G.UI.clearScreen();
   return {checks,award:{fame:a.fame,notoriety:a.notoriety},eligibleSources:['AF','SW','folk'],image:G.ACHV_EVENTS.liberator.pic};
  });
  await page.evaluate(()=>{window.__liberatorDone=false;window.__liberatorScene=G.Achieve.playPending().then(()=>window.__liberatorDone=true);});
  await page.waitForFunction(()=>{const im=document.querySelector('.famscene.on img');return im&&im.complete&&im.naturalWidth===1881&&im.src.includes('/liberator.');},null,{timeout:30000});
  assert.equal(await page.locator('.dlg-actor.active.tall').count(),0);
  await page.screenshot({path:path.join(OUT,'event-runtime.png')});
  let reward=false;
  for(let i=0;i<24;i++){
   if(await page.evaluate(()=>window.__liberatorDone))break;
   const btn=page.locator('.modal-back button.navy').last();
   if(await btn.isVisible()){
    const text=await page.locator('.modal-back').last().innerText();
    if(text.includes('해방자')){assert(text.includes('2,000')&&text.includes('악명 -20'));reward=true;await page.screenshot({path:path.join(OUT,'reward-runtime.png')});}
    await btn.click();
   }else await page.keyboard.press('Enter');
   await page.waitForTimeout(220);
  }
  await page.waitForFunction(()=>window.__liberatorDone,null,{timeout:8000});
  assert(reward);assert.equal(await page.locator('.famscene').count(),0);
  await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#achievements',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.ACHV_EVENTS&&G.Img,null,{timeout:90000});
  await page.locator('#q').fill('해방자');const card=page.locator('#grid .card').filter({hasText:'해방자'});await card.click();
  const detail=await page.locator('#detail').innerText();assert(detail.includes('아프리카 흑인')&&detail.includes('2,000')&&detail.includes('-20'));
  await page.screenshot({path:path.join(OUT,'catalog-runtime.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...report,reward,errors,failures},null,2));
  console.log('통과 — 현재 편성·빈 명단/혼성 제외·출신 자료/옛 저장·고용/해고·명성 +2000/악명 -20 일회 보상·이벤트샷·수첩·도감·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
