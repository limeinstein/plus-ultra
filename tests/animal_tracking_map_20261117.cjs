/* 실제 지형 위의 발자국·점멸 그림, 전체 갤러리의 로딩을 확인한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=(process.env.OUT || path.join(root,'artifacts/animal-tracking-20261117'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
try{const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' @'+m.location().url);});
 await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.G&&G.AnimalTracking&&G.Game.sceneName==='title',null,{timeout:120000});
 await page.evaluate(async()=>{G.Scenes.title.exit();await G.Loader.hide();G.UI.clearScreen();G.State.newGame({name:'동물 흔적',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state.settings.res=.35;await G.Game.ensureGeo();await G.Img.preload(['animal-tracking/footprints',...Array.from({length:17},(_,i)=>'animal-tracking/animals-'+(i+1))].map(k=>[k]));G.Disc.needMet=d=>d.id==='tiger'||d.id==='dolphin';G.Disc.built=()=>true;G.Disc.opened=()=>true;});
 for(const mode of ['land','sea']){
  await page.evaluate(mode=>{const d=G.DISC[mode==='land'?'tiger':'dolphin'],p=G.AnimalTracking.position(d);G.Game.go(mode,mode==='land'?{from:0}:{depart:0});const l=G.Game.state.loc,st=G.Scenes[mode].runtime();l.lon=p.lon-.9;l.lat=p.lat;st.cam.lon=p.lon-.7;st.cam.lat=p.lat;st.cam.zoom=mode==='land'?190:130;st.paused=true;st.t=3.6*(.5-((G.U.strHash(d.id)>>>0)%1000/1000));for(let i=0;i<6;i++)G.Scenes[mode].update(0);},mode);
  await page.screenshot({path:path.join(out,'map-'+mode+'.png')});
 }
 await page.goto(pathToFileURL(path.join(root,'tests/fixtures/animal-tracking-gallery.html')).href);await page.waitForFunction(()=>document.querySelectorAll('.card').length===261);await page.locator('#pulse').click();await page.locator('#search').fill('호랑이');assert(await page.locator('.card:visible').count()>0);await page.locator('#search').fill('');assert.equal(await page.locator('.card:visible').count(),261);await page.screenshot({path:path.join(out,'gallery-preview.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'map-result.json'),JSON.stringify({land:true,sea:true,gallery:261,errors},null,2));console.log('뭍·바다 실제 화면, 전체 261종 갤러리·검색, 콘솔 오류 0');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
