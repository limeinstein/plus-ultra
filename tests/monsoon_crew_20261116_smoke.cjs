/* 인도양 여성 철새 30명: 출신·특기·언어·40년 추첨·고용/혼인 제외·실제 초상과 모집 화면. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/monsoon-crew-20261116')),rulesOnly=process.argv.includes('--rules-only');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const errors=[],failures=[],page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.MonsoonCrew&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async rulesOnly=>{
   const checks=[],C=G.MonsoonCrew,crew=G.MATES.filter(m=>m.monsoonRotation),ids=C.ids,T=G.Scenes.city.B.tavern;
   function ok(v,msg){if(!v)throw Error(msg);checks.push(msg);}
   const params={name:'계절풍 시험',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'};
   function fresh(seed=817,y=1498){const s=G.Game.state=G.State.newGame(params);s.seed=seed;s.date={y,m:5,d:20};s.disc.indiaroute={me:true,found:14980520};s.disc.capegood={me:true,found:14880203};s.player.fame=100000;s.player.gold=500000;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.flags.prologue=true;return s;}
   const active=y=>crew.filter(m=>G.Frontier.mateReady(m,y)).map(m=>m.id);
   ok(crew.length===30&&new Set(ids).size===30&&crew.every(m=>m.g==='f'&&m.portraitAge>=25),'고유한 성인 여성 30명');
   const nations={};crew.forEach(m=>nations[m.nat]=(nations[m.nat]||0)+1);ok(JSON.stringify(nations)===JSON.stringify({IN:18,LK:4,BD:2,PK:2,MV:2,OM:1,ID:1}),'인도 18명·인도양 6개국 12명');
   ok(crew.every(m=>Object.keys(m.sk).length>=3&&Object.keys(m.sk).length<=6&&Object.keys(m.lg).length>=3&&Object.keys(m.lg).length<=5),'전원 특기 3~6개·언어 3~5개');
   const ports=[125,148,150,151,152,154,155,157,166];
   ok(crew.every(m=>G.MateMove.range(m.id).every(id=>ports.includes(id)&&G.CITY_DATA[id].port)&&G.MateMove.range(m.id).includes(m.home)),'활동 항구 인도양 범위·고향 유효');
   ok(crew.every(m=>G.Captains.natOfMate(m)===(m.nat==='OM'?'OM':m.nat==='ID'?'MK':'GJ')),'독립 선장 문화권 대응');
   ok(!G.Wander.facePool('in','f','nav','IN').some(key=>crew.some(m=>m.face===key)),'일반 철새와 전용 얼굴 분리');
   let s=fresh();delete s.disc.indiaroute;delete s.disc.capegood;
   ok(active(1498).length===0&&!s.monsoonCrew,'인도항로 발견 전 미등장·추첨 없음');
   const africans=G.MATES.filter(m=>m.africanRotation),A=G.AfricanCrew;
   const aa=()=>africans.filter(m=>G.Frontier.mateReady(m)).map(m=>m.id);
   ok(aa().length===0&&!s.africanCrew,'희망봉 발견 전 아프리카 미등장');
   s.disc.capegood={me:true,found:14980520};ok(aa().length===3&&active(1498).length===0,'희망봉과 인도항로 독립 개방');
   ok(africans.length===30&&new Set(A.ids).size===30&&africans.every(m=>m.g==='m'&&m.blackAfrican&&G.Achieve.isBlackAfrican(m.id)),'아프리카 남성 30명·해방자 출신 연결');
   const an={};africans.forEach(m=>an[m.nat]=(an[m.nat]||0)+1);ok(Object.keys(an).length===10&&Object.values(an).every(n=>n===3),'아프리카 10개국 각 3명');
   ok(africans.every(m=>Object.keys(m.sk).length>=3&&Object.keys(m.sk).length<=6&&Object.keys(m.lg).length>=3&&Object.keys(m.lg).length<=5),'아프리카 특기 3~6·언어 3~5');
   ok(africans.every(m=>G.MateMove.range(m.id).every(cid=>G.CITY_DATA[cid].region===3&&G.CITY_DATA[cid].port)&&G.MateMove.range(m.id).includes(m.home)),'아프리카 항구 제한·고향 유효');
   const orders=[];
   for(const g of [{C,tag:'monsoonRotation',key:'monsoonCrew',gate:'indiaroute',at:{y:1498,m:5,d:20}}, {C:A,tag:'africanRotation',key:'africanCrew',gate:'capegood',at:{y:1488,m:2,d:3}}]){
    const pop=()=>G.MATES.filter(m=>m[g.tag]&&G.Frontier.mateReady(m)).map(m=>m.id), name=g.key;
    s=fresh();s.date={...g.at,d:g.at.d-1};ok(pop().length===0,name+' 발견일 전날');s.date={...g.at};const first=pop();ok(first.length===3,name+' 발견일 3명');
    s.date={...g.at,y:g.at.y+5,d:g.at.d-1};ok(pop().join()===first.join(),name+' 5주년 전날까지 고정');s.date.d++;ok(pop().length===3&&!pop().some(id=>first.includes(id)),name+' 5주년 당일 교체');
    const cycleOrders=[];
    for(let cycle=0;cycle<5;cycle++){s=fresh();const all=[];for(let slot=0;slot<8;slot++){s.date={...g.at,y:g.at.y+40*cycle+5*slot};const batch=pop();ok(batch.length===3,name+' 3명: '+s.date.y);all.push(...batch);}ok(all.length===24&&new Set(all).size===24,name+' 40년 8차례 24명·중복 없음');cycleOrders.push(all.join());}
    ok(new Set(cycleOrders).size===5,name+' 40년마다 새 추첨');orders.push(...cycleOrders);
    const seeded=[];for(let seed=1;seed<=5;seed++){fresh(seed);seeded.push(pop().join());}ok(new Set(seeded).size===5,name+' 게임마다 무작위');
    s=fresh();const selected=pop(),before=JSON.stringify(s[g.key]);s.mates.push({id:selected[0]});ok(!pop().includes(selected[0])&&pop().length===2&&JSON.stringify(s[g.key])===before,name+' 현재 부하 제외·보충 없음');s.date={...g.at,y:g.at.y+40};g.C.roster(s.date.y,s.seed);ok(!s[g.key].order.includes(selected[0])&&s[g.key].order.length===29,name+' 다음 주기도 현재 부하 제외');
    G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;ok(g.C.roster(s.date.y,s.seed).join()===s[g.key].order.join(),name+' 저장 복원');
    s=fresh();s.disc[g.gate]={me:true,found:16040815};s.date={y:1604,m:8,d:15};const late=pop();s.date={y:1609,m:8,d:14};ok(pop().join()===late.join(),name+' 늦은 발견 기준');s.date.d=15;ok(!pop().some(id=>late.includes(id)),name+' 늦은 발견 5주년');
    s=fresh();s.disc[g.gate]={rival:'경쟁자',found:G.U.dateNum(g.at)};pop();const a=s[g.key].anchor;s.disc[g.gate].found=15000520;s.disc[g.gate].me=true;pop();ok(s[g.key].anchor===a,name+' 경쟁자 발표 뒤 재발견해도 기준 보존');
    s=fresh();s.disc[g.gate]={me:true};pop();const old=s[g.key].anchor;s.date.y++;pop();ok(s[g.key].anchor===old,name+' 날짜 없는 옛 저장 기준 고정');
   }
   const seedOrders=[];for(let seed=1;seed<=6;seed++){fresh(seed);seedOrders.push(active(1498).join());}ok(new Set(seedOrders).size===6,'게임별 무작위');
   s=fresh();const first=active(1498);const saved=JSON.stringify(s.monsoonCrew);for(let i=0;i<80;i++)G.U.rand();ok(active(1498).join()===first.join()&&JSON.stringify(s.monsoonCrew)===saved,'다른 난수 소비에도 추첨 고정');
   const m=G.MATE[first[0]],range=G.MateMove.range(m.id);s.mateLoc={[m.id]:0};s.mateRumorStay={[m.id]:{city:0,until:s.day+30,any:true}};
   const city=G.MateMove.where(m.id);ok(city&&range.includes(city.id)&&!s.mateRumorStay[m.id],'옛 저장의 유럽 위치·체류 정정');
   ok(G.MateMove.hear(m.id,city.id)===G.BALANCE.wander.rumorStayDays,'실제 행방 체류');s.day++;ok(G.MateMove.hear(m.id,city.id)===G.BALANCE.wander.rumorStayDays-1,'재문의로 체류 연장 없음');
   ok(G.MateKnow.wanderers().filter(x=>x.monsoonRotation).length===3,'수첩 철새 명단 연결');
   const original={confirm:G.UI.confirm,say:G.UI.say,window:G.UI.window,hire:G.Achieve.afterHire};
   G.UI.confirm=async()=>true;G.UI.say=async()=>{};G.UI.window=()=>({result:Promise.resolve(1)});G.Achieve.afterHire=async()=>[];
   try{
    ok(!await T.hireMate(G.CITY_DATA[0],m),'지역 밖 직접 고용 차단');
    const inactive=crew.find(x=>!G.Frontier.mateReady(x));ok(!await T.hireMate(city,inactive),'비추첨 인물 직접 고용 차단');
    ok(await T.hireMate(city,m)&&!await T.hireMate(city,m),'실제 고용·중복 고용 차단');
    ok(active(1498).length===2&&JSON.stringify(s.monsoonCrew)===saved,'고용 뒤 보충 추첨 없음');
    s.player.wife=first[1];s.player.wives2=[{id:first[2],kind:'mate'}];s.date.y=1538;C.roster(1538,s.seed);
    ok(!s.monsoonCrew.order.includes(m.id)&&!s.monsoonCrew.order.includes(first[1])&&!s.monsoonCrew.order.includes(first[2])&&s.monsoonCrew.order.length===27,'다음 주기 고용·본처·다른 아내 제외');
    G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;ok(C.roster(1538,s.seed).join()===s.monsoonCrew.order.join()&&s.mates.some(x=>x.id===m.id),'실제 저장 복원·고용 유지');
    s=fresh();const af=G.MATE[aa()[0]],afCity=G.MateMove.where(af.id);ok(!await T.hireMate(G.CITY_DATA[0],af),'아프리카 지역 밖 실제 고용 차단');ok(await T.hireMate(afCity,af)&&!await T.hireMate(afCity,af),'아프리카 실제 고용·중복 차단');ok(aa().length===2,'아프리카 실제 고용 뒤 2명 유지');
   }finally{G.UI.confirm=original.confirm;G.UI.say=original.say;G.UI.window=original.window;G.Achieve.afterHire=original.hire;}
   fresh();active(1498);
   if(!rulesOnly){
    for(const m of crew.concat(africans))for(const [key,w,h] of [[m.face,512,512],[m.halfKey,1024,1536]]){const im=await G.Img.load(key);ok(im&&im.naturalWidth===w&&im.naturalHeight===h&&G.PORTRAIT_FACES[key],'그림·얼굴 자리: '+key);}
    if(G.Loader)await G.Loader.hide();const card=T._mateCard(m,city);window.__monsoonCard=G.UI.window({title:m.name+' — 계절풍 항해사',width:840,parch:false,html:'<div class="hire-card parch"></div>'});window.__monsoonCard.content.firstElementChild.appendChild(card);window.__monsoonID=m.id;window.__africanID=aa()[0];
   }
   return {checks,nations,africanNations:an,ids,orders};
  },rulesOnly);
  if(!rulesOnly){
   await page.waitForTimeout(350);await page.screenshot({path:path.join(OUT,'recruit-card.png')});await page.evaluate(()=>window.__monsoonCard.close(null));
   await page.evaluate(()=>{const m=G.MATE[window.__africanID],c=G.MateMove.where(m.id);window.__africanCard=G.UI.window({title:m.name+' — 아프리카 항해사',width:840,parch:false,html:'<div class="hire-card parch"></div>'});window.__africanCard.content.firstElementChild.appendChild(G.Scenes.city.B.tavern._mateCard(m,c));});await page.waitForTimeout(300);await page.screenshot({path:path.join(OUT,'african-recruit-card.png')});await page.evaluate(()=>window.__africanCard.close(null));
   await page.evaluate(()=>{const id=window.__monsoonID;G.UI.say('바람이 바뀌었네요. 다음 항구까지 제가 물길을 살펴볼게요.',{name:G.MATE[id].name,portrait:G.Scenes.mateSpec(id),half:G.Img.chain.mateHalf(id)});});
   await page.waitForTimeout(500);await page.screenshot({path:path.join(OUT,'dialogue-half.png')});await page.keyboard.press('Enter');
   await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#people',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.G&&G.MonsoonCrew&&G.Img,null,{timeout:120000});await page.locator('#q').fill('계절풍');
   await page.screenshot({path:path.join(OUT,'catalog-roster.png')});
   await page.locator('#q').fill('아나야 데사이');await page.locator('#grid .card').filter({hasText:'아나야 데사이'}).first().click();
   assert((await page.locator('#detail').innerText()).includes('인도항로 발견 후 5년마다 최대 3명'));await page.screenshot({path:path.join(OUT,'catalog-character.png')});
   await page.keyboard.press('Escape');await page.locator('#q').fill('마마두 은다오');await page.locator('#grid .card').filter({hasText:'마마두 은다오'}).first().click();assert((await page.locator('#detail').innerText()).includes('희망봉 발견 후 5년마다 최대 3명'));await page.screenshot({path:path.join(OUT,'african-catalog-character.png')});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);fs.writeFileSync(path.join(OUT,rulesOnly?'rules-check.json':'report.json'),JSON.stringify({...report,errors,failures},null,2));
  console.log('통과 — 인도양 여성·아프리카 남성 각 30명·발견일부터 5년/3명/40년·고용/혼인 제외·저장·지역 제한'+(rulesOnly?'':'·초상 120장·얼굴 자리·게임/도감 화면')+'·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
