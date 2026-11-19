/* 선종별 속도와 실제 바다 자동 플레이를 이전 검증본과 비교한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.OUT||path.join(root,'artifacts/sailing-speed-20261119');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const report={};
 try{
  for(const [name,dir] of [['before',process.env.BASELINE_SOURCE],['after',root]]){
   if(!dir)continue;
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.addInitScript(()=>{let seed=9719;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);window.requestAnimationFrame=()=>0;});
   await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
   await page.waitForFunction(()=>window.G?.Game?.sceneName==='title',null,{timeout:120000});
   await page.evaluate(()=>G.Game.ensureGeo());await page.waitForFunction(()=>G.Game.geoReady,null,{timeout:120000});
   await page.addScriptTag({path:path.join(root,'tools/autoplay/bot.js')});
   report[name]=await page.evaluate(async()=>{
    const s=G.State.newGame({name:'속력 비교',nation:'PT',job:'explorer',age:28,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk:{sail:3},lg:[],diff:'normal'});
    G.Game.state=s;s.settings.music=0;s.settings.sound=0;s.settings.res=.35;
    const rows=[];
    for(const id of Object.keys(G.SHIP)){
     const sh=G.R.newShip(id,'비교선');
     for(const hp of [1,.4]){sh.hp=sh.maxHp*hp;for(const env of [{off:0,mon:false},{off:5,mon:true}])for(const calm of [false,true])for(let a=0;a<8;a++){
      rows.push({id,hp,off:env.off,calm,a,v:G.R.shipSpeed(sh,a*Math.PI/4,{dir:.2,spd:.65,calm},env)});
     }}
    }
    // 기존 자동 플레이 도구가 실제 SEA.update와 항해 경로를 실행한다.
    G.Game.go('sea',{depart:0,fresh:true});s.loc.lon=-25;s.loc.lat=25;s.loc.heading=-Math.PI/2;
    s.fleet.food=300;s.fleet.water=300;s.fleet.fatigue=0;s.fleet.discipline=100;
    BOT.noDivert=true;BOT.maxLegDays=100;
    const start=s.day,food=s.fleet.food,water=s.fleet.water;
    const voyage=await BOT.sailLeg([{lon:-25,lat:18,r:.2,ocean:true}]);
    return {rows,types:JSON.stringify(G.SHIP_TYPES),shipData:JSON.stringify(G.SHIP),voyage,days:s.day-start,food:food-s.fleet.food,water:water-s.fleet.water,location:{lon:s.loc.lon,lat:s.loc.lat},events:BOT.ev,errors:BOT.err};
   });
   assert.deepEqual(errors,[]);assert.deepEqual(report[name].errors,[]);assert(report[name].voyage.reached,'자동 항해 목적지 도착: '+JSON.stringify(report[name].voyage));
   console.log(name+' 항해 '+report[name].days+'일');await page.close();
  }
  assert(report.after.rows.every(r=>Number.isFinite(r.v)&&r.v>0));
  if(report.before){
   assert.equal(report.after.types,report.before.types);assert.equal(report.after.shipData,report.before.shipData);assert.equal(report.after.rows.length,report.before.rows.length);
   report.after.rows.forEach((r,i)=>assert(Math.abs(r.v/report.before.rows[i].v-1.4)<1e-10,r.id+' 속도 배수'));
   assert(report.after.days<report.before.days,'같은 출발 조건에서 항해 일수 감소');
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('통과 · '+report.after.rows.length+'개 선종·환경·바람 조건 · 실제 자동 항해 · 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
