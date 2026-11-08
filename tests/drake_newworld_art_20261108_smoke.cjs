/* 드레이크·콜럼버스 사건의 실제 얼굴·무릎상·장면과 누누·여왕 화자를 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/drake-newworld-art-20261108/runtime');
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/drake_newworld_art_20261108_prompts.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks={portraits:[],scenes:[],reused:[]};
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.DrakeCirc&&G.NewWorld&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await page.evaluate(async()=>{
   const s=G.Game.state=G.State.newGame({name:'세계 일주 그림 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   Object.assign(s.settings,{res:.35,sound:0,music:0});
   // 실제 합류 전 대사와 기사 서임식에서 받은 화자를 확인한다.
   const say=G.UI.say,pic=G.FamEv.showPic,toast=G.UI.toast,ask=G.UI.ask;
   G.UI.say=async(t,sp)=>{
    if(sp&&sp.name==='누누 다 실바')G.__nunoBeforeJoin=sp;
    if(sp&&sp.name==='엘리자베스 1세')G.__drakeQueen=sp;
   };
   G.FamEv.showPic=()=>({stop:async()=>{}});G.UI.toast=()=>{};G.UI.ask=async()=> 'pass';
   try{
    s.date={y:1579,m:4,d:14};s.loc={mode:'sea',lon:-96,lat:15};
    await G.DrakeCirc._t.legs.guatulco();
    s.date={y:1581,m:4,d:4};s.loc={mode:'city',city:38};
    await G.DrakeCirc._t.deptford();
   }finally{G.UI.say=say;G.FamEv.showPic=pic;G.UI.toast=toast;G.UI.ask=ask;}
   if(!G.__nunoBeforeJoin||!G.__drakeQueen)throw Error('실제 누누·여왕 화자 없음');
   G.__voyageSpeaker=id=>id==='dc_nuno'?G.__nunoBeforeJoin:id==='colon'?{name:'크리스토발 콜론',portrait:G.Art.rivalSpec('크리스토발 콜론'),half:G.Img.chain.rivalHalf('크리스토발 콜론')}:G.Hist.speaker(id);
   await G.Game.ensureGeo();
   await G.Game.go('city',{cityId:8,load:true});
  });
  async function closeDialog(){
   await page.waitForTimeout(250);await page.keyboard.press('Enter');
   await page.waitForFunction(()=>!document.querySelector('.dlg'),null,{timeout:5000});
   await page.evaluate(()=>window.__artDialog);
  }
  for(const row of plan.portraits){
   checks.portraits.push(await page.evaluate(async row=>{
    const base='portraits/history/'+row.id;
    for(const [key,w,h] of [[base,448,448],[base+'_half',1024,1536]]){
     const expected=row.id.startsWith('nw_')?'portraits/history/'+row.id+'_v20261108'+(key.endsWith('_half')?'_half':'')+'.webp':key+'.webp';
     if(G.Img.file(key)!==expected)throw Error('그림 연결 '+key);
     const im=await G.Img.load(key);
     if(!im||im.naturalWidth!==w||im.naturalHeight!==h)throw Error('그림 해독 '+key);
     if(!G.PORTRAIT_FACES[key])throw Error('얼굴 좌표 '+key);
    }
    const sp=G.__voyageSpeaker(row.id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
    if(face!==base||half!==base+'_half')throw Error('화자 연결 '+row.id+' '+face+' '+half);
    window.__artDialog=G.UI.say('새 사건 인물의 무릎상을 확인합니다.',sp);
    return {id:row.id,face,half};
   },row));
   await page.waitForSelector('.dlg-actor.active.tall');
   await page.waitForTimeout(350);
   await page.screenshot({path:path.join(OUT,row.id+'_half.png')});
   await closeDialog();
   await page.evaluate(id=>{const sp=G.__voyageSpeaker(id);sp.noStand=true;window.__artDialog=G.UI.say('얼굴상을 확인합니다.',sp);},row.id);
   await page.waitForSelector('.dlg .pframe');await closeDialog();
  }
  for(const row of plan.reused){
   checks.reused.push(await page.evaluate(async row=>{
    const sp=G.__voyageSpeaker(row.id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
    if(face!==row.key||half!==row.key+'_half')throw Error('기존 인물 연결 '+row.id+' '+face+' '+half+' 기대 '+row.key);
    if(!await G.Img.load(face)||!await G.Img.load(half))throw Error('기존 인물 해독 '+row.id);
    return {id:row.id,face,half};
   },row));
  }
  for(const row of plan.scenes){
   checks.scenes.push(await page.evaluate(async row=>{
    const key='legend-events/'+row.id,im=await G.Img.load(key);
    const expected=key+(row.id.startsWith('nw_')||['dc_lima','dc_john'].includes(row.id)?'_v20261108':'')+'.webp';
    if(G.Img.file(key)!==expected)throw Error('사건샷 새 원화 연결 '+key);
    if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('사건샷 해독 '+key);
    window.__artScene=G.FamEv.showPic({img:key,title:row.title});await window.__artScene.ready;
    window.__artDialog=G.UI.say('사건 장면과 화자의 얼굴을 확인합니다.',G.__voyageSpeaker(row.refs[0]));
    return {id:row.id,width:im.naturalWidth,height:im.naturalHeight};
   },row));
   await page.waitForSelector('.famscene.on img');await page.waitForSelector('.dlg .pframe');
   await page.evaluate(()=>document.querySelector('.famscene img').decode());
   await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.famscene')).opacity)>.99);
   assert.equal(await page.locator('.dlg-actor.active.tall').count(),0,'장면에 무릎상 겹침');
   await page.screenshot({path:path.join(OUT,row.id+'.png')});await closeDialog();
   await page.evaluate(async()=>{await window.__artScene.stop();});
   assert.equal(await page.locator('.famscene').count(),0,'장면 정상 종료');
  }
  const catalog=await context.newPage();catalog.on('pageerror',e=>errors.push(e.message));
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'load',timeout:60000});
  await catalog.waitForFunction(()=>window.G&&G.MATE&&G.MATE.dc_nuno);
  checks.catalog=await catalog.evaluate(()=>{
   const key=G.Img.pick(G.Img.chain.mateHalf('dc_nuno'));
   if(key!=='portraits/history/dc_nuno_half')throw Error('도감 누누 무릎상 '+key);
   return {mate:'dc_nuno',half:key};
  });
  checks.queen=await page.evaluate(()=>{
   const sp=G.__drakeQueen,face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
   if(face!=='portraits/history/elizabeth_player'||half!==face+'_half')throw Error('서임식 여왕 초상 '+face+' '+half);
   return {face,half};
  });
  assert.equal(checks.portraits.length,20);assert.equal(checks.scenes.length,24);
  assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(failed,[]);
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checks,errors,failed},null,2));
  console.log('인물 20명 얼굴·무릎 40장, 기존 주인공 2명·여왕, 사건샷 24장: 합류 전 누누·대화·표시·종료·도감 통과. 콘솔 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
