/* 지역별 첫 직접 발견·5년 순환·40년 재추첨·현재 부하 제외와 실제 영입/초상을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/steppe-crew-20261117');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const errors=[],failures=[],page=await browser.newPage({viewport:{width:960,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.text().startsWith('초원 검사:'))console.log(m.text());});
  page.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.SteppeCrew&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async()=>{
   const checks=[],C=G.SteppeCrew,k=G.BALANCE.steppeCrew,T=G.Scenes.city.B.tavern,crew=G.MATES.filter(m=>m.steppeRotation),keys=Object.keys(k.groups);
   const at={y:1598,m:5,d:20};
   function ok(v,msg){if(!v)throw Error(msg);checks.push(msg);}
   function fresh(seed=817){
    const s=G.Game.state=G.State.newGame({name:'초원 시험',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
    s.seed=seed;s.date={...at};s.disc={};s.player.fame=100000;s.player.gold=500000;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.flags.prologue=true;
    G.Frontier.invalidate();return s;
   }
   const pop=key=>crew.filter(m=>m.steppeRegion===key&&G.Frontier.mateReady(m)).map(m=>m.id);
   function open(s,key,found=15980520,gate=k.groups[key].gates[0]){s.disc[gate]={me:true,found};}
   ok(crew.length===30&&new Set(C.ids).size===30&&crew.every(m=>m.g==='m'&&m.portraitAge>=27),'고유 성인 남성 30명');
   const nations={};crew.forEach(m=>nations[m.nat]=(nations[m.nat]||0)+1);
   ok(JSON.stringify(nations)===JSON.stringify({UG:8,MN:10,TB:6,MJ:6}),'위구르 8·몽골 10·티베트 6·만주 6');
   ok(crew.every(m=>Object.keys(m.sk).length>=3&&Object.keys(m.sk).length<=6&&Object.keys(m.lg).length>=3&&Object.keys(m.lg).length<=5),'특기 3~6·언어 3~5');
   ok(crew.every(m=>G.MateMove.range(m.id).every(cid=>k.groups[m.steppeRegion].cities.includes(cid))&&G.MateMove.range(m.id).includes(m.home)),'지역별 활동 도시·고향 유효');
   ok(crew.every(m=>!(G.MatePower&&G.MatePower.blocked(m))),'권력자와 겹치지 않는 영입 후보');
   const gates=keys.flatMap(key=>k.groups[key].gates);
   ok(new Set(gates).size===gates.length&&gates.every(id=>G.DISC[id]),'개방 발견물 전부 존재·지역 중복 없음');
   let s=fresh();ok(keys.every(key=>pop(key).length===0),'발견 전 네 지역 모두 미등장');
   s.disc.greatwall={me:true,found:14800101};ok(keys.every(key=>pop(key).length===0),'네 지역 밖 발견으로 개방하지 않음');
   const orders={};
   for(const key of keys){
    console.info('초원 검사: '+key+' 시작');
    const g=k.groups[key],api=C.groups[key],stateKey='steppeCrew_'+key,all=crew.filter(m=>m.steppeRegion===key);
    for(const gate of g.gates){
     s=fresh();s.disc[gate]={rival:'경쟁자',found:14800101};ok(pop(key).length===0&&!s[stateKey],key+' 경쟁자 발표만으로 미개방: '+gate);
     open(s,key,15980520,gate);ok(pop(key).length===3&&keys.filter(x=>x!==key).every(x=>pop(x).length===0),key+' 발견물 하나로 해당 지역만 개방: '+gate);
    }
    s=fresh();open(s,key);s.date.d=19;ok(pop(key).length===0,key+' 첫 발견 전날');s.date.d=20;const first=pop(key);
    s.date={...at,y:1603,d:19};ok(pop(key).join()===first.join(),key+' 5주년 전날까지 명단 유지');
    s.date.d=20;ok(pop(key).length===3&&pop(key).join()!==first.join(),key+' 5주년 당일 새 배정');
    s=fresh();open(s,key);const cycles=[];
    for(let cycle=0;cycle<3;cycle++){
     const visible=[];for(let slot=0;slot<8;slot++){
      s.date={...at,y:at.y+cycle*40+slot*5};const batch=pop(key);ok(batch.length===3&&new Set(batch).size===3,key+' 매 기간 3명: '+s.date.y);visible.push(...batch);
     }
     ok(new Set(visible).size===all.length&&visible.length===24,key+' 40년 안에 전원 소개·미고용 후보 반복 순환');cycles.push(api.roster().join());
    }
    ok(new Set(cycles).size===3,key+' 40년마다 순서 재추첨');orders[key]=cycles;
    s=fresh();open(s,key);pop(key);const order=s[stateKey].order.join();s.date={...at,y:1638,d:19};pop(key);ok(s[stateKey].cycle===0&&s[stateKey].order.join()===order,key+' 40주년 전날 기존 순서');s.date.d=20;pop(key);ok(s[stateKey].cycle===1&&s[stateKey].order.join()!==order,key+' 40주년 당일 재추첨');
    const seeded=[];for(let seed=1;seed<=5;seed++){s=fresh(seed);open(s,key);pop(key);seeded.push(s[stateKey].order.join());}ok(new Set(seeded).size===5,key+' 게임별 무작위 순서');
    s=fresh();open(s,key);const batch=pop(key),saved=JSON.stringify(s[stateKey]);for(let i=0;i<30;i++)G.U.rand();ok(pop(key).join()===batch.join()&&JSON.stringify(s[stateKey])===saved,key+' 다른 난수 소비로 명단 불변');
    s.mates.push({id:batch[0]});ok(pop(key).length===2&&!pop(key).includes(batch[0]),key+' 현재 부하 즉시 제외·당기 보충 없음');
    s.date={...at,y:1603};ok(pop(key).length===3&&!pop(key).includes(batch[0]),key+' 다음 5년에는 미고용 후보로 3명');
    s.date={...at,y:1638};ok(pop(key).length===3&&!pop(key).includes(batch[0]),key+' 40년 재추첨에서도 현재 부하 제외');
    const before=JSON.stringify(s[stateKey]),visible=pop(key).join();G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;ok(pop(key).join()===visible&&JSON.stringify(s[stateKey])===before&&s.mates.some(m=>m.id===batch[0]),key+' 저장 복원·추첨·부하 보존');
    s=fresh();open(s,key);s.mates=all.slice(0,-2).map(m=>({id:m.id}));ok(pop(key).length===2,key+' 남은 후보 2명은 2명만·중복 생성 없음');s.mates=all.map(m=>({id:m.id}));ok(pop(key).length===0,key+' 전원 고용하면 미등장');
    s=fresh();open(s,key);s.flags['gone_'+all[0].id]=true;ok(!pop(key).includes(all[0].id),key+' 퇴장 인물 제외');
    s=fresh();open(s,key,15980520,g.gates[1]);open(s,key,15950520,g.gates[0]);pop(key);ok(s[stateKey].anchor===15950520,key+' 옛 저장에서 가장 이른 직접 발견일 복원');
    s.date={...at,y:1608};open(s,key,16080520,g.gates[2]);pop(key);ok(s[stateKey].anchor===15950520,key+' 추가 발견으로 기준일 유지');
    s=fresh();s.disc[g.gates[0]]={me:true};pop(key);const fallback=s[stateKey].anchor;s.date.y++;pop(key);ok(s[stateKey].anchor===fallback,key+' 날짜 없는 옛 저장은 첫 읽기 날짜 보존');
    s=fresh();open(s,key);const active=pop(key),m=G.MATE[active[0]],range=G.MateMove.range(m.id);
    s.mateLoc={[m.id]:0};s.mateRumorStay={[m.id]:{city:0,until:s.day+30,any:true}};const city=G.MateMove.where(m.id);
    ok(city&&range.includes(city.id)&&!s.mateRumorStay[m.id],key+' 지역 밖 위치·옛 행방 기록 정정');
    ok(G.MateMove.hear(m.id,city.id)===G.BALANCE.wander.rumorStayDays,key+' 실제 행방 체류 연결');
    s.day++;ok(G.MateMove.hear(m.id,city.id)===G.BALANCE.wander.rumorStayDays-1,key+' 재문의로 체류 연장 없음');
    ok(G.MateKnow.wanderers().filter(x=>x.steppeRegion===key).length===3,key+' 수첩 철새 목록');
    const original={confirm:G.UI.confirm,say:G.UI.say,window:G.UI.window,hire:G.Achieve.afterHire};
    console.info('초원 검사: '+key+' 실제 고용');
    G.UI.confirm=async()=>true;G.UI.say=async()=>{};G.UI.window=()=>({result:Promise.resolve(1)});G.Achieve.afterHire=async()=>[];
    try{
     ok(!await T.hireMate(G.CITY_DATA[0],m),key+' 지역 밖 직접 고용 차단');
     const inactive=all.find(x=>!G.Frontier.mateReady(x));ok(!await T.hireMate(city,inactive),key+' 미배정 인물 직접 고용 차단');
     ok(await T.hireMate(city,m)&&!await T.hireMate(city,m),key+' 실제 고용·중복 차단');ok(pop(key).length===2,key+' 실제 고용 뒤 명단에서 제외');
    }finally{G.UI.confirm=original.confirm;G.UI.say=original.say;G.UI.window=original.window;G.Achieve.afterHire=original.hire;}
    s=fresh();open(s,key);const leaving=pop(key)[0];s.mateDismiss={[leaving]:{available:true}};s.date={...at,y:1603};
    if(!pop(key).includes(leaving))ok(!G.MateDismiss.returning(leaving)&&!G.MateMove.where(leaving),key+' 재등용도 미등장 기간에 우회하지 않음');
    // 실제 발견 진입점의 날짜 기록까지 실행한 뒤, 관계없는 포상 화면 직전에 멈춘다.
    s=fresh();const reward=G.Disc.collectionReward;G.Disc.collectionReward=()=>{throw Error('날짜 기록 검사 완료');};
    console.info('초원 검사: '+key+' 실제 발견');
    try{await G.Disc.find(G.DISC[g.gates[0]],'special');throw Error('기록 검사 중단 실패');}catch(e){if(e.message!=='날짜 기록 검사 완료')throw e;}finally{G.Disc.collectionReward=reward;}
    ok(s[stateKey]&&s[stateKey].anchor===15980520&&s.disc[g.gates[0]].me,key+' 실제 발견 직후 최초 날짜 즉시 보존');
   }
   s=fresh();keys.forEach(key=>open(s,key));ok(keys.reduce((n,key)=>n+pop(key).length,0)===12,'네 지역 동시 개방이면 각 3명·총 12명');
   ok(!G.Wander.facePool('st','m','nav','UG').some(face=>crew.some(m=>m.face===face)),'일반 철새 얼굴 풀과 전용 인물 분리');
   for(const m of crew)for(const [key,w,h] of [[m.face,512,512],[m.halfKey,1024,1536]]){const im=await G.Img.load(key);ok(im&&im.naturalWidth===w&&im.naturalHeight===h&&G.PORTRAIT_FACES[key],'초상·얼굴 자리: '+key);}
   if(G.Loader)await G.Loader.hide();
   window.__steppePreview=keys.map(key=>pop(key)[0]);
   return {checks,nations,orders,gates:keys.map(key=>({region:key,ids:k.groups[key].gates})),preview:window.__steppePreview.map(id=>({id,name:G.MATE[id].name,region:G.MATE[id].steppeRegion}))};
  });
  for(const item of report.preview){
   await page.evaluate(id=>{const m=G.MATE[id],c=G.MateMove.where(id);window.__steppeCard=G.UI.window({title:m.name+' — '+m.natName+' 항해사',width:840,parch:false,html:'<div class="hire-card parch"></div>'});window.__steppeCard.content.firstElementChild.appendChild(G.Scenes.city.B.tavern._mateCard(m,c));},item.id);
   await page.waitForTimeout(200);await page.screenshot({path:path.join(OUT,'recruit-'+item.region+'.png')});await page.evaluate(()=>window.__steppeCard.close(null));
  }
  await page.evaluate(id=>{G.UI.say('초원의 길도 바다의 길도, 함께 가는 사람부터 살펴야 하오.',{name:G.MATE[id].name,portrait:G.Scenes.mateSpec(id),half:G.Img.chain.mateHalf(id)});},report.preview[1].id);
  await page.waitForTimeout(350);await page.screenshot({path:path.join(OUT,'dialogue-half.png')});await page.keyboard.press('Enter');
  await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#people',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.SteppeCrew&&G.Img,null,{timeout:120000});
  for(const item of report.preview){
   await page.locator('#q').fill(item.name);await page.locator('#grid .card').filter({hasText:item.name}).first().click();
   const text=await page.locator('#detail').innerText();assert(text.includes('직접 발견 후 5년마다 최대 3명')&&text.includes('40년마다 재추첨'));
   await page.screenshot({path:path.join(OUT,'catalog-'+item.region+'.png')});await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...report,errors,failures},null,2));
  console.log('통과 — '+report.checks.length+'개 검사·지역별 첫 직접 발견·5년/3명 순환·40년 재추첨·고용 제외·저장·실제 영입·초상 60장·게임/도감 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
