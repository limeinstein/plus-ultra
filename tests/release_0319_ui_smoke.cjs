'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/release-0.319-20261107');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
 const errors=[];const report={};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;const NativeAudio=window.Audio;window.__qaAudio=[];window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.__qaAudio.push(this);}};});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(()=>G.Game.ensureGeo());
  report.save=await page.evaluate(async()=>{
   const s=G.Game.state=G.State.newGame({name:'저장 검증',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});s.settings.res=.35;s.settings.saveFile=true;G.State.rememberSettings(s.settings);
   const choose=G.UI.choose,confirm=G.UI.confirm,toast=G.UI.toast,exp=G.State.exportSlot;let exported=0,line='';
   try{G.UI.choose=async()=>G.State.JOURNAL_SLOTS[0];G.UI.confirm=async()=>true;G.UI.toast=t=>{line=t;};G.State.exportSlot=()=>{exported++;return 'journal.json';};
    const ok=await G.Info.saveMenu(),slot=G.State.JOURNAL_SLOTS[0],m=G.State.meta(slot);return {ok,exported,line,expected:G.State.savedLine(m),preference:G.State.newSettings('normal').saveFile,privateFile:await G.State.privateWindow(),serialized:!!G.State.deserialize(G.State.serialize())};
   }finally{G.UI.choose=choose;G.UI.confirm=confirm;G.UI.toast=toast;G.State.exportSlot=exp;}
  });
  assert(report.save.ok&&report.save.exported===1&&report.save.line===report.save.expected&&report.save.preference&&report.save.serialized&&!report.save.privateFile);
  const detector=await page.evaluate(()=>G.State.privateWindow.toString());
  const storagePage=await browser.newPage();await storagePage.route('http://127.0.0.1:4179/private-qa',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>저장 환경 검증</title>'}));await storagePage.goto('http://127.0.0.1:4179/private-qa');
  report.private=await storagePage.evaluate(async fn=>{const detect=eval('('+fn+')');Object.defineProperty(performance,'memory',{value:{jsHeapSizeLimit:1024**3},configurable:true});const result=[];for(const quota of [100*1024**3,100*1024**2]){navigator.storage.estimate=async()=>({quota});result.push(await detect());}navigator.storage.estimate=async()=>{throw Error('estimate unavailable');};result.push(await detect());return result;},detector);assert.deepEqual(report.private,[false,true,false]);await storagePage.close();
  report.folk=await page.evaluate(()=>({count:G.ASIA_FOLK.length,need:G.ASIA_FOLK.every(id=>Array.isArray(G.DISC[id].need)&&G.DISC[id].need.length),portraits:G.ASIA_FOLK.every(id=>G.FOLK_JOIN[id]?.portraits?.f?.length)}));assert(report.folk.count===18&&report.folk.need&&report.folk.portraits);
  await page.evaluate(()=>{const s=G.Game.state;s.fleet.ships=[G.R.newShip('caravel','첫 배'),G.R.newShip('carrack','둘째 배')];s.fleet.crew=40;G.Scenes.city.B.shipyard.refit(G.CITY_DATA[0]);});
  await page.waitForSelector('.yhead');
  report.shipyard=await page.evaluate(()=>{const head=document.querySelector('.yhead'),rows=[...document.querySelectorAll('.yrow')],modal=head.closest('.win')||head.parentElement;const last=rows[0].lastElementChild.getBoundingClientRect(),box=modal.getBoundingClientRect();return {columns:head.children.length,rows:rows.length,lastRight:last.right,modalRight:box.right,text:head.textContent};});
  assert.equal(report.shipyard.columns,10);assert.equal(report.shipyard.rows,2);
  await page.evaluate(()=>G.Loader.hide());await page.waitForTimeout(500);
  await page.screenshot({path:path.join(OUT,'shipyard-1440.png')});
  await page.setViewportSize({width:960,height:540});await page.evaluate(()=>G.Loader.hide());await page.waitForTimeout(500);
  report.shipyard.narrow=await page.evaluate(()=>{const h=document.querySelector('.yhead'),r=h.lastElementChild.getBoundingClientRect(),m=(h.closest('.win')||h.parentElement).getBoundingClientRect();return {lastRight:r.right,modalRight:m.right};});
  console.log('조선소 좁은 화면',JSON.stringify(report.shipyard.narrow));
  fs.writeFileSync(path.join(OUT,'ui-checks.json'),JSON.stringify(report,null,2));
  await page.screenshot({path:path.join(OUT,'shipyard-960.png')});
  assert(report.shipyard.narrow.lastRight<=report.shipyard.narrow.modalRight-3,'좁은 창에서 마지막 열도 창 안에 표시');
  await page.screenshot({path:path.join(OUT,'shipyard-960.png')});await page.keyboard.press('Escape');
  await page.evaluate(()=>{G.Game.state.settings.music=.35;G.Audio.unlock();G.Audio.music('title',true);G.Audio.jingle('victory');});
  fs.writeFileSync(path.join(OUT,'ui-checks.json'),JSON.stringify(report,null,2));
  await page.waitForFunction(()=>{const s=G.Audio.jingleStatus();return s&&s.time>.1&&s.duck<.4;},null,{timeout:20000,polling:100});
  report.jingle=await page.evaluate(()=>G.Audio.jingleStatus());
  await page.evaluate(()=>{const el=window.__qaAudio.find(a=>decodeURI(a.src).includes('발견 승리 팡파르'));el.pause();el.dispatchEvent(new Event('ended'));});
  await page.waitForFunction(()=>G.Audio.jingleStatus().duck===1,null,{timeout:5000,polling:100});assert(!report.jingle.err);assert.deepEqual(errors,[]);
  report.errors=errors;fs.writeFileSync(path.join(OUT,'ui-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
