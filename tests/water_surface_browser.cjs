/* 같은 카메라·바람·시각의 수면 전후 비교와 실제 항해/해전 화면 검사. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{execFileSync}=require('child_process'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),LABEL=process.argv[2]||'after',OUT=path.join(ROOT,'artifacts/water-surface-20261101',LABEL);
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 const errors=[],report={label:LABEL,views:[]};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;let seed=91273;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Game&&G.State,null,{polling:100});await page.evaluate(()=>G.Game.ensureGeo());
  if(LABEL==='before'){
   // 최초 보강 직전의 두 파일을 남겨 이후에도 같은 수면을 비교한다. 작업 파일은 덮어쓰지 않는다.
   const baseline=path.join(OUT,'source');fs.mkdirSync(baseline,{recursive:true});
   for(const name of ['renderer','waves']){const file=path.join(baseline,name+'.js');if(!fs.existsSync(file))fs.writeFileSync(file,execFileSync('git',['show','HEAD:js/world/'+name+'.js'],{cwd:ROOT}));await page.addScriptTag({path:file});}
   await page.evaluate(()=>{G.Game.renderer=null;delete G.WaterLight;delete G.FX.water.surface;});
  }
  await page.evaluate(()=>{
   let seed=91273;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   const s=G.Game.state=G.State.newGame({name:'수면 표현 검증',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=1;s.fleet.ships=['galleon','caravel'].map(id=>G.R.newShip(id));s.fleet.crew=160;s.loc={mode:'sea',lon:-12.5,lat:36.5,heading:.8};
   G.Game.go('sea',{fresh:true});const st=G.Scenes.sea.runtime();st.paused=true;st.dayAcc=-1000;st.npcs=[];st.manual=true;
   window.__weather={cloud:.22,storm:0};G.Rain.weather=()=>({...window.__weather});
   const r=G.Game.renderer,draw=r.draw;r.draw=function(v){window.__view={...v};return draw.call(this,v);};
   window.__drawFrame=(t,dt=0)=>{const b=G.Game.scene,st=b.runtime();st.t=t-dt;st.rframe=1;if(!dt)st.furl=0;b.update(dt);};
   G.Game.fit();
  });
  // file:// 그림이 준비된 뒤 같은 카메라를 고정한다.
  await page.waitForFunction(()=>G.Img.count()>0,null,{polling:100});
  for(const spec of [
   {id:'sea-default',zoom:110,lon:-12.5,lat:36.5},
   {id:'sea-3x',zoom:330,lon:-12.5,lat:36.5},
   {id:'sea-close',zoom:1000,lon:-12.5,lat:36.5},
   {id:'coast-3x',zoom:330,lon:-9.6,lat:38},
   {id:'sea-storm',zoom:330,lon:-12.5,lat:36.5,storm:1},
   {id:'sea-warm',zoom:330,lon:-12.5,lat:36.5,warm:1}
  ]){
   await page.evaluate(v=>{const st=G.Scenes.sea.runtime(),s=G.Game.state;s.loc.lon=v.lon;s.loc.lat=v.lat;st.cam.lon=v.lon;st.cam.lat=v.lat;st.cam.zoom=v.zoom;st.cam.zoomT=0;st.wind={dir:.42,spd:v.storm?.94:.63};st.windVis={...st.wind};st.storm=v.storm?1:0;window.__weather={cloud:v.storm?.86:.22,storm:v.storm?.85:0};if(G.FX.water.surface)G.FX.water.surface.warmth=v.warm?.85:0;for(let i=0;i<8;i++)window.__drawFrame(24);},spec);
   await page.screenshot({path:path.join(OUT,spec.id+'.png')});
   report.views.push(await page.evaluate(id=>({id,zoom:G.Scenes.sea.runtime().cam.zoom,ship:G.Ship3D.stats().ready,view:window.__view}),spec.id));
  }
  await page.evaluate(()=>{
   let seed=49173;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   if(G.FX.water.surface)G.FX.water.surface.warmth=0;window.__weather={cloud:.22,storm:0};
   const s=G.Game.state;s.loc={mode:'sea',lon:-12.5,lat:36.5,heading:0};s.fleet.ships=['galleon','caravel'].map(id=>G.R.newShip(id));s.fleet.crew=180;
   G.Game.go('battle',{npc:{kind:'navy',nation:'ES',n:3,ships:['galleon','frigate','galley'],K:.4}});const st=G.Scenes.battle.runtime();st.paused=true;st.wind={dir:.42,spd:.63};st.myFlag.reload=[0,5,8];for(let i=0;i<8;i++)window.__drawFrame(24);
  });
  await page.screenshot({path:path.join(OUT,'battle.png')});
  report.battle=await page.evaluate(()=>({guide:!document.querySelector('.gunnery-readout').hidden,ships:G.Scenes.battle.runtime().ships.length,zoom:G.Scenes.battle.runtime().vz,view:window.__view}));
  // 본편의 바다 패스만 측정. draw+finish는 GPU 완료를 기다리므로 JS 제출 시간과 구별된다.
  report.performance=await page.evaluate(()=>{
   const r=G.Game.renderer,v={...window.__view},gl=r.gl,ext=gl.getExtension('WEBGL_debug_renderer_info');
   const samples=[];for(let i=0;i<28;i++){v.time=24+i/30;const a=performance.now();r.draw(v);r.finish();if(i>=8)samples.push(performance.now()-a);}
   samples.sort((a,b)=>a-b);return{renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),width:r.canvas.width,height:r.canvas.height,medianMs:samples[10],p95Ms:samples[18],samples};
  });
  if(LABEL==='after'&&process.env.WATER_STILLS!=='1'){
   // 움직이는 결과: 본편 항해 화면을 12fps, 실제 시간 5초만큼 수동 진행한다.
   await page.evaluate(()=>{const s=G.Game.state;s.loc={mode:'sea',lon:-12.5,lat:36.5,heading:.8};G.Game.go('sea',{fresh:true});const st=G.Scenes.sea.runtime();st.paused=true;st.npcs=[];st.cam.zoom=330;st.cam.zoomT=0;st.cam.lon=s.loc.lon;st.cam.lat=s.loc.lat;st.wind={dir:.42,spd:.63};st.windVis={...st.wind};for(let i=0;i<8;i++)window.__drawFrame(24);});
   await page.evaluate(()=>{for(let i=0;i<180;i++)window.__drawFrame(18+(i+1)/30,1/30);});
   const frames=path.join(OUT,'frames');fs.mkdirSync(frames,{recursive:true});
   for(let i=0;i<60;i++){await page.evaluate(t=>window.__drawFrame(t,1/12),24+(i+1)/12);await page.screenshot({path:path.join(frames,String(i).padStart(3,'0')+'.png')});}
  }
  assert(report.views.every(v=>v.ship));assert(report.battle.ships===5&&report.battle.guide);assert.deepStrictEqual(errors,[]);
  report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({label:LABEL,views:report.views.length,battle:report.battle.ships,performance:report.performance,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
