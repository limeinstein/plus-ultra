/* 회사 호칭·여관 말씨·첫 음식 보상·소문·현상수배 벽보를 실제 화면과 저장 경로로 검증한다. */
'use strict';
const assert=require('assert'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1280,height:720}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const result=await p.evaluate(async()=>{
   await G.Game.ensureGeo();
   const fresh=()=>G.State.newGame({name:'반영 시험',nation:'PT',job:'merchant',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   let s=fresh();s.date={y:1650,m:3,d:1};s.settings.res=.35;
   const C=G.Scenes.city,UI=G.UI,say=C.say,uiSay=UI.say,lines=[];
   C.say=async(w,t)=>lines.push(t);UI.say=async(t)=>lines.push(t);
   const company=G.COMPANIES.find(co=>co.ranks&&co.ranks[4]==='인도 부왕'),b=G.Company.state();
   s.loc={mode:'city',city:company.hq};b.member=company.id;
   const ranks=[],pick=G.U.pick;G.U.pick=values=>values[0];
   for(const rank of [1,3,4]){b.rank=rank;await C.B.company.enter(G.CITY_DATA[company.hq],company.id);ranks.push(lines.pop());}
   G.U.pick=pick;
   const male=G.CITY_DATA.find(c=>{if(!c)return false;s.loc.city=c.id;return c.nation==='프랑스'&&G.Img.npcGender('innkeeper',c)==='m';});
   s.loc.city=male.id;await C.B.inn.enter(male);const inn=lines.pop();
   s=fresh();s.settings.res=.35;s.day=20;s.player.gold=10000;s.fleet.fatigue=70;s.fleet.discipline=50;
   const city=G.CITY_DATA[0],dish=G.CUISINE.dishes(city)[0],k=G.BALANCE.restaurant;
   const choose=UI.choose;let menuText='';UI.choose=async(t,rows,opt)=>{menuText=opt.text;return null;};await C.B.restaurant.choose(city);UI.choose=choose;
   const fame=G.Fame.add,calls=[];G.Fame.add=function(kind,n){calls.push([kind,n]);return fame.apply(this,arguments);};
   const meal=async()=>{const fatigue=s.fleet.fatigue,discipline=s.fleet.discipline,gold=s.player.gold;await C.B.restaurant.eat(city,dish);return{rest:fatigue-s.fleet.fatigue,disc:s.fleet.discipline-discipline,price:gold-s.player.gold,text:lines.pop(),tasted:s.restaurant.tasted[dish.id]};};
   const first=await meal();s.day++;s.portVisit=(s.portVisit||0)+1;s.fleet.fatigue=70;s.fleet.discipline=50;const again=await meal();
   delete s.restaurant;s.player.xp=s.player.xp||{};s.player.xp.food={[dish.id]:1};s.portVisit++;s.fleet.fatigue=70;s.fleet.discipline=50;const legacy=await meal();
   G.Fame.add=fame;C.say=say;UI.say=uiSay;
   const tip={kind:'pirate',city:0,port:0,n:4,lon:city.lon,lat:city.lat,to:s.day+19};
   return{ranks,inn,first,again,legacy,k,calls,menuText,speech:G.MaidTip.speech(tip),compact:G.MaidTip.text(tip)};
  });
  console.log(JSON.stringify(result));
  assert(!/각하|이사님/.test(result.ranks[0]));assert(result.ranks[1].includes('인도청 이사님'));assert(result.ranks[2].includes('인도 부왕 각하'));
  assert(/십시오|습니다/.test(result.inn)&&!result.inn.includes('어머'));
  assert.equal(result.first.rest-result.again.rest,result.k.first.rest);assert.equal(result.first.disc-result.again.disc,result.k.first.disc);
  assert.equal(result.first.price,result.again.price);assert.equal(result.again.tasted,2);assert.equal(result.legacy.rest,result.again.rest);
  assert(result.first.text.includes('처음 드셔'));assert(!result.again.text.includes('처음 드셔')&&!result.legacy.text.includes('처음 드셔'));
  assert.equal(result.calls[0][1]-result.calls[1][1],result.k.first.so);
  assert(result.menuText.includes('사교 명성 +12 더'),'차림표의 명성 안내는 실제 표시 배수를 반영한다');
  assert(result.speech.includes('4척')&&result.speech.includes('19일 남짓')&&!result.speech.includes(' · '));assert(result.compact.includes(' · '));
  const layouts=[];
  for(const [width,height] of [[1280,720],[960,540],[640,640]]){
   await p.setViewportSize({width,height});
   await p.evaluate(()=>{G.Game.state.date={y:1650,m:3,d:1};window.__board=G.Wanted.board(G.CITY_DATA[0]);});
   await p.waitForSelector('.wp-card');
   const box=await p.evaluate(()=>{const grid=document.querySelector('.wp-grid'),content=grid.closest('.content'),r=content.getBoundingClientRect(),cards=[...grid.querySelectorAll('.wp-card')].map(c=>c.getBoundingClientRect());return{n:cards.length,bottom:Math.max(...cards.map(c=>c.bottom)),limit:r.bottom,right:Math.max(...cards.map(c=>c.right)),edge:r.right};});
   assert(box.n>=5&&box.n<=8,'벽보 두 줄');assert(box.bottom<=box.limit+2,'벽보 세로 잘림 '+JSON.stringify({width,height,...box}));assert(box.right<=box.edge+2,'벽보 가로 잘림');
   layouts.push({width,height,...box});await p.keyboard.press('Escape');await p.evaluate(()=>window.__board);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result,layouts,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
