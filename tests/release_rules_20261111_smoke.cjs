/* 날치 기록 병합·입출항 소요일·현지 판매품 의뢰 제외를 이전 저장과 실제 도시 경로로 확인한다. */
'use strict';
const assert=require('assert'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files']});const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title',null,{timeout:120000});
  const result=await p.evaluate(async()=>{
   await G.Game.ensureGeo();
   const fresh=diff=>{const s=G.State.newGame({name:'flyingfish',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff});s.settings.res=.35;s.settings.autosave=false;return s;};
   let s=fresh('normal');s.disc.flyingfish={found:14800101,me:true,reported:true};s.disc.f_flying={found:false,me:false};s.hints.flyingfish=[{src:'old',d:14800101}];s.hints.f_flying=[{src:'new',d:14800102}];s.contract={disc:'flyingfish',sponsor:'pt_prince'};
   s.player.items.push({id:'r_flyingfish_baby',disc:'flyingfish',kind:'animal'});
   const saved=G.State.deserialize(G.State.serialize()),again=G.State.migrateAlias(JSON.parse(JSON.stringify(saved)));
   const migrated={name:saved.player.name,oldDisc:saved.disc.flyingfish||null,disc:saved.disc.f_flying,hints:saved.hints.f_flying,contract:saved.contract.disc,item:saved.player.items.find(it=>it.id==='r_f_flying_baby'),stable:JSON.stringify(saved)===JSON.stringify(again)};
   const UI=G.UI,C=G.Scenes.city;UI.say=async()=>1;UI.alert=async()=>1;UI.confirm=async()=>true;UI.ask=async(t,o)=>o[0].value;UI.choose=async()=>null;UI.fade=async(fn)=>fn();C.say=async()=>1;C.mate=async()=>1;C.mateAsk=async()=>true;C.news=async()=>{};G.State.save=()=>{};G.Game.go=()=>{};
   const days=[];
   for(const diff of ['easy','normal','original']){
    s=fresh(diff);s.loc={mode:'city',city:0,via:'sea'};s.known=[0];s.visited={0:1};const city=G.CITY_DATA[0];
    let before=s.day;await C.arrival(city,{arrive:true});const sea=s.day-before;
    before=s.day;await C.arrival(city,{arrive:true,gate:true});const gate=s.day-before;
    s.fleet.crew=Math.max(100,G.R.crewMin());s.fleet.food=1000;s.fleet.water=1000;before=s.day;await C.B.harbor.depart(city);days.push({diff,sea,gate,depart:s.day-before});
   }
   s=fresh('normal');s.date={y:1650,m:1,d:1};s.player.fame=1000;let buy=0,overlap=[];
   for(const city of G.CITY_DATA.filter(c=>c&&c.port&&G.R.cityExists(c)).slice(0,50))for(let block=0;block<12;block++){
    s.day=block*10;for(const q of G.Quest.offers(city))if(q.kind==='buy'){buy++;if(G.R.cityGoods(city).includes(q.good))overlap.push(q.title);}
   }
   let court=0,errands=0;const badCourt=[],badErrand=[];
   for(const sp of G.SPONSORS.filter(sp=>G.CITY_DATA[sp.city]&&G.R.cityExists(G.CITY_DATA[sp.city]))){
    const city=G.CITY_DATA[sp.city],sold=G.R.cityGoods(city);
    for(const q of G.Errand.offers(sp)){errands++;if(q.kind==='procure'&&sold.includes(q.good))badErrand.push(q.title);if(q.kind==='confirm'&&G.DISC[q.disc]&&G.DISC[q.disc].how==='city'&&G.DISC[q.disc].city===city.id)badErrand.push(q.title);}
    const realm=G.Court.realmOf(sp);if(!realm)continue;
    // 이전 저장에 남은 구형 왕명도 새 납품 조건으로 다시 만든다.
    G.Court.state().offers[realm.id]={rank:G.Court.rank(realm),version:2,day:s.day,list:[{kind:'supply',good:sold[0],title:'옛 납품'}]};
    for(const q of G.Court.offers(sp))if(q.kind==='supply'){court++;if(sold.includes(q.good))badCourt.push(q.title);}
   }
   return{migrated,days,buy,overlap,court,errands,badCourt,badErrand,duplicateRemoved:!G.DISC.flyingfish&&!G.RELIC.r_flyingfish_baby,seaMethod:G.DISC.f_flying.how};
  });
  const m=result.migrated;assert.equal(m.name,'flyingfish');assert.equal(m.oldDisc,null);assert(m.disc.found&&m.disc.me&&m.disc.reported);assert.equal(m.hints.length,2);assert.equal(m.contract,'f_flying');assert(m.item&&m.item.disc==='f_flying'&&m.stable);
  assert.deepEqual(result.days,[{diff:'easy',sea:0,gate:1,depart:1},{diff:'normal',sea:0,gate:3,depart:3},{diff:'original',sea:0,gate:10,depart:10}]);assert(result.buy>20);assert.deepEqual(result.overlap,[]);assert(result.court>0&&result.errands>0);assert.deepEqual(result.badCourt,[]);assert.deepEqual(result.badErrand,[]);assert(result.duplicateRemoved);assert.equal(result.seaMethod,'sea');assert.deepEqual(errors,[]);console.log(JSON.stringify({result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
