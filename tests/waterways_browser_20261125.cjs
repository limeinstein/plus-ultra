/* 실제 장면의 조타·관성·충돌·배속과 뭍의 이동을 시험한다. 그림만 생략한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/world-detail-20261125');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu']});const errors=[];try{
 const p=await b.newPage({viewport:{width:640,height:360}});p.setDefaultTimeout(180000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.addInitScript(()=>requestAnimationFrame=()=>0);
 await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href);await p.waitForFunction(()=>window.G&&G.Game&&G.State);await p.evaluate(()=>G.Game.ensureGeo());
 for(const file of ['sea','land']){let s=fs.readFileSync(path.join(ROOT,'js/scenes/'+file+'.js'),'utf8');s=s.replace(file==='sea'?'    render(dt);':'    render();','    /* 물리 시험에서는 그림 생략 */');await p.addScriptTag({content:s});}
 const result=await p.evaluate(async()=>{
  const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);const s=G.Game.state=G.State.newGame({name:'수로 실주행',nation:'PT',job:'explorer',age:24,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
  s.settings.res=.35;s.flags.prologue=true;s.settings.music=0;s.settings.sound=0;s.date={y:1480,m:5,d:15};s.fleet.ships=[G.R.newShip('caravel')];s.fleet.crew=30;s.fleet.food=2000;s.fleet.water=2000;
  G.State.save=()=>{};G.State.surveyChart=()=>{};G.UI.busy=()=>false;G.UI.toast=()=>{};G.UI.say=async()=>{};s.loc={mode:'sea',lon:-25,lat:30,heading:0};await G.Game.go('sea',{fresh:true});
  const rows=[];
  for(const id of ['tagus','rhine','amazon','yangtze','mekong','northerndvina'])for(const speed of [1,8])for(const reverse of [false,true]){
   const r=G.Hydro.routes().find(r=>r.id===id);let ai=Math.max(1,Math.floor(r.pts.length*.20)),bi=Math.max(ai+1,Math.floor(r.pts.length*.70));const a=r.pts[reverse?bi:ai],b=r.pts[reverse?ai:bi];
   const st=G.Scenes.sea.runtime();s.loc.lon=a[0];s.loc.lat=a[1];s.loc.heading=Math.atan2(b[1]-a[1],b[0]-a[0]);s.date={y:1480,m:5,d:15};st.busy=0;st.paused=true;st.vel=[0,0];st.wind={dir:0,spd:.65,calm:false};st.dayAcc=-1e6;st.storm=0;st.npcs=[];st.prog=null;st.target=null;st.path=null;st.cam.lon=a[0];st.cam.lat=a[1];
   G.Scenes.sea.setTarget(...b,null);st.speed=speed;let bad=0,steps=0;const length=G.Nav.length(st.path),start=[a[0],a[1]];
   for(;steps<Math.max(1800,Math.ceil(length*2000/speed))&&st.path&&!st.paused;steps++){
    const prev=[s.loc.lon,s.loc.lat];st.npcs=[];G.Scenes.sea.update(.025);if(!G.Hydro.clear(prev,[s.loc.lon,s.loc.lat],G.Hydro.fleetProfile()))bad++;
   }
   const left=G.Geo.dist(s.loc.lon,s.loc.lat,...b);rows.push({id,speed,reverse,steps,length,left,bad,arrived:left<.16,path:!!st.path,paused:st.paused});
  }
  // 큰 함대로 얕은 강 상류를 요청하면 기존 길을 곧은 침로로 바꾸지 않는다.
  const r=G.Hydro.routes().find(r=>r.id==='thames');s.fleet.ships=[G.R.newShip('lgalleon')];s.loc.lon=r.pts[0][0];s.loc.lat=r.pts[0][1];const st=G.Scenes.sea.runtime();st.path=null;st.target=null;st.paused=true;st.busy=0;G.Scenes.sea.setTarget(...r.pts.at(-1),null);const rejected=!st.path&&st.paused&&!!G.Hydro.lastReason;
  // 실제 육상 장면을 강가에서 시작해 가장 큰 걸음으로도 마차가 강을 건너뛰지 않는지 확인한다.
  await G.Game.go('land',{from:0});const lt=G.Scenes.land.runtime(),river=G.Hydro.routes().find(r=>r.id==='amazon'),q=river.pts[Math.floor(river.pts.length*.65)],water=G.Hydro.at(...q),normal=[-water.flow[1]/Math.cos(q[1]*Math.PI/180),water.flow[0]],bank=[q[0]+normal[0]*(water.half+.04),q[1]+normal[1]*(water.half+.04)];s.loc.lon=bank[0];s.loc.lat=bank[1];s.loc.mount={id:'wagon',n:10};lt.busy=0;lt.paused=false;const norm=Math.hypot(...normal);lt.dir=normal.map(x=>-x/norm);lt.dayAcc=-1e6;lt.speed=8;const wagonStart=[s.loc.lon,s.loc.lat];G.Scenes.land.update(.8);const wagonBlocked=lt.paused&&G.Geo.dist(...wagonStart,s.loc.lon,s.loc.lat)<.01;
  const move=[];
  for(const mount of ['walk','horse','elephant']){s.loc.lon=q[0];s.loc.lat=q[1];s.loc.mount={id:mount,n:30};lt.busy=0;lt.paused=false;lt.dir=[1,0];lt.dayAcc=-1e6;lt.speed=1;G.Scenes.land.update(.04);move.push({mount,dist:G.Geo.dist(...q,s.loc.lon,s.loc.lat)});}
  return {rows,rejected,wagonBlocked,move};
 });
 fs.writeFileSync(path.join(OUT,'actual-waterway-travel.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify(result));assert(result.rows.every(x=>x.arrived&&!x.bad),'실제 상하류 자동항해 모두 도착·경계 침범 0');assert(result.rejected,'큰 배 상류 진입 거절');assert(result.wagonBlocked,'마차 도하 차단');assert(result.move[1].dist>result.move[0].dist&&result.move[2].dist>result.move[1].dist,'실제 도하 속력 차이');assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
