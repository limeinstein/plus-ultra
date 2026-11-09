/* 천일야화 새 원화의 실제 화자·대화·장면·도감 연결을 파일 실행으로 검사한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/nights-art-20261109/runtime');
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/nights_art_20261109_prompts.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks={portraits:[],scenes:[]};
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Nights&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(async()=>{
   const s=G.Game.state=G.State.newGame({name:'천일야화 그림 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(s.settings,{res:.35,sound:0,music:0});
   await G.Game.ensureGeo();await G.Game.go('city',{cityId:127,load:true});
  });
  async function closeDialog(){
   await page.waitForTimeout(250);await page.keyboard.press('Enter');
   await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});
   await page.evaluate(()=>window.__artDialog);
  }
  for(const row of plan.portraits){
   checks.portraits.push(await page.evaluate(async row=>{
    for(const [key,w,h] of [[row.base,448,448],[row.base+'_half',1024,1536]]){
     const im=await G.Img.load(key);
     if(!im||im.naturalWidth!==w||im.naturalHeight!==h)throw Error('그림 해독 '+key);
     if(!G.PORTRAIT_FACES[key])throw Error('얼굴 좌표 '+key);
    }
    const id=row.id.startsWith('an_')?row.id:'an_'+row.id;
    const sp=G.Hist.speaker(id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
    if(face!==row.base||half!==row.base+'_half')throw Error('화자 연결 '+row.id+' '+face+' '+half);
    window.__artDialog=G.UI.say('천일야화 인물의 무릎상을 확인합니다.',sp);
    return {id:row.id,face,half};
   },row));
   await page.waitForSelector('.dlg-actor.active.tall');await page.waitForTimeout(350);
   await page.screenshot({path:path.join(OUT,row.id+'_half.png')});await closeDialog();
   await page.evaluate(id=>{const sp=G.Hist.speaker(id.startsWith('an_')?id:'an_'+id);sp.noStand=true;window.__artDialog=G.UI.say('얼굴상을 확인합니다.',sp);},row.id);
   await page.waitForSelector('.dlg .pframe');await closeDialog();
  }
  checks.companions=await page.evaluate(()=>['qamar','nadira','sinbad'].map(id=>{
   const sp=G.Legend.speaker(id),base='portraits/legendary/'+id;
   if(G.Img.pick(G.Art.portraitKeys(sp.portrait))!==base||G.Img.pick(sp.half)!==base+'_half')throw Error('합류 뒤 초상 '+id);
   return id;
  }));
  checks.sponsor=await page.evaluate(()=>{
   G.Game.state.nights={harun:{done:1}};
   const sp=G.Sponsor.face(G.SPONSOR.ar_harun),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
   if(!face||!half||G.Img.file(face)!=='portraits/history/an_harun.webp'||G.Img.file(half)!=='portraits/history/an_harun_half.webp')throw Error('후원자 하룬 '+face+' '+half);
   return {face,half};
  });
  for(const row of plan.scenes){
   checks.scenes.push(await page.evaluate(async row=>{
    const key='legend-events/'+row.id,im=await G.Img.load(key);
    if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('사건샷 '+key);
    window.__artScene=G.FamEv.showPic({img:key,title:row.name});await window.__artScene.ready;
    window.__artDialog=G.UI.say('이야기 속 사건 장면을 확인합니다.',G.Hist.speaker(row.id==='an_flight'?'an_nadira':'an_harun'));
    return {id:row.id,width:im.naturalWidth,height:im.naturalHeight};
   },row));
   await page.waitForSelector('.famscene.on img');await page.waitForSelector('.dlg .pframe');
   await page.evaluate(()=>document.querySelector('.famscene img').decode());
   await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.famscene')).opacity)>.99);
   assert.equal(await page.locator('.dlg-actor.active.tall').count(),0,'장면에 무릎상 겹침');
   await page.screenshot({path:path.join(OUT,row.id+'.png')});await closeDialog();
   await page.evaluate(async()=>{await window.__artScene.stop();});
   assert.equal(await page.locator('.famscene').count(),0,'장면 종료');
  }
  const catalog=await context.newPage();catalog.on('pageerror',e=>errors.push(e.message));
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'load',timeout:60000});
  await catalog.waitForFunction(()=>window.G&&G.MATE&&G.MATE.nadira);
  checks.catalog=await catalog.evaluate(()=>{
   const mates=['qamar','nadira'].map(id=>{const key=G.Img.pick(G.Img.chain.mateHalf(id));if(key!=='portraits/legendary/'+id+'_half')throw Error('도감 '+id);return key;});
   const scenes=G.CATALOG_SCENES.filter(x=>/^legend-events\/an_/.test(x.key));
   if(scenes.length!==9)throw Error('사건 도감 '+scenes.length);
   return {mates,scenes:scenes.length};
  });
  assert.equal(checks.portraits.length,6);assert.equal(checks.scenes.length,9);
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checks,errors,failed},null,2));
  console.log('천일야화 인물 6명 얼굴·무릎 12장, 사건샷 9장, 합류 전후·후원자·도감·장면 종료 통과. 콘솔 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
