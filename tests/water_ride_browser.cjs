/* 실제 항해 update(dt)를 진행해 선체 출렁임·NPC별 위상·정지 중 좌표 보존을 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/water-coast-ride-20261101');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 const errors=[],report={};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let seed=91273;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Game&&G.State,null,{polling:100});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   const s=G.Game.state=G.State.newGame({name:'연안과 선체 움직임',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=1;s.fleet.ships=['galleon','caravel'].map(id=>G.R.newShip(id));s.fleet.crew=180;
   G.FX.waitSpeed=0;G.Rain.weather=()=>({cloud:.22,storm:0});
   // 무작위 해수·사건을 배제해 같은 수면과 선체만 반복 검증한다.
   if(G.SeaMonsters)G.SeaMonsters.drawSea=()=>{};
   window.__poses={};const draw=G.Ship3D.draw;
   G.Ship3D.draw=function(ctx,x,y,angle,len,spec,t){const ok=draw.apply(this,arguments);if(spec.pose)window.__poses[spec.sid||spec.type||'flag']={...spec.pose,x,y,len,ok};return ok;};
   window.__setup=(lon,lat,zoom,npcs)=>{
    s.loc={mode:'sea',lon,lat,heading:.8};G.Game.go('sea',{fresh:true});const st=G.Scenes.sea.runtime();
    st.paused=true;st.manual=true;st.dayAcc=-1000;st.furl=1;st.cam={...st.cam,lon,lat,zoom,zoomT:0};st.wind={dir:.42,spd:.63};st.windVis={...st.wind};st.t=24;
    st.npcs=npcs?['merchant','pirate','navy'].map((kind,i)=>({id:'ride-'+kind,kind,n:2,ships:i===0?['fluyt','caravel']:i===1?['galley','galleon']:['galleon','frigate'],lon:lon+(i-1)*1.25,lat:lat+.65,heading:.8,spd:0,life:100,K:.4,nation:'PT',zone:'atlantic',awed:true})):[];
    window.__poses={};G.Game.fit();st.rframe=1;G.Scenes.sea.update(0);
   };
   window.__step=(n)=>{const b=G.Scenes.sea,st=b.runtime();for(let i=0;i<n;i++){st.rframe=i===n-1?1:0;b.update(1/30);}return{t:st.t,flag:{...st.pose},follow:st.rideF&&{...st.rideF[1]},npcs:st.npcs.map(n=>({kind:n.kind,ships:n.rideShips.map(r=>({...r}))})),loc:{...s.loc},drawn:{...window.__poses}};};
   window.__setup(-12.5,36.5,330,true);
  });
  await page.waitForFunction(()=>G.Img.count()>0,null,{polling:100});
  report.offshore=[];
  for(let i=0;i<72;i++)report.offshore.push(await page.evaluate(()=>window.__step(10)));
  await page.screenshot({path:path.join(OUT,'fleet-offshore.png')});
  // 정지 화면을 다시 그리는 것만으로는 감쇠 상태가 바뀌지 않는다. 실제 시간의 갱신만 선체를 움직인다.
  report.redraw=await page.evaluate(()=>{const st=G.Scenes.sea.runtime(),a=JSON.stringify([st.pose,st.rideF,st.npcs.map(n=>n.rideShips)]);for(let i=0;i<8;i++){st.rframe=1;G.Scenes.sea.update(0);}return a===JSON.stringify([st.pose,st.rideF,st.npcs.map(n=>n.rideShips)]);});
  await page.evaluate(()=>window.__setup(-9.6,38,330,false));
  await page.evaluate(()=>window.__step(180));
  const frames=path.join(OUT,'frames');fs.mkdirSync(frames,{recursive:true});report.coast=[];
  for(let i=0;i<120;i++){
   report.coast.push(await page.evaluate(()=>window.__step(3)));
   if(process.env.WATER_STILLS!=='1')await page.screenshot({path:path.join(frames,String(i).padStart(3,'0')+'.png')});
  }
  await page.screenshot({path:path.join(OUT,'coast-ride.png')});
  const range=(samples,key)=>{const a=samples.map(v=>v[key]);return Math.max(...a)-Math.min(...a);};
  const stats=samples=>({rollDegrees:range(samples,'roll')*180/Math.PI,pitchDegrees:range(samples,'pitch')*180/Math.PI,heave:range(samples,'heave')});
  report.motion={flag:stats(report.offshore.map(x=>x.flag)),follow:stats(report.offshore.map(x=>x.follow)),coast:stats(report.coast.map(x=>x.flag)),npcs:[]};
  for(let n=0;n<3;n++)for(let j=0;j<2;j++)report.motion.npcs.push({kind:report.offshore[0].npcs[n].kind,ship:j,...stats(report.offshore.map(x=>x.npcs[n].ships[j]))});
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  assert(report.redraw,'dt=0 must not advance/reset the ride state');
  for(const r of [report.motion.flag,report.motion.follow,report.motion.coast,...report.motion.npcs])assert(r.rollDegrees>.1&&r.pitchDegrees>.1&&r.heave>.001,JSON.stringify(r));
  assert(report.offshore.every(x=>x.loc.lon===-12.5&&x.loc.lat===36.5&&x.loc.heading===.8),'wave pose must not move gameplay coordinates');
  assert(report.coast.every(x=>x.loc.lon===-9.6&&x.loc.lat===38),'coastal bob must not move gameplay coordinates');
  const end=report.offshore.at(-1);assert(Object.keys(end.drawn).length>=8&&Object.values(end.drawn).every(v=>v.ok),'all eight ships must render in 3D');
  assert(end.npcs.every(n=>Math.abs(n.ships[0].heave-n.ships[1].heave)>.00001),'NPC escorts need independent wave phases');
  for(const sample of [...report.offshore,...report.coast])for(const pose of Object.values(sample.drawn))assert(Math.abs(pose.roll)<=.22&&Math.abs(pose.pitch)<=.09&&Math.abs(pose.heave)<=.05,'bounded rendered pose');
  assert.deepStrictEqual(errors,[]);report.errors=errors;
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({motion:report.motion,redraw:report.redraw,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
