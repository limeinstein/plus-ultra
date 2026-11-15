/* 실제 창의 배경 정지·복귀, 중첩 정지, 빠른 화질 배율과 기함 3D 캐시를 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/render-pause-runtime');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:960,height:540}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.addInitScript(()=>localStorage.setItem('pu.lang','ko'));
  await page.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const quality=await page.evaluate(async()=>{
   G.Scenes.title.exit();await G.Loader.hide();G.UI.clearScreen();G.State.newGame({name:'렌더 검사',nation:'PT',job:'explorer',age:28,birth:{m:1,d:1},st:{str:70,int:60,mar:70,cha:60},sk:{sword:2},lg:[],diff:'normal'});
   G.Game.state.settings.autosave=false;window._backgroundUpdates=0;G.Game.scene={update(){window._backgroundUpdates++;}};G.Game.sceneName='render_probe';
   G.Game.state.settings.res=1;G.Game.fit();const a=G.Game.canvases(),full={world:a.world.width,overlay:a.overlay.width};
   G.Game.state.settings.res=.35;G.Game.fit();const b=G.Game.canvases(),fast={world:b.world.width,overlay:b.overlay.width};return {full,fast};
  });
  assert(quality.fast.world<quality.full.world);assert.equal(quality.fast.overlay,quality.full.overlay,'기존 오버레이 화질 유지');
  await page.waitForFunction(()=>window._backgroundUpdates>=2);
  const nested=await page.evaluate(()=>{const a=G.UI.window({title:'뒤쪽',html:'',pauseScene:true}),b=G.UI.window({title:'앞쪽',html:'',pauseScene:true});const x=G.UI.scenePaused(a.back);b.close();const y=G.UI.scenePaused();a.close();return [x,y,G.UI.scenePaused()];});assert.deepEqual(nested,[true,true,false]);
  const cadence=await page.evaluate(()=>[30,60,120,144,240].map(hz=>{const clock={};let frames=0,last=0,elapsed=0;for(let i=0;i<hz;i++){const t=i*1000/hz;if(G.Game.frameDue(clock,t)){frames++;elapsed+=(t-last)/1000;last=t;}}return {hz,frames,elapsed};}));
  for(const r of cadence){assert(r.frames<=Math.min(r.hz,60)+1);assert(r.frames>=Math.min(r.hz,60)-1);assert(r.elapsed>.94&&r.elapsed<=1);}
  await page.evaluate(()=>{window._duelPromise=G.Games.duel({name:'연습 상대',sprite:'spanish_soldier',str:60,mar:60,skill:2,atk:7,def:3},{place:'explore',fastEnd:true});});
  await page.waitForFunction(()=>G.UI.scenePaused()&&document.querySelector('.duel-win .rd-sys'));
  const before=await page.evaluate(()=>({updates:window._backgroundUpdates,date:JSON.stringify(G.Game.state.date)}));await page.waitForTimeout(300);const during=await page.evaluate(()=>({updates:window._backgroundUpdates,date:JSON.stringify(G.Game.state.date)}));assert.deepEqual(during,before,'일기토 중 배경과 시간 정지');
  await page.screenshot({path:path.join(OUT,'duel-paused.png')});await page.locator('.duel-win .rd-sys button').filter({hasText:'물러선다'}).click();assert.equal(await page.evaluate(()=>window._duelPromise),'flee');
  await page.waitForFunction(n=>!G.UI.scenePaused()&&window._backgroundUpdates>n,before.updates);
  const cache=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d'),P=G.Ship3D,spec={type:'caravel',sid:'f0',flag:'PT',furl:0};
   const descriptor=Object.getOwnPropertyDescriptor(performance,'now'),fixed=performance.now();Object.defineProperty(performance,'now',{configurable:true,value:()=>fixed});
   try{
    if(!P.draw(ctx,256,300,0,110,spec,0))throw Error('3D 기함 생성 실패');const a=P.stats();
    if(!P.draw(ctx,256,300,0,110,spec,0))throw Error('3D 기함 다시 그리기 실패');const b=P.stats();
    if(!P.draw(ctx,256,300,.4,110,spec,0))throw Error('3D 기함 방향 변경 실패');const c=P.stats();
    const pixels=ctx.getImageData(0,0,512,512).data;let visible=false;for(let i=3;i<pixels.length;i+=4)if(pixels[i]){visible=true;break;}
    return {first:a.frames,reused:b.frames,turned:c.frames,drawn:[a.drawn,b.drawn,c.drawn],visible,failures:c.failures};
   }finally{if(descriptor)Object.defineProperty(performance,'now',descriptor);else delete performance.now;P.dispose();}
  });
  assert.equal(cache.reused,cache.first,'같은 기함의 3D 결과 재사용');assert.equal(cache.turned,cache.first+1,'방향이 바뀌면 새로 그림');assert(cache.visible);assert.deepEqual(cache.failures,{});assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({quality,nested,cadence,paused:before,duel:'flee',cache,errors},null,2));console.log(JSON.stringify({ok:true,quality,nested,cadence,cache,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
