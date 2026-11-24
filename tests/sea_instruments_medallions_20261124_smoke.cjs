/* 실제 바람 계기·확대 조작과 같은 높이·왼쪽 정렬의 명패를 검사한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/sea-instruments-medallions-20261124');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={layouts:[],zoom:[]};let page;
 try{
  page=await browser.newPage({viewport:{width:1600,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{
   localStorage.clear();localStorage.setItem('pu.lang','ko');localStorage.setItem('pu.uiSize','normal');
   const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?0:raf(cb);
  });
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.evaluate(async()=>{
   await G.Game.ensureGeo();G.Nav.init();
   const s=G.Game.state=G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   s.settings.res=.35;s.flags.prologue=true;G.State.save=()=>{};G.SEA_RISK.pirate=0;G.SEA_RISK.storm=0;
   G.Game.go('sea',{depart:0});const r=G.Scenes.sea.runtime();r.paused=true;r.manual=true;r.path=null;r.target=null;r.vel=[0,0];
   s.loc.lon=-11;s.loc.lat=38;s.loc.heading=Math.PI;r.cam.lon=-11;r.cam.lat=38;r.wind={dir:0,spd:.6};r.windVis={dir:0,spd:.6};if(r.vfx)r.vfx.sendoff=null;
   window.__instrumentTick=(n=24,dt=.0001)=>{for(let i=0;i<n;i++){r.dayAcc=0;G.Scenes.sea.update(dt);}};
   window.__instrumentTick();
  });
  await page.waitForSelector('.wind-medallions .wi-row');await page.waitForSelector('.zoom-medallions');
  console.log('실제 항해 계기 생성');
  assert.equal(await page.locator('[data-wind-row="direction"]').innerText(),'서풍');
  assert.equal(await page.locator('[data-wind-row="relation"]').innerText(),'역풍');
  assert.equal(await page.locator('.wi-pip').count(),5);
  assert.equal(await page.locator('.wi-pip.filled').count(),3);
  assert.equal(await page.locator('.zoom-medallions button').count(),4);
  async function target(action,expected){
   await page.locator('[data-zoom-action="'+action+'"]').click();
   const value=await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT);
   assert.ok(Math.abs(value-expected)<.001,action+': '+value);report.zoom.push({action,target:value});
   await page.evaluate(()=>window.__instrumentTick(24,.1));
  }
  await target('in',137.5);await target('reset',110);await target('out',88);await target('ship',330);
  assert.equal(await page.locator('.zoom-medallions output').innerText(),'3.0×');
  await target('reset',110);assert.equal(await page.locator('.zoom-medallions output').innerText(),'1.0×');
  await page.locator('[data-zoom-action="in"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),137.5);
  assert.equal(await page.evaluate(()=>G.Game.sceneName),'sea');assert.equal(await page.evaluate(()=>G.UI.busy()),false);
  await page.evaluate(()=>{const r=G.Scenes.sea.runtime();r.cam.zoom=110;r.cam.zoomT=0;});
  await page.locator('[data-zoom-action="reset"]').focus();await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.zoomAction),'ship');
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),330);
  await page.evaluate(()=>{document.activeElement.blur();const r=G.Scenes.sea.runtime();r.cam.zoom=110;r.cam.zoomT=0;});
  await page.keyboard.press('Equal');assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),132);
  await page.evaluate(()=>{const r=G.Scenes.sea.runtime();r.cam.zoom=110;r.cam.zoomT=0;document.querySelector('.mapcatch').dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}));});
  assert.ok(Math.abs(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT)-126.5)<.001);
  await page.evaluate(()=>{const r=G.Scenes.sea.runtime();r.cam.zoom=110;r.cam.zoomT=0;window.__instrumentTick();});
  console.log('통과: 확대·축소·선박 3배·기본 배율·키보드·휠·배율 표시');
  async function layout(width,height,size,extra){
   await page.setViewportSize({width,height});await page.evaluate(s=>G.Game.setUiSize(s),size);await page.waitForTimeout(180);
   await page.evaluate(ex=>{
    if(ex){document.querySelector('.wtxt').innerHTML=G.SeaInstruments.rows({direction:'북동풍',strength:5,relation:'비스듬한 역풍',cloud:'편서풍 구름띠',monsoon:'남서 계절풍 ~11/24',rain:'폭우',rowing:true});G.SeaInstruments.fit();}
    else {document.querySelector('.wtxt')._html=null;window.__instrumentTick();}
   },extra);
   const r=await page.evaluate(()=>{
    const box=e=>{const x=e.getBoundingClientRect();return {x:x.x,y:x.y,right:x.right,bottom:x.bottom,width:x.width,height:x.height};};
    const wb=document.querySelector('.wind-medallions'),zb=document.querySelector('.zoom-medallions');
    return {wind:box(wb),zoom:box(zb),bar:box(document.querySelector('.sea-command-bridge')),obstacles:[...document.querySelectorAll('.sea-command-bridge .sb-wing,.sb-speed-dial')].map(box),rows:[...wb.querySelectorAll('.wi-row')].map(e=>({text:e.innerText,box:box(e),copy:box(e.querySelector('.wi-copy')),overflow:e.scrollWidth>e.clientWidth+1||e.querySelector('.wi-copy').scrollWidth>e.querySelector('.wi-copy').clientWidth+1})),controls:[...zb.querySelectorAll('button,output')].map(e=>({text:e.innerText,box:box(e),overflow:e.scrollWidth>e.clientWidth+1})),compass:box(wb.querySelector('.wi-compass'))};
   });
   assert.equal(r.rows.length,extra?7:4);
   for(const row of r.rows){
    assert.ok(Math.abs(row.box.height-r.rows[0].box.height)<.1,'모든 명패의 높이');
    assert.ok(Math.abs(row.box.x-r.rows[0].box.x)<.1,'모든 명패의 왼쪽 선');
    assert.ok(Math.abs(row.copy.x-r.rows[0].copy.x)<.1,'모든 글의 시작선');
    assert.equal(row.overflow,false,width+' '+row.text);
   }
   assert.ok(r.wind.x>=0&&r.wind.right<=width+1);
   r.obstacles.forEach(o=>assert.ok(r.wind.right<=o.x||r.wind.x>=o.right||r.wind.bottom<=o.y||r.wind.y>=o.bottom,'실제 명령 단추·중앙 다이얼과 겹침 없음'));
   assert.ok(r.zoom.x>=0&&r.zoom.right<=width+1&&r.zoom.bottom<r.wind.y,width+' 계기 사이 겹침');
   r.controls.forEach(c=>{assert.equal(c.overflow,false);assert.ok(c.box.x>=r.zoom.x-1&&c.box.right<=r.zoom.right+1);});
   await page.mouse.move(width/2,height/3);await page.evaluate(()=>document.activeElement.blur());
   await page.screenshot({path:path.join(OUT,'instruments-'+width+'-'+size+(extra?'-7rows':'')+'.png')});
   report.layouts.push({width,height,size,extra,...r});
   console.log('통과: '+width+' '+size+' '+r.rows.length+'줄 — 같은 높이·왼쪽 정렬·글자·판 겹침 없음');
  }
  for(const [w,h,size] of [[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]){await layout(w,h,size,false);await layout(w,h,size,true);}
  // 어두운 폭우 배경의 실제 기상 행을 검사한다.
  await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>{
   G.Game.setUiSize('normal');const r=G.Scenes.sea.runtime();r.storm=1;G.Game.state.rain={lv:2,days:2,order:'work',asked:true,got:0,n:1};window.__instrumentTick(24,.05);
  });
  assert.equal(await page.locator('[data-wind-row="rain"]').count(),1);
  await page.screenshot({path:path.join(OUT,'instruments-storm.png')});
  // 옮기기와 제자리 기능도 원래 작은 계기판과 같다.
  const before=await page.locator('.wind-medallions').boundingBox();
  await page.mouse.move(before.x+70,before.y+70);await page.mouse.down();await page.mouse.move(before.x+10,before.y+35,{steps:4});await page.mouse.up();
  assert.equal(await page.locator('.wind-medallions.hp-moved').count(),1);
  await page.locator('.wind-medallions .hp-reset').click();assert.equal(await page.locator('.wind-medallions.hp-moved').count(),0);
  await page.evaluate(()=>G.Game.go('land',{from:0}));await page.waitForSelector('.land-bar');assert.equal(await page.locator('.wind-medallions,.zoom-medallions').count(),0);
  await page.evaluate(()=>G.Game.go('sea',{fresh:true}));await page.waitForSelector('.wind-medallions');
  assert.equal(await page.locator('.wi-compass').count(),1);assert.equal(await page.locator('.zoom-medallions').count(),1);
  assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log('통과: 폭우·이동/제자리·육상 왕복·콘솔 오류 0');
 }catch(e){if(page){console.error(await page.evaluate(()=>document.querySelector('#ui').innerText.slice(-1600)).catch(()=>''));await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
