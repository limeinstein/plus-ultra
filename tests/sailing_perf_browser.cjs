/* 실제 항해의 전체 프레임·GPU 완료·선박 버퍼 재할당을 같은 조건에서 측정한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),label=process.argv[2]||'after',OUT=path.join(ROOT,'artifacts/sailing-perf-20261101',label);
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 const errors=[],report={label,views:[]};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900}});p.setDefaultTimeout(120000);
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{
   requestAnimationFrame=()=>0;window.__gls=[];window.__sizes=0;
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){const r=get.call(this,type,...args);if(type==='webgl2'&&r&&!window.__gls.includes(r))window.__gls.push(r);return r;};
   for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,key);Object.defineProperty(HTMLCanvasElement.prototype,key,{...d,set(v){if(window.__measure)window.__sizes++;d.set.call(this,v);}});}
  });
  await p.goto(pathToFileURL(path.join(ROOT,process.env.PAGE||'index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.State&&G.Game&&G.Img.count()>0,null,{polling:100});await p.evaluate(()=>G.Game.ensureGeo());
  await p.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   const s=G.Game.state=G.State.newGame({name:'항해 성능 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=1;s.fleet.ships=['galleon','galley','caravel'].map(id=>G.R.newShip(id));s.fleet.crew=220;s.loc={mode:'sea',lon:-25,lat:33,heading:0};
   G.Game.go('sea',{fresh:true});const st=G.Scenes.sea.runtime();st.dayAcc=-1e6;st.manual=true;st.paused=true;st.busy=1;
   G.Rain.weather=()=>({cloud:.22,storm:0});
   window.__parts={};window.__calls={};
   function wrap(o,key,label){const f=o[key];o[key]=function(){const t=performance.now();try{return f.apply(this,arguments);}finally{if(window.__measure){window.__parts[label]=(window.__parts[label]||0)+performance.now()-t;window.__calls[label]=(window.__calls[label]||0)+1;}}};}
   wrap(G.Ship3D,'draw','ships');wrap(G.Game.renderer,'draw','water');wrap(G.Waves,'hull','ride');wrap(G.SeaFX,'draw','wake');wrap(G.SeaFX,'drawHull','spray');
   window.__place=(zoom)=>{s.loc.lon=-25;s.loc.lat=33;st.cam.lon=-25;st.cam.lat=33;st.cam.zoom=zoom;st.cam.zoomT=0;st.t=24;st.npcs=['merchant','pirate','navy'].map((kind,i)=>({id:'perf-'+kind,kind,n:1,ships:[['fluyt','xebec','frigate'][i]],lon:-25+(i-1)*340/zoom,lat:33+210/zoom,heading:.3,spd:0,life:100,K:.4,nation:'PT',zone:'atlantic',awed:true}));};
   window.__step=()=>{window.__parts={};window.__calls={};window.__sizes=0;st.rframe=2;const a=performance.now();G.Scenes.sea.update(1/60);const submit=performance.now()-a;window.__gls.forEach(gl=>{if(!gl.isContextLost())gl.finish();});return{submit,complete:performance.now()-a,parts:{...window.__parts},calls:{...window.__calls},sizes:window.__sizes,ship:G.Ship3D.stats(),terrain:{...G.Game.renderer.stats}};};
   window.__place(110);
  });
  await p.waitForFunction(()=>{window.__step();return G.Ship3D.stats().ready;},null,{polling:100});
  const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Profiler.start');
  for(const zoom of [110,330,1000,110]){
   await p.evaluate(z=>window.__place(z),zoom);
   for(let i=0;i<12;i++)await p.evaluate(()=>window.__step());
   await p.evaluate(()=>{window.__measure=true;});const samples=[];
   for(let i=0;i<90;i++)samples.push(await p.evaluate(()=>window.__step()));
   await p.evaluate(()=>{window.__measure=false;});
   await p.screenshot({path:path.join(OUT,'sea-'+zoom+(report.views.length===3?'-return':'')+'.png')});
   const q=(a,v)=>a.slice().sort((a,b)=>a-b)[Math.floor((a.length-1)*v)];
   const parts={};for(const k of Object.keys(samples[0].parts))parts[k]=q(samples.map(x=>x.parts[k]||0),.5);
   report.views.push({zoom,medianSubmit:q(samples.map(x=>x.submit),.5),p95Submit:q(samples.map(x=>x.submit),.95),medianComplete:q(samples.map(x=>x.complete),.5),p95Complete:q(samples.map(x=>x.complete),.95),medianResizes:q(samples.map(x=>x.sizes),.5),parts,first:samples[0].ship,last:samples.at(-1).ship,samples});
   assert(samples.every(x=>x.ship.ready&&x.calls.ships===6&&x.ship.drawn===6),'all six ships must be drawn');
   assert.equal(samples[0].ship.builds,samples.at(-1).ship.builds,'no model rebuild during steady sailing');
   if(label!=='before')assert(samples.every(x=>x.sizes===0),'steady fleet rendering must reuse its buffers');
   console.log(JSON.stringify({...report.views.at(-1),samples:undefined}));
  }
  const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(path.join(OUT,'cpu.cpuprofile'),JSON.stringify(profile));
  const hits={};(profile.samples||[]).forEach((id,i)=>hits[id]=(hits[id]||0)+(profile.timeDeltas[i]||0));
  report.cpu=profile.nodes.map(n=>({name:n.callFrame.functionName,file:n.callFrame.url.split('/').pop(),line:n.callFrame.lineNumber+1,ms:(hits[n.id]||0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,24);
  report.renderer=await p.evaluate(()=>{const gl=G.Game.renderer.gl,e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});
  report.sprites=await p.evaluate(()=>({loaded:G.ShipSprite.loaded(),status:G.ShipSprite.status('galleon')}));
  if(label!=='before')assert.equal(report.sprites.loaded,0,'3D sailing must not decode unused sprite sheets');
  // 고정 카메라 측정과 별도로 실제 항해·해도 추적·분할 지형 갱신도 진행한다.
  await p.evaluate(()=>{window.__place(330);const st=G.Scenes.sea.runtime();st.busy=0;G.Scenes.sea.takeCourse(0);st.speed=1;window.__travelStart=G.Game.state.loc.lon;window.__measure=true;});
  const moving=[];for(let i=0;i<120;i++)moving.push(await p.evaluate(()=>window.__step()));
  report.travel=await p.evaluate(()=>{window.__measure=false;const st=G.Scenes.sea.runtime(),l=G.Game.state.loc;return{distance:l.lon-window.__travelStart,shipScreenX:800+(l.lon-st.cam.lon)*st.cam.zoom,terrain:{...G.Game.renderer.stats},ready:G.Ship3D.stats().ready};});
  report.travel.maxFrame=Math.max(...moving.map(x=>x.complete));report.travel.samples=moving.map(x=>x.complete);
  assert(report.travel.distance>.01&&report.travel.ready&&Math.abs(report.travel.shipScreenX-800)<220,'moving ship and chart must stay together');
  await p.screenshot({path:path.join(OUT,'moving-3x.png')});
  // 3D를 끄거나 사용할 수 없으면 기존 시트를 정상적으로 준비한다.
  report.fallback=await p.evaluate(async()=>{G.FX.ship3d.enabled=false;const canRender=G.Ship3D.canRender&&G.Ship3D.canRender('galleon');await G.ShipSprite.preload(['galleon'],15000,true);const status=G.ShipSprite.status('galleon');G.FX.ship3d.enabled=true;return{canRender,status};});
  assert.equal(report.fallback.status,'ok');if(label!=='before')assert.equal(report.fallback.canRender,false);
  await p.evaluate(()=>G.Scenes.sea.exit('city'));assert.equal(await p.evaluate(()=>G.Ship3D.stats().ready),false);
  assert.deepStrictEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({cpu:report.cpu,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
