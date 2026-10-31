/* 실제 항해 화면의 기함·동행선·호위 상선·NPC, 36종 재사용과 장면 종료 검사. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU==='1',OUT=path.join(ROOT,'artifacts/sea3d-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[],report={mode:GPU?'GPU':'SwiftShader'};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   requestAnimationFrame=()=>0;window.__gls=[];const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(type==='webgl2'&&gl&&!window.__gls.includes(gl))window.__gls.push(gl);return gl;};
  });
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>G.Game&&G.State&&G.Img.count()>0,null,{timeout:90000,polling:100});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);sk.nav=2;
   const s=G.State.newGame({name:'항해 3D 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:50,int:50,mar:50,cha:50},sk,lg:G.LANGS.map(()=>0),diff:'normal'});
   s.settings.res=.35;G.Game.state=s;G.Game.go('sea',{depart:0,fresh:true});
   const st=G.Scenes.sea.runtime();st.paused=true;st.manual=true;st.npcs=[];st.furl=0;st.t=1.25;
   s.loc.lon=-13;s.loc.lat=36;s.loc.heading=.5;st.cam.lon=-13;st.cam.lat=36;st.cam.zoom=110;
   const draw=G.Ship3D.draw,old=G.Art.shipTop;window.__draws=[];window.__fallbacks=[];
   G.Ship3D.draw=function(ctx,x,y,a,len,spec,t){const ok=draw.apply(this,arguments);window.__draws.push({id:spec.type,sid:spec.sid,flag:spec.flag,furl:spec.furl||0,angle:a,ok,tint:spec.sailTint});return ok;};
   G.Art.shipTop=function(ctx,x,y,a,len,spec){window.__fallbacks.push(spec.sid);return old.apply(this,arguments);};
   window.__seaFrame=function(){window.__draws=[];window.__fallbacks=[];for(let i=0;i<6;i++)G.Scenes.sea.update(0);return{stats:G.Ship3D.stats(),draws:window.__draws.slice(),fallbacks:window.__fallbacks.slice()};};
   window.__fleet=function(ids){s.fleet.ships=ids.slice(0,5).map(id=>G.R.newShip(id));G.Escort.st().now={ship:Object.assign(G.R.newShip(ids[5]),{escort:true}),from:0,to:1};st.slotPos=[];};
   window.__npcs=function(ids){st.npcs=['merchant','navy','pirate'].map((kind,i)=>({id:'test-'+i,kind,lon:-13+(i-1)*2.4,lat:37.6+i*.5,heading:1.1+i*.5,n:3,K:1,spd:1,life:10,hostile:kind==='pirate',nation:'PT',zone:'eu',ships:ids.slice(i*3,i*3+3)}));};
   window.__fleet(['galleon','geobukseon','panokseon','baochuan','galley','baghlah']);
   window.__npcs(['cog','caravel','balsa','lgalleon','atakebune','junk','galleon','xebec','sambuk']);
  });
  report.first=await page.evaluate(()=>window.__seaFrame());
  assert.equal(report.first.stats.drawn,15);assert(report.first.draws.every(d=>d.ok));assert.equal(report.first.fallbacks.length,0);
  assert(report.first.draws.some(d=>d.sid==='f5'&&d.flag==='#c9a030'));assert(report.first.draws.some(d=>d.sid==='test-2:0'&&d.tint));
  report.contexts=await page.evaluate(()=>window.__gls.length);
  report.stable=await page.evaluate(()=>{const first=window.__seaFrame().stats;for(let i=0;i<3;i++)window.__seaFrame();const last=G.Ship3D.stats();return{first,last};});
  for(const k of ['builds','geometries','textures'])assert.equal(report.stable.first[k],report.stable.last[k],k+' 증가');
  await page.screenshot({path:path.join(OUT,'sea-fleet.png')});
  await page.locator('#overlay').count().then(async count=>{if(count)await page.locator('#overlay').screenshot({path:path.join(OUT,'sea-ships.png')});});
  // 모든 선종을 실제 동행선·호위 상선 위치에서 사용한다. 모델은 36종 모두 같아야 한다.
  const ids=await page.evaluate(()=>G.ShipModels.ids);report.ships=[];
  for(let i=0;i<ids.length;i+=6){const row=await page.evaluate(ids=>{const st=G.Scenes.sea.runtime();st.npcs=[];window.__fleet(ids);const r=window.__seaFrame();return{ids,draws:r.draws,stats:r.stats,fallbacks:r.fallbacks};},ids.slice(i,i+6));
   assert(row.draws.every(d=>d.ok));assert.equal(row.fallbacks.length,0);assert.deepStrictEqual([...new Set(row.draws.map(d=>d.id))].sort(),row.ids.slice().sort());assert(row.stats.cachedTypes.length<=6+3);report.ships.push(row);console.log(`${i+6}/36종 실제 함대 반영 확인`);
  }
  assert.equal(await page.evaluate(()=>window.__gls.length),report.contexts,'선종 전환 중 그래픽 장치 증가');
  // 같은 모형을 번갈아 써도 돛 접기·방향·깃발·해적 돛 색이 다음 배로 새지 않는다.
  report.independent=await page.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=600;cv.height=500;const ctx=cv.getContext('2d');
   function image(spec,a){ctx.clearRect(0,0,600,500);G.Ship3D.draw(ctx,300,360,a,200,Object.assign({type:'galleon',flag:'#1d3f7a'},spec),1.25);return cv.toDataURL();}
   const before=JSON.stringify(G.Game.state);G.Ship3D.beginFrame();const open=image({furl:0},.5),fold=image({furl:1,flag:'#c9a030',sailTint:G.FX.ship3d.pirateSailTint},2),again=image({furl:0},.5),pirate=image({furl:0,sailTint:G.FX.ship3d.pirateSailTint},.5),last=image({furl:0},.5);G.Ship3D.endFrame();
   return{isolated:open===again&&again===last,changed:open!==fold&&open!==pirate,stateUnchanged:before===JSON.stringify(G.Game.state)};
  });assert(Object.values(report.independent).every(Boolean));
  report.motion=await page.evaluate(()=>{
   window.__fleet(['geobukseon','lgalleon','junk','greatgalley','korakora','balsa']);const st=G.Scenes.sea.runtime(),s=G.Game.state,rows=[];
   for(const furl of [0,.5,1]){st.furl=furl;s.loc.heading=furl*2+.25;st.rig={fill:.9,brace:furl-.5,lee:furl===.5?-1:1};rows.push(window.__seaFrame());}return rows.map(r=>({draws:r.draws,stats:r.stats}));
  });for(let i=0;i<3;i++)assert(report.motion[i].draws.every(d=>d.ok&&d.furl===[0,.5,1][i]));
  // 장치 손실은 기존 그림으로, 복구 후에는 전체 함대의 실시간 모형으로 돌아온다.
  await page.evaluate(()=>{window.__shipGL=window.__gls[window.__gls.length-1];window.__loss=window.__shipGL.getExtension('WEBGL_lose_context');window.__loss.loseContext();});
  await page.waitForFunction(()=>G.Ship3D.stats().lost,null,{polling:50});
  report.lost=await page.evaluate(()=>window.__seaFrame());assert(report.lost.draws.every(d=>!d.ok));assert(report.lost.fallbacks.length>0);
  await page.evaluate(()=>window.__loss.restoreContext());await page.waitForFunction(()=>!G.Ship3D.stats().lost,null,{polling:50});
  report.restored=await page.evaluate(()=>window.__seaFrame());assert(report.restored.draws.every(d=>d.ok));assert.equal(report.restored.fallbacks.length,0);
  report.trim=await page.evaluate(()=>{G.Scenes.sea.runtime().npcs=[];G.Game.state.escort.now=null;G.Game.state.fleet.ships=[G.R.newShip('galleon')];return{stats:window.__seaFrame().stats,limit:1+G.FX.ship3d.idleModels};});assert(report.trim.stats.cachedTypes.length<=report.trim.limit);
  // 두 정크선이 공유하는 지붕 지도를 한 척 정리할 때 함께 해제하면, 남은 배의 다음 프레임에서 다시 업로드된다.
  report.sharedTextures=await page.evaluate(()=>{
   const cv=document.createElement('canvas'),ctx=cv.getContext('2d'),idle=G.FX.ship3d.idleModels;cv.width=600;cv.height=500;G.FX.ship3d.idleModels=0;
   function draw(id){G.Ship3D.draw(ctx,300,350,.5,200,{type:id,rig:{fill:.9}},1.25);}
   try{G.Ship3D.beginFrame();draw('junk');draw('ljunk');G.Ship3D.endFrame();G.Ship3D.beginFrame();draw('junk');G.Ship3D.endFrame();const before=G.Ship3D.stats();G.Ship3D.beginFrame();draw('junk');G.Ship3D.endFrame();return{before,after:G.Ship3D.stats()};}finally{G.FX.ship3d.idleModels=idle;}
  });for(const k of ['builds','geometries','textures'])assert.equal(report.sharedTextures.before[k],report.sharedTextures.after[k],'공유 지도 '+k);
  report.exit=await page.evaluate(()=>{G.Scenes.sea.exit('city');const gone=!G.Ship3D.stats().ready;G.Game.go('sea',{fresh:true});G.Scenes.sea.runtime().paused=true;const frame=window.__seaFrame();G.Scenes.sea.exit('city');return{gone,returned:frame.draws.every(d=>d.ok)&&frame.draws.length>0,released:!G.Ship3D.stats().ready};});assert(Object.values(report.exit).every(Boolean));
  assert.deepStrictEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('OK · 항해 36종·동행·호위·NPC · 모형 재사용 · 돛/깃발 분리 · 장치 복구 · 저장 불변 · 종료 해제');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
