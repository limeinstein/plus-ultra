/* 중복 안내 제거·거리 조작 안내 석 달 경계·짧은 알림·지난 소식·대화 중 보류를 실제 게임에서 검사한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/town-notice-cleanup-20261125');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 let p;const errors=[],report={};
 try{
  p=await browser.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.clear();localStorage.setItem('pu.lang','ko');localStorage.setItem('pu.uiSize','normal');const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await p.evaluate(async()=>{
   await G.Game.ensureGeo();const s=G.Game.state=G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   s.flags.prologue=true;s.settings.res=.35;G.State.save=()=>{};G.UI.fade=async fn=>fn();G.Scenes.city.findInside=async()=>{};
   const say=G.UI.say;G.UI.say=async()=>{};window.__restoreSay=()=>{G.UI.say=say;};G.Game.go('city',{cityId:0,load:true});
  });
  await p.waitForFunction(()=>G.Game.sceneName==='city'&&!G.Scenes.city.isBusy()&&!G.UI.busy()&&!!document.querySelector('.towncatch'),null,{timeout:60000});
  await p.evaluate(()=>window.__restoreSay());
  assert.equal(await p.locator('#ui .caption').count(),0,'오른쪽 아래 중복 날짜·좌표 제거');
  const notices=await p.evaluate(()=>G.UI.recentNotices().map(n=>n.text));
  assert.equal(notices.some(n=>/^\d+년 \d+월 \d+일 — 리스본$/.test(n)),false,'불러오기 때 중복 날짜·도시 알림 제거');
  assert.equal(notices.some(n=>n.startsWith('거리 —')),true,'새 게임 거리 조작 안내');
  const boundaries=await p.evaluate(()=>{
   const s=G.Game.state,original={date:s.date,day:s.day,story:s.story,song:s.song,jhook:s.jhook,gold:s.gold},out=[];
   function check(name,start,date,story){
    delete s.story;delete s.song;delete s.jhook;delete s.gold;s.date=date;s.day=G.U.dayIndex(date)-G.U.dayIndex(start);
    if(story){s[story]={started:G.U.dateNum(start)};s.day+=20000;}
    out.push({name,visible:G.Town.controlsHintAvailable()});
   }
   check('첫날',{y:1480,m:5,d:1},{y:1480,m:5,d:1});
   check('석 달 하루 전',{y:1480,m:5,d:1},{y:1480,m:7,d:31});
   check('정확히 석 달',{y:1480,m:5,d:1},{y:1480,m:8,d:1});
   check('오래된 저장',{y:1480,m:5,d:1},{y:1481,m:5,d:1});
   for(const story of ['story','song','jhook','gold']){
    check(story+' 준비 세월 제외',{y:1545,m:6,d:1},{y:1545,m:8,d:31},story);
    check(story+' 석 달 뒤',{y:1545,m:6,d:1},{y:1545,m:9,d:1},story);
   }
   check('월말 경계 전',{y:1481,m:1,d:31},{y:1481,m:4,d:29});
   check('월말 경계',{y:1481,m:1,d:31},{y:1481,m:4,d:30});
   Object.assign(s,original);return out;
  });assert.deepEqual(boundaries.map(x=>x.visible),[true,true,false,false,true,false,true,false,true,false,true,false,true,false]);report.boundaries=boundaries;
  // 같은 게임에서는 중복 안내가 없고, 세 달 뒤 재접속을 흉내 내도 안내가 나오지 않는다.
  const hints=await p.evaluate(()=>{
   const s=G.Game.state,toast=G.UI.toast,seen=[];G.UI.toast=(t)=>seen.push(String(t));
   const oldDate=s.date,oldDay=s.day;
   try{G.Town.catcher(()=>{});const same=seen.length;
    s.date={y:1480,m:8,d:1};s.day=92;G.Town._toldKeysFor=null;G.Town.catcher(()=>{});const late=seen.length;
    s.date=oldDate;s.day=oldDay;G.Town.catcher(()=>{});return{same,late,newEarly:seen.length};
   }finally{G.UI.toast=toast;s.date=oldDate;s.day=oldDay;}
  });assert.deepEqual(hints,{same:0,late:0,newEarly:1});report.hints=hints;
  // 짧은 알림은 1.4초 뒤, 기존 8초 요청도 4초 안에 닫힘을 시작한다.
  await p.evaluate(()=>{document.querySelector('.toasts').replaceChildren();G.UI.toast('짧은 확인 소식','scroll');});
  const shortStart=Date.now();await p.waitForFunction(()=>![...document.querySelectorAll('.toast')].some(e=>e.textContent.includes('짧은 확인 소식')),{},{timeout:3000});
  report.shortMs=Date.now()-shortStart;assert.ok(report.shortMs<2400,'짧은 알림 실제 소멸');
  await p.evaluate(()=>G.UI.toast('오래 표시하도록 요청했던 시험 소식','scroll',8000));
  const longStart=Date.now();await p.waitForFunction(()=>![...document.querySelectorAll('.toast')].some(e=>e.textContent.includes('오래 표시하도록 요청했던 시험 소식')),{},{timeout:5000});
  report.longMs=Date.now()-longStart;assert.ok(report.longMs<4800,'8초 요청도 4초 상한');
  await p.evaluate(()=>G.UI.toast('누르면 빨리 닫히는 소식','scroll'));
  await p.evaluate(()=>{const t=[...document.querySelectorAll('.toast')].find(e=>e.textContent.includes('누르면 빨리 닫히는 소식'));t.addEventListener('click',()=>{window.__toastClickedAt=Date.now();});});
  await p.locator('.toast').filter({hasText:'누르면 빨리 닫히는 소식'}).click();
  await p.waitForFunction(()=>![...document.querySelectorAll('.toast')].some(e=>e.textContent.includes('누르면 빨리 닫히는 소식')));
  report.clickMs=await p.evaluate(()=>Date.now()-window.__toastClickedAt);assert.ok(report.clickMs<900,'누른 시점부터 퇴장 — 클릭 전 애니메이션 대기는 제외');
  // 빨리 사라져도 지난 소식에서 전문을 다시 읽을 수 있다.
  const history=await p.evaluate(()=>G.UI.recentNotices().map(n=>n.text));assert.ok(history.includes('짧은 확인 소식'));assert.ok(history.includes('오래 표시하도록 요청했던 시험 소식'));
  await p.locator('.hud .notice-btn').click();await p.waitForSelector('.notice-list');assert.match(await p.locator('.notice-list').innerText(),/짧은 확인 소식/);await p.keyboard.press('Escape');
  // 기존 대화 보호는 유지된다. 대화 중 접수한 소식은 원문 대신 나침반에 개수로 남는다.
  await p.evaluate(()=>{document.querySelector('.toasts').replaceChildren();window.__noticeTalk=G.UI.say('대화 중 알림 보호 시험입니다.',G.Scenes.mateSpeaker('first'));});
  await p.waitForSelector('.dlg');await p.evaluate(()=>G.UI.toast('대화 중 받은 증거 기록 시험','scroll'));
  assert.equal(await p.locator('.toast').filter({hasText:'대화 중 받은 증거 기록 시험'}).count(),0);
  assert.notEqual(await p.locator('.hud .notice-btn .nb-n').textContent(),'');
  await p.waitForTimeout(250);await p.keyboard.press('Escape');await p.waitForFunction(()=>!G.UI.busy());await p.waitForTimeout(4300);
  await p.evaluate(()=>{G.Game.state.date={y:1480,m:8,d:1};G.Game.state.day=92;G.Scenes.city.main();});
  await p.waitForFunction(()=>!G.UI.busy());await p.waitForTimeout(250);assert.equal(await p.locator('.caption').count(),0);
  assert.equal(await p.locator('.toast').filter({hasText:'거리 —'}).count(),0);
  await p.screenshot({path:path.join(OUT,'town-after-three-months.png')});
  await p.setViewportSize({width:960,height:540});await p.evaluate(()=>G.Game.setUiSize('max'));await p.waitForTimeout(250);
  await p.screenshot({path:path.join(OUT,'town-960-max.png')});
  assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({pass:true,...report},null,2));
 }catch(e){if(p){console.error(await p.evaluate(()=>document.querySelector('#ui').innerText.slice(-1500)).catch(()=>''));await p.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
