/* 의뢰 보수·실제 뱃길 기한·호위 물자비 표시·추격과 해전 속력·옛 품삯 호환. */
'use strict';
const assert=require('assert/strict'),path=require('path'),fs=require('fs');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/quest-balance-20261108');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const p=await browser.newPage({viewport:{width:960,height:720}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await p.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.R&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await p.evaluate(async()=>{
   await G.Game.ensureGeo();G.Nav.init();
   const s=G.Game.state=G.State.newGame({name:'의뢰 검증',nation:'PT',job:'merchant',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   s.settings.res=.35;s.player.gold=1e7;s.player.fame=3000;s.date={y:1530,m:1,d:1};
   const R=G.R,c=G.CITY_DATA[0],routes=['발렌시아','런던','제노바'].map(name=>{
    const to=G.CITY_DATA.find(c=>c.name===name);return{name,len:R.routeLen(c,to),days:R.questDays(c,to),limit:R.questDeadline(R.questDays(c,to))};
   });
   const quests=[];
   for(let k=0;k<8;k++){s.day=k*10;quests.push(...G.Quest.offers(c));}
   const bad=quests.filter(q=>!Number.isFinite(q.pay)||!Number.isFinite(q.limit)||q.pay+1e-8<q.supply*3||q.limit<14);
   const E=G.Escort;G.BALANCE.escort.chance=1;s.escort=null;
   const off=E.offer(c,true);if(!off)throw Error('호위 요청 없음');
   let html='';const window0=G.UI.window;G.UI.window=o=>{html=o.html;return{result:Promise.resolve(null)};};
   await E.propose(c,off,false);G.UI.window=window0;
   const box=document.createElement('div');box.innerHTML=html;
   const kv=box.querySelector('.kv'),supplyInGrid=[...kv.children].some(el=>el.textContent==='물자비');
   const oldFee=E.fee({days:10}),oldExpected=Math.round(20*G.BALANCE.escort.feeDay);
   const CO=G.Company;CO.join('pt');s.company.rank=3;s.company.merit=3000;
   const company=[];for(let k=0;k<5;k++){s.day=k*30;company.push(...CO.offers(c,'pt'));}
   const badCompany=company.filter(o=>!Number.isFinite(o.pay)||o.pay+1e-8<o.supply*3);
   G.SEA_RISK.pirate=0;G.SEA_RISK.storm=0;
   G.Game.go('sea',{depart:0});s.loc.lon=-12;s.loc.lat=38;
   const SEA=G.Scenes.sea,st=SEA.runtime();st.npcs=[];
   const n={id:'qa_quarry',kind:'merchant',label:'시험 화물선',nation:'PT',ships:['cog'],n:1,lon:-10,lat:38,heading:0,spd:1,quarry:true,hostile:false};st.npcs.push(n);
   SEA.chase(n);const started=st.chase===n&&!!st.path;
   SEA.setTarget(-14,38,null);const canceled=st.chase===null;
   SEA.chase(n);n.lon=-10.3;st.busy=0;st.paused=false;st.dayAcc=0;st.speed=1;
   const busy0=G.UI.busy;G.UI.busy=()=>false;
   SEA.update(.01);const followed=st.chase===n&&Math.abs(st.target.lon-n.lon)<.02;
   n.lon=s.loc.lon+.4;n.lat=s.loc.lat;
   let hail=0;const ask0=G.UI.ask;G.UI.ask=async()=>{hail++;return null;};
   SEA.update(.01);await Promise.resolve();G.UI.ask=ask0;G.UI.busy=busy0;
   const arrived=st.chase===null&&hail===1;
   G.Game.go('battle',{npc:n});const ships=G.Scenes.battle.runtime().ships;
   const enemies=ships.filter(b=>b.side==='en'),allies=ships.filter(b=>b.side==='me');
   const battle=enemies.length>0&&enemies.every(b=>b.loadSlow===R.questK().quarryBattle)&&allies.every(b=>!b.loadSlow);
   return{routes,quests:quests.length,bad:bad.map(q=>q.key),company:company.length,badCompany:badCompany.map(o=>o.kind),escort:{days:off.days,limit:off.len,fee:off.fee,supply:off.supply,supplyInGrid,oldFee,oldExpected},started,canceled,followed,arrived,battle};
  });
  assert(report.routes.every(r=>r.len>0&&r.days>0&&r.limit>r.days));assert(report.quests>=15);assert.deepEqual(report.bad,[]);assert(report.company>0);assert.deepEqual(report.badCompany,[]);
  assert(report.escort.fee>=report.escort.supply*3);assert(report.escort.limit>report.escort.days*2);assert(report.escort.supplyInGrid);assert.equal(report.escort.oldFee,report.escort.oldExpected);
  assert(report.started&&report.canceled&&report.followed&&report.arrived&&report.battle,JSON.stringify(report));assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...report,errors},null,2));console.log('통과: 뱃길·의뢰/회사 보수·호위 물자비 표·옛 품삯·추격 시작/취소/이동/접근·해전 속력, 오류 0');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
