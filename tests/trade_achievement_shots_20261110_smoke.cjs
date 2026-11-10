/* 새 교역 업적샷 6종의 전용 연결·해독·달성 장면·팝업·종료·도감을 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/trade-achievement-shots-20261110/runtime');
const spec=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/trade_achievement_shots_20261110_prompts.json'),'utf8'));
(async()=>{
 assert.equal(spec.scenes.length,6);assert.equal(new Set(spec.scenes.map(r=>r.key)).size,6);
 for(const row of spec.scenes)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,row.file))).digest('hex'),row.sha256,row.id+' 원화 무결성');
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failures=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});};
  const page=await context.newPage();watch(page);
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Achieve&&G.FamEv&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const coverage=await page.evaluate(async rows=>{
   const special={montcrew:'legend-events/montcrew_oath',happily:'legend-events/happily_after_all'};
   const missing=G.ACHIEVEMENTS.filter(a=>!G.Img.has(((G.ACHV_EVENTS||{})[a.id]||{}).pic||special[a.id]||'achievement-events/'+a.id)).map(a=>a.id);
   if(missing.length)throw Error('전체 업적 그림 누락 '+missing.join(','));
   for(const r of rows){const a=G.Achieve.get(r.id),e=G.ACHV_EVENTS[r.id];if(!a||e.pic!==r.key||e.picTitle!==r.name)throw Error(r.id+' 전용 장면 연결');const im=await G.Img.load(r.key);if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error(r.id+' 그림 해독·규격');}
   G.Game.state=G.State.newGame({name:'교역 업적샷 확인',nation:'PT',job:'trader',age:35,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(G.Game.state.settings,{res:.35,sound:0,music:0,autosave:false});G.UI.clearScreen();
   return {total:G.ACHIEVEMENTS.length,missing};
  },spec.scenes);
  for(const row of spec.scenes){
   await page.evaluate(id=>{window.__tradeArtDone=false;window.__tradeArtPromise=G.Achieve.scene(G.Achieve.get(id)).then(()=>{window.__tradeArtDone=true;});},row.id);
   await page.waitForFunction(id=>{const im=document.querySelector('.famscene.on img');return im&&im.complete&&im.naturalWidth>0&&im.src.includes('/'+id+'.');},row.id,{timeout:30000});
   assert.equal(await page.locator('.dlg-actor.active.tall').count(),0,'업적샷 앞 무릎상 겹침 없음');
   await page.screenshot({path:path.join(OUT,row.id+'.png')});
   let popup=false;
   for(let attempt=0;attempt<16;attempt++){
    if(await page.evaluate(()=>window.__tradeArtDone))break;
    const button=page.locator('.modal-back button.navy').last();
    if(await button.isVisible()){popup=true;await button.click();}else await page.keyboard.press('Enter');
    await page.waitForTimeout(270);
   }
   await page.waitForFunction(()=>window.__tradeArtDone,null,{timeout:5000});
   await page.evaluate(()=>window.__tradeArtPromise);
   assert(popup,row.id+' 업적 보상 창');
   assert.equal(await page.locator('.famscene').count(),0,row.id+' 장면 종료 정리');
  }
  const catalog=await context.newPage();watch(catalog);
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await catalog.waitForFunction(()=>window.G&&G.ACHV_EVENTS&&G.Img,null,{timeout:60000});
  await catalog.evaluate(rows=>rows.forEach(r=>{if(G.ACHV_EVENTS[r.id].pic!==r.key||G.Img.file(r.key)!==r.file.replace(/^images\//,''))throw Error(r.id+' 도감 그림 연결');}),spec.scenes);
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failures,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({coverage,shots:spec.scenes.map(r=>r.id),errors,failures},null,2));
  console.log('전체 업적 '+coverage.total+'종 그림 누락0. 새 6종 전용 장면·규격·달성 팝업·닫힘·도감 통과. 브라우저 오류0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
