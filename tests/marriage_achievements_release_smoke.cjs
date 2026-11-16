/* 혼인 업적: 실제 혼인일·만 나이·3년 경계·옛 저장·중복 보상·실제 사건/도감. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/marriage-achievements-release');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[];
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}});await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage();const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});};watch(page);
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Achieve&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async()=>{
   const A=G.Achieve,checks=[],cap=G.BALANCE.wives.maxSpouses,ids=Object.keys(G.MAID).filter(id=>G.MAID[id].g!=='m').slice(0,cap);
   function check(ok,label){if(!ok)throw Error(label);checks.push(label);}
   check(cap===12&&ids.length===cap,'정원 12명과 실제 아내 자료');
   function fresh(first=15200101,last=15230101){
    const s=G.Game.state=G.State.newGame({name:'혼인 경계 시험',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
    s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.day=2000;s.date={y:Math.floor(last/10000),m:Math.floor(last/100)%100,d:last%100};
    s.player.g='m';s.player.born={y:1500,m:1,d:1};s.player.wife=ids[0];s.player.wives2=ids.slice(1).map(id=>({id,kind:'maid',aboard:false}));
    s.player.marriageDates={};ids.forEach((id,i)=>s.player.marriageDates[id]=i===cap-1?last:first);s.achv={};s.achvPend=[];
    G.ACHIEVEMENTS.filter(a=>!a.marriageRule).forEach(a=>s.achv[a.id]={d:14800101});return s;
   }
   function done(id){return A.progress(A.get(id),[]).done;}
   let s=fresh();check(done('casanova')&&!done('uijawang'),'만20세부터 3년 경계는 젊은 혼인 업적');
   s.player.wives2.pop();check(!done('casanova'),'정원 한 명 부족은 제외');
   s=fresh(15200101,15230102);check(!done('casanova'),'3년 하루 초과 제외');
   s=fresh(15191231,15200101);check(!done('casanova'),'만19세 혼인 한 명 포함 시 제외');
   s=fresh(15290101,15290101);check(done('casanova'),'만29세 혼인 포함');
   s=fresh(15300101,15300101);check(!done('casanova'),'만30세 혼인은 제외');
   s=fresh(15260101,15290101);s.date={y:1530,m:1,d:1};check(done('casanova'),'현재 만30세여도 당시 혼인 나이로 판정');
   s=fresh(15691231,15700101);check(!done('uijawang'),'만69세 혼인 한 명 포함 시 제외');
   s=fresh(15700101,15730101);check(done('uijawang'),'만70세와 3년 경계 포함');
   s=fresh(15700101,15730102);check(!done('uijawang'),'노년 업적도 3년 하루 초과 제외');
   s=fresh();s.player.g='f';check(!done('casanova'),'여성 제독 제외');
   s=fresh();s.player.heir={sex:'f'};check(!done('casanova'),'여성 승계 제독 제외');
   s=fresh();s.player.wives2[1].id=ids[0];check(!done('casanova'),'중복 배우자는 정원에 중복 집계하지 않음');
   s=fresh();delete s.player.marriageDates[ids[0]];A.wedEver();check(!done('casanova'),'옛 저장 본처 혼인일 누락을 현재 날짜로 추측하지 않음');
   s=fresh();s.player.marriageDates[ids[1]]=15230230;check(!done('casanova'),'잘못된 달력 날짜 제외');
   s=fresh();s.player.marriageDates[ids[1]]=15240101;check(!done('casanova'),'미래 날짜 제외');
   s=fresh();delete s.player.marriageDates[ids[1]];s.player.wives2[0].wed=s.day-100;check(done('casanova'),'둘째 부인의 실제 옛 경과일은 복원해 판정');
   s=fresh(15200229,15230228);check(done('casanova'),'윤년 혼인일의 3년 뒤 말일 경계');
   s=fresh(15200229,15230301);check(!done('casanova'),'윤년 혼인일의 경계 다음날 제외');
   s=fresh();A.recordMarriage('not_current');check(!s.player.marriageDates.not_current,'현재 배우자 이외 날짜 기록 제외');
   A.recordMarriage(ids[0]);check(s.player.marriageDates[ids[0]]===15230101,'실제 혼인 당시 날짜 기록');
   s=fresh();const serialized=G.State.serialize();G.Game.state=G.State.deserialize(serialized);check(done('casanova')&&G.Game.state.player.marriageDates[ids[0]]===15200101,'혼인일 저장 복원');
   s=fresh();const original=A.scene,played=[];A.scene=async a=>played.push(a.id);const gold=s.player.gold,fame=G.Fame.get();
   try{await A.afterWed(ids[cap-1]);await A.afterWed(ids[cap-1]);check(A.done('casanova')&&played.filter(id=>id==='casanova').length===1,'혼인 직후 달성·한 번의 사건');check(s.player.gold===gold&&G.Fame.get()===fame,'칭호 업적은 금화·명성 추가 없음');}
   finally{A.scene=original;}
   check(A.titles().includes('카사노바'),'칭호 표시');
   const el=document.createElement('div');A.page(el);check(el.textContent.includes('카사노바')&&el.textContent.includes('의자왕'),'수첩에 두 혼인 업적');
   s.player.wives2=[];check(A.done('casanova'),'달성 뒤 편성이 줄어도 기록 유지');
   for(const id of ['casanova','uijawang']){const im=await G.Img.load(G.ACHV_EVENTS[id].pic);check(im&&im.naturalWidth>=1600&&im.naturalHeight>=700,id+' 전용 원화 디코딩');}
   if(G.Loader)await G.Loader.hide();G.UI.clearScreen();s.achvPend=['casanova'];
   return {checks,cap};
  });
  await page.evaluate(()=>{window.__marriageDone=false;window.__marriageScene=G.Achieve.playPending().then(()=>window.__marriageDone=true);});
  await page.waitForFunction(()=>document.querySelector('.famscene.on img')?.complete,null,{timeout:30000});
  await page.screenshot({path:path.join(OUT,'casanova-event.png')});
  let reward=false;
  for(let i=0;i<24;i++){
   if(await page.evaluate(()=>window.__marriageDone))break;
   const button=page.locator('.modal-back button.navy').last();
   if(await button.isVisible()){const text=await page.locator('.modal-back').last().innerText();if(text.includes('カサノバ')||text.includes('카사노바'))reward=true;await button.click();}
   else await page.keyboard.press('Enter');await page.waitForTimeout(180);
  }
  await page.waitForFunction(()=>window.__marriageDone,null,{timeout:10000});assert(reward,'혼인 업적 보상 창');
  const catalog=await context.newPage();watch(catalog);await catalog.goto((process.env.WEB_BASE?new URL('catalog.html',process.env.WEB_BASE).href:pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#achievements');
  for(const name of ['카사노바','의자왕']){await catalog.locator('#q').fill(name);await catalog.locator('#grid .card').filter({hasText:name}).click();assert((await catalog.locator('#detail').innerText()).includes('칭호'));await catalog.screenshot({path:path.join(OUT,name==='카사노바'?'casanova-catalog.png':'uijawang-catalog.png')});await catalog.locator('#detail').evaluate(e=>e.close());}
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...report,reward,errors,failed},null,2));console.log('통과: 혼인 나이·3년/윤년 경계·여성/중복/누락/미래일 제외·옛 저장·칭호 일회 지급·실제 사건·도감·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
