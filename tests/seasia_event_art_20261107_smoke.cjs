/* 실제 file:// 게임에서 동남아 네 사건 묶음의 그림·얼굴·무릎 표시와 종료를 확인한다. */
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/seasia_event_art_20261107_prompts.json'),'utf8'));
const OUT=path.join(ROOT,'artifacts/seasia-event-art-20261107/runtime');
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
  await page.waitForFunction(()=>window.G&&G.Game&&G.Hist&&G.SEAsia&&G.MacDang&&G.SpiceMactan&&G.SundaJohor&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(()=>{
   const s=G.Game.state=G.State.newGame({name:'동남아 사건 그림 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(s.settings,{res:.35,sound:0,music:0});
   G.__seaArtSpeaker=row=>row.folder==='history'?G.Hist.speaker(row.id):G.Legend.speaker(row.id);
  });
  for(const row of plan.portraits){
   checks.portraits.push(await page.evaluate(async row=>{
    const base='portraits/'+row.folder+'/'+row.id;
    for(const [key,w,h] of [[base,448,448],[base+'_half',1024,1536]]){
     if(G.Img.file(key)!==key+'.webp')throw Error('그림 연결 '+key);
     const im=await G.Img.load(key);
     if(!im||im.naturalWidth!==w||im.naturalHeight!==h)throw Error('그림 해독 '+key);
     if(!G.PORTRAIT_FACES[key])throw Error('얼굴 좌표 '+key);
    }
    const sp=G.__seaArtSpeaker(row),pickedFace=G.Img.pick(G.Art.portraitKeys(sp.portrait)),pickedHalf=G.Img.pick(sp.half);
    if(pickedFace!==base||pickedHalf!==base+'_half')throw Error('화자의 얼굴·몸 불일치 '+row.id+' '+pickedFace+' '+pickedHalf);
    window.__artDialog=G.UI.say('동남아 사건의 인물화를 확인합니다.',sp);
    return {id:row.id,face:pickedFace,half:pickedHalf};
   },row));
   await page.waitForSelector('.dlg-actor.active.tall',{timeout:15000});
   if(['sa_bayinnaung','sa_setthathirath','md_ninh','md_huyen','md_kien','sm_naira','sm_bulan','sj_ratna','sj_kumala','sj_ali'].includes(row.id))
    await page.screenshot({path:path.join(OUT,row.id+'_half.png')});
   await page.waitForTimeout(250);await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});await page.evaluate(()=>window.__artDialog);
   await page.evaluate(row=>{const sp=G.__seaArtSpeaker(row);sp.noStand=true;window.__artDialog=G.UI.say('얼굴상을 확인합니다.',sp);},row);
   await page.waitForSelector('.dlg .pframe');
   await page.waitForTimeout(250);await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});await page.evaluate(()=>window.__artDialog);
  }
  for(const row of plan.scenes){
   const portrait=plan.portraits.find(p=>p.id===row.refs[0])||plan.portraits.find(p=>p.id.startsWith(row.id.slice(0,3)));
   checks.scenes.push(await page.evaluate(async({row,portrait})=>{
    const key='legend-events/'+row.id,im=await G.Img.load(key);
    if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('사건샷 해독 '+key);
    window.__artScene=G.FamEv.showPic({img:key,title:row.title});await window.__artScene.ready;
    window.__artDialog=G.UI.say('동남아 사건 장면과 인물의 얼굴을 확인합니다.',G.__seaArtSpeaker(portrait));
    return {id:row.id,width:im.naturalWidth,height:im.naturalHeight};
   },{row,portrait}));
   await page.waitForSelector('.famscene.on img');await page.waitForSelector('.dlg .pframe');
   await page.evaluate(()=>document.querySelector('.famscene img').decode());
   assert.equal(await page.locator('.dlg-actor.active.tall').count(),0,'사건샷 위에 무릎상을 겹치지 않음');
   await page.screenshot({path:path.join(OUT,row.id+'.png')});
   await page.waitForTimeout(250);await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});await page.evaluate(async()=>{await window.__artDialog;await window.__artScene.stop();});
   assert.equal(await page.locator('.famscene').count(),0,'사건샷 정상 종료');
  }
  const catalog=await context.newPage();
  catalog.on('pageerror',e=>errors.push(e.message));
  catalog.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'load',timeout:60000});
  await catalog.waitForFunction(()=>window.G&&G.MATE&&G.MATE.sj_kumala);
  await catalog.evaluate(rows=>rows.forEach(row=>{
   const base='portraits/mates/'+row.id;
   if(!G.MATE[row.id]||G.Img.pick(G.Img.chain.mateHalf(row.id))!==base+'_half')throw Error('도감 동료 '+row.id);
  }),plan.portraits.filter(p=>p.folder==='mates'));
  assert.equal(checks.portraits.length,37);assert.equal(checks.scenes.length,40);
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checks,errors,failed},null,2));
  console.log('동남아 인물 37명 얼굴·무릎 74장, 사건샷 40장: 실제 화자 연결·해독·대화·표시·종료 통과. 콘솔 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
