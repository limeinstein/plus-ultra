/* 혼인·가족 항해 업적 5종: 나이·달력 기한·실제 동승·항해일·세계일주·저장·실제 화면. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/family-voyage-achievements-20261116'));
const IDS=['casanova','uijawang','family_cruise','love_impossible','around_world_80'];
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const errors=[],failures=[];
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Achieve&&G.Wives&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async IDS=>{
   const A=G.Achieve,U=G.U,checks=[],played=[];
   function ok(v,msg){if(!v)throw Error(msg);checks.push(msg);}
   function fresh(){
    const s=G.Game.state=G.State.newGame({name:'업적 시험',nation:'PT',job:'explorer',age:20,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
    s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.achv={};s.achvPend=[];s.mates=[];
    G.ACHIEVEMENTS.filter(a=>!IDS.includes(a.id)).forEach(a=>s.achv[a.id]={d:14800101});
    s.player.born={y:1460,m:1,d:1};s.date={y:1480,m:1,d:1};s.day=0;return s;
   }
   function date(n){return {y:Math.floor(n/10000),m:Math.floor(n/100)%100,d:n%100};}
   function wives(first=14800101,last=14830101,born=14600101){
    const s=fresh(),p=s.player;p.born=date(born);s.date=date(last);s.day=U.dayIndex(s.date)-U.dayIndex(date(first));p.marriageDates={};p.wives2=[];
    for(let i=0;i<12;i++){
     const id='test_spouse_'+i;G.MAID[id]={id,name:'시험 부인 '+i,city:0,like:0};
     if(i===0)p.wife=id;else p.wives2.push({id,kind:'maid',city:0,house:true,aboard:false,wed:i===11?s.day:0,no:i+1});
     p.marriageDates[id]=i===11?last:first;
    }
    return s;
   }
   function progress(id){return A.progress(A.get(id),[]).done;}
   let s=wives();ok(G.Wives.maxSpouses()===12&&progress('casanova')&&!progress('uijawang'),'12명·본처 포함·20대 혼인·정확히 달력 3년');
   ok(!A.get('casanova').fame&&!A.get('casanova').gold&&A.get('casanova').title==='카사노바','지정하지 않은 수치 보상 없이 업적명 칭호');
   s.player.wives2.pop();ok(!progress('casanova'),'11명 미달성');
   s=wives();s.player.wives2[10].id=s.player.wives2[0].id;ok(!progress('casanova'),'중복 배우자로 정원 채우기 불가');
   s=wives(14800101,14830102);ok(!progress('casanova'),'3주년 하루 초과 미달성');
   s=wives(14800229,14830228);ok(progress('casanova'),'윤년 혼인일의 3주년은 해당 월 말일');
   s=wives(14800229,14830301);ok(!progress('casanova'),'윤년 3주년 하루 초과 미달성');
   s=wives(14790501,14810501,14600501);ok(!progress('casanova'),'첫 혼인이 만 19세면 제외');
   s=wives(14800501,14830501,14600501);ok(progress('casanova'),'만 20세 생일부터 포함');
   s=wives(14890430,14890430,14600501);ok(progress('casanova'),'만 29세 마지막 날 포함');
   s=wives(14890430,14900501,14600501);ok(!progress('casanova'),'마지막 혼인이 만 30세면 제외');
   s=wives(14800501,14820501,14100501);ok(progress('uijawang')&&!progress('casanova'),'만 70세 생일부터 의자왕');
   s=wives(14800430,14820501,14100501);ok(!progress('uijawang'),'69세 혼인이 하나라도 있으면 의자왕 제외');
   s=wives();s.player.g='f';ok(!progress('casanova'),'여성 플레이어 제외');delete s.player.g;s.player.heir={sex:'f'};ok(!progress('casanova'),'성별 필드가 없는 딸 후계자도 제외');
   s=wives();delete s.player.marriageDates;s.wedEver={};[s.player.wife,...s.player.wives2.map(w=>w.id)].forEach(id=>s.wedEver[id]=U.dateNum(s.date));
   A.wedEver();ok(!progress('casanova'),'옛 저장의 보충용 wedEver 날짜는 혼인 기한에 쓰지 않음');
   s.player.marriageDates={[s.player.wife]:14800101};ok(progress('casanova'),'실제 경과일 wed가 남은 둘째 부인은 날짜 복구');
   s=wives();const gold=s.player.gold,fame=s.player.fame;ok(A.check().some(a=>a.id==='casanova')&&A.titles().includes('카사노바'),'한 번의 달성·칭호 등록');
   ok(!A.check().some(a=>a.id==='casanova')&&s.player.gold===gold&&s.player.fame===fame,'재검사 중복 지급·추가 수치 없음');
   G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;ok(s.player.marriageDates.test_spouse_0===14800101&&A.done('casanova')&&!A.check().some(a=>a.id==='casanova'),'실제 저장 복원·혼인일·달성 유지');
   s=wives();const beforeScene=A.scene,confirm=G.UI.confirm,say=G.UI.say,ask=G.UI.ask,alert=G.UI.alert,outcome=G.Outcome.show,wedding=G.FamEv.wedding,swap=G.MaidSwap.wed,hud=G.Game.cityHud;
   A.scene=async a=>played.push(a.id);G.UI.confirm=async()=>true;G.UI.say=async()=>{};G.UI.alert=async()=>{};G.Outcome.show=async()=>{};G.FamEv.wedding=async()=>false;G.MaidSwap.wed=()=>{};G.Game.cityHud=()=>{};
   try{
    const last=s.player.wives2.pop();delete s.player.marriageDates[last.id];s.player.items=[{id:'ring',n:1}];
    await G.Wives.proposeMaid(G.CITY_DATA[0],G.MAID[last.id],async()=>{});
    ok(A.done('casanova')&&s.player.marriageDates[last.id]===14830101&&played.includes('casanova'),'실제 12번째 여급 혼인 직후 날짜·업적·장면');
    s=fresh();s.player.items=[{id:'ring',n:1}];G.UI.ask=async()=> 'wed';
    const mainMaid=G.MAID[Object.keys(G.MAID).find(id=>!id.startsWith('test_'))];s.maids[mainMaid.id]={aff:100,met:1};
    await G.Scenes.city.B.tavern.maid(G.CITY_DATA[mainMaid.city],mainMaid);
    ok(s.player.wife===mainMaid.id&&s.player.marriageDates[mainMaid.id]===14800101,'실제 술집 본처 청혼 경로의 날짜 기록');
    s=fresh();s.player.wife='test_spouse_0';s.player.marriageDates={};await A.afterWed('test_spouse_0');
    ok(s.player.marriageDates.test_spouse_0===14800101,'본처 혼인 후 정확한 날짜 기록');
    const old=s.player;s.player={...old,born:{y:1460,m:1,d:1},generation:2,wife:null,wives2:[]};delete s.player.marriageDates;
    ok(!progress('casanova')&&!progress('uijawang'),'새 제독에게 선대 혼인 기록을 적용하지 않음');
   }finally{A.scene=beforeScene;G.UI.confirm=confirm;G.UI.say=say;G.UI.ask=ask;G.UI.alert=alert;G.Outcome.show=outcome;G.FamEv.wedding=wedding;G.MaidSwap.wed=swap;G.Game.cityHud=hud;}
   function party(){const s=fresh();s.loc.mode='sea';s.player.wife='test_spouse_0';s.player.wifeAboard=true;return s;}
   function day(sea=true){const s=G.Game.state;s.day++;s.date=U.addDays(s.date,1);s.loc.mode=sea?'sea':'city';A.daily();}
   s=party();s.loc.mode='city';A.check();ok(!A.done('love_impossible'),'항구에 편성만 해 두면 사랑 업적 미달성');
   s.loc.mode='sea';A.onVoyageStart(0);ok(A.done('love_impossible')&&s.achvPend.includes('love_impossible'),'현재 아내만 실제 동승한 출항에서 달성');
   s=party();s.mates=[{id:'test_outsider'}];G.MATE.test_outsider={id:'test_outsider',g:'f'};A.onVoyageStart(0);ok(!A.done('love_impossible'),'미혼 여성 동료는 아내로 세지 않음');
   s=party();s.player.kids=[{name:'아이',aboard:true}];A.onVoyageStart(0);ok(!A.done('love_impossible')&&A.sailingParty().every(r=>r.family),'아이 동승은 가족 편성이며 아내 전원 편성은 아님');
   s=party();s.player.wifeAboard=false;A.onVoyageStart(0);ok(!A.done('love_impossible')&&A.sailingParty().length===0,'집에 있는 아내·빈 명단 제외');
   s=party();s.player.wife='test_outsider';G.MATE.test_outsider.g='m';A.onVoyageStart(0);ok(!A.done('love_impossible')&&A.sailingParty().every(r=>r.family),'남성 배우자는 가족이며 아내로 세지 않음');G.MATE.test_outsider.g='f';
   s=party();s.player.wifeAboard=false;s.player.wives2=[{id:'lost_wife',kind:'mate',aboard:true}];A.onVoyageStart(0);ok(!A.done('love_impossible'),'부하 명단에서 사라진 아내의 낡은 동승 표식 제외');
   s=party();s.player.kids=[{name:'아이',aboard:true}];A.onVoyageStart(0);
   for(let i=0;i<89;i++)day();ok(!A.done('family_cruise')&&s.player.voyageAchievements.familyDays===89,'가족 항해 89일 미달성');
   for(let i=0;i<4;i++)day(false);ok(s.player.voyageAchievements.familyDays===89,'중간 기항일은 가족 항해일에 더하지 않음');
   G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;day();ok(A.done('family_cruise')&&s.player.voyageAchievements.familyBest===90,'저장 복원 뒤 실제 90번째 항해일 달성');
   const pend=s.achvPend.filter(id=>id==='family_cruise').length;A.daily();ok(s.player.voyageAchievements.familyDays===90&&s.achvPend.filter(id=>id==='family_cruise').length===pend,'같은 날 재검사로 날짜·대기열 증가 없음');
   s=party();s.player.kids=[{name:'아이',aboard:true}];A.onVoyageStart(0);for(let i=0;i<50;i++)day();s.mates=[{id:'test_outsider'}];day();ok(s.player.voyageAchievements.familyDays===0,'가족 외 동료와 항해한 날 연속 기록 초기화');
   s.mates=[];day();ok(s.player.voyageAchievements.familyDays===1&&!A.done('family_cruise'),'가족 편성으로 돌아오면 새 항해일부터 시작');
   s=party();s.player.wifeAboard=false;s.player.kids=[{mateId:'kid_mate'}];s.player.siblings=[{mateId:'sib_mate'}];
   G.MATE.cousin={kin:'cousin'};G.MATE.uncle={kin:'uncle'};G.MATE.friend={kin:'friend'};s.mates=['kid_mate','sib_mate','cousin','uncle'].map(id=>({id}));
   ok(A.sailingParty().every(r=>r.family),'성인 자식·형제·사촌·외삼촌은 가족');s.mates.push({id:'friend'});ok(!A.sailingParty().every(r=>r.family),'소꿉친구는 친족으로 세지 않음');
   s=party();s.day=200;A.daily();ok(s.player.voyageAchievements.familyDays===0,'옛 저장의 지나간 항해일 소급 없음');
   for(const days of [79,80,81]){
    s=fresh();s.circ={from:0,cum:360,done:true,started:5};s.day=5+days;A.onCircumReturn(G.CITY_DATA[0]);ok(A.done('around_world_80')===(days<=80),'세계일주 기한 '+days+'일');
   }
   for(const wrong of ['port','start','distance','zero']){
    s=fresh();s.circ={from:0,cum:360,done:true,started:0};s.day=80;
    if(wrong==='start')delete s.circ.started;if(wrong==='distance')s.circ.cum=359;if(wrong==='zero')s.day=0;
    A.onCircumReturn(G.CITY_DATA[wrong==='port'?1:0]);ok(!A.done('around_world_80'),'세계일주 오판 방지: '+wrong);
   }
   s=party();A.onVoyageStart(0);s.day=80;G.Disc.trackCirc(-360);s.loc.mode='city';s.loc.city=0;
   const find=G.Disc.find,fest=G.Fest.begin;G.Disc.find=async()=>{};G.Fest.begin=async()=>{};
   try{await G.Sponsor.circumReturn(G.CITY_DATA[0]);ok(A.done('around_world_80')&&s.circ.reported,'실제 세계일주 추적·모항 귀환 처리 연결');}finally{G.Disc.find=find;G.Fest.begin=fest;}
   await G.Game.ensureGeo();s=fresh();s.player.wife=Object.keys(G.MAID).find(id=>!id.startsWith('test_'));s.player.wifeAboard=true;
   G.Game.go('sea',{depart:0});
   ok(s.loc.mode==='sea'&&s.circ.started===s.day&&A.done('love_impossible'),'실제 바다 장면 출항에서 시각·아내 편성 업적');
   G.Game.newDay();ok(s.player.voyageAchievements.familyDays===1,'실제 하루 경과·월드 처리에서 가족 항해일 증가');
   G.Game.go('title');
   const el=document.createElement('div');A.page(el);ok(IDS.every(id=>el.textContent.includes(A.get(id).name)),'수첩의 다섯 업적·진행 조건');
   for(const id of IDS){const im=await G.Img.load(G.ACHV_EVENTS[id].pic);ok(im&&im.naturalWidth===1881&&im.naturalHeight===836,'전용 업적샷: '+id);}
   if(G.Loader)await G.Loader.hide();G.UI.clearScreen();window.__sceneA=A.scene;
   return {checks,ids:IDS};
  },IDS);
  for(const id of IDS){
   await page.evaluate(id=>{window.__sceneDone=false;G.Achieve.scene(G.Achieve.get(id)).then(()=>window.__sceneDone=true);},id);
   await page.waitForFunction(id=>{const im=document.querySelector('.famscene.on img');return im&&im.complete&&im.src.includes('/'+id+'.');},id,{timeout:30000});
   await page.screenshot({path:path.join(OUT,id+'-event.png')});let reward=false;
   for(let i=0;i<25;i++){
    if(await page.evaluate(()=>window.__sceneDone))break;
    const btn=page.locator('.modal-back button.navy').last();
    if(await btn.isVisible()){
     const text=await page.locator('.modal-back').last().innerText();if(text.includes('칭호')){assert(!text.includes('명성 +0'));reward=true;await page.screenshot({path:path.join(OUT,id+'-reward.png')});}await btn.click();
    }else await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
   }
   await page.waitForFunction(()=>window.__sceneDone,null,{timeout:8000});assert(reward,id+' 칭호 창');
  }
  await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#achievements',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.ACHV_EVENTS&&G.Img,null,{timeout:90000});
  for(const [id,name] of [['casanova','카사노바'],['uijawang','의자왕'],['family_cruise','가족 유람단'],['love_impossible','사랑은 불가능의 영역'],['around_world_80','80일간의 세계일주']]){
   await page.locator('#q').fill(name);await page.locator('#grid .card').filter({hasText:name}).first().click();
   assert((await page.locator('#detail').innerText()).includes('칭호'));await page.screenshot({path:path.join(OUT,id+'-catalog.png')});
   await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...report,errors,failures},null,2));
  console.log('통과 — 혼인 나이·3년·실제 혼인·가족 90항해일·아내 편성·세계일주 80일·저장·업적샷 5종·수첩·도감·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
