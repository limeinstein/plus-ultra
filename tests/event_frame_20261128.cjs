/* 컷신 재작화 106장의 실제 파일 연결·해독·액자 채움과 두 제보 장면을 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/event-frame-20261128');
const assets=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/event_frame_20261128/assets.json'),'utf8'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={};
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=cb=>(cb.name==='loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update('))?0:setTimeout(()=>cb(performance.now()),16);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);
   G.Game.state=G.State.newGame({name:'액자 검사',nation:'PT',job:'explorer',g:'m',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
   G.Game.state.settings.res=.35;
  });
  report.frames=await page.evaluate(async list=>{
   const result=[];
   for(const asset of list){
    if(G.Img.file(asset.key)!==asset.file)throw Error('연결 불일치: '+asset.key);
    if(!await G.StoryArt.show(asset.key,asset.key))throw Error('표시 실패: '+asset.key);
    const im=document.querySelector('.story-art-shot img'),clip=im.parentElement;
    await im.decode();
    // object-fit은 그림 요소의 안쪽 크기를 쓴다. 액자의 1px 테두리는 별도다.
    const scale=Math.min(im.clientWidth/im.naturalWidth,im.clientHeight/im.naturalHeight);
    const paintedWidth=im.naturalWidth*scale,paintedHeight=im.naturalHeight*scale;
    const horizontalGap=im.clientWidth-paintedWidth,verticalGap=im.clientHeight-paintedHeight;
    result.push({key:asset.key,width:im.naturalWidth,height:im.naturalHeight,fit:getComputedStyle(im).objectFit,horizontalGap,verticalGap,coversClip:paintedWidth>=clip.clientWidth&&paintedHeight>=clip.clientHeight});
    await G.StoryArt.end();
   }
   return result;
  },assets);
  assert.equal(report.frames.length,106);
  for(const row of report.frames){assert.equal(row.width,1881);assert.equal(row.height,836);assert.equal(row.fit,'contain');assert(row.horizontalGap<.01&&row.verticalGap<.01&&row.coversClip,row.key);}
  // 제보 화면처럼 실제 항구 화면 위에서 컷신과 대화창을 함께 확인한다.
  await page.evaluate(async()=>{
   await G.Game.ensureGeo();await G.GoldSea.start();
   G.Game.state.gold.prologue=1;G.Game.state.settings.res=.35;
   G.Game.go('city',{cityId:24,gold:true});
  });
  await page.waitForTimeout(1000);
  await page.evaluate(async()=>{await G.UI.reset?.();});
  report.screens=[];
  for(const viewport of [{width:800,height:450},{width:1280,height:720},{width:1600,height:900}]){
   await page.setViewportSize(viewport);
   for(const [mode,key,title,text] of [
    ['gold','gold/cuts/01-childhood','창가의 약속','1584년 봄, 암스테르담. 담락 운하 곁의 상인 집.'],
    ['jhook','jhook/cuts/01_gift','프롤로그 — 침대 밑의 선물 상자','1534년 겨울, 런던 와핑.']]){
    await page.evaluate(async({key,title,text})=>{await G.StoryArt.show(key,title);window.qaSay=G.UI.say(text,{});},{key,title,text});
    await page.waitForSelector('.dlg');await page.waitForTimeout(900);
    const filename=`game-${mode}-${viewport.width}.png`;
    await page.screenshot({path:path.join(OUT,filename)});
    report.screens.push({file:filename,viewport,key});
    await page.keyboard.press('Enter');
    await page.evaluate(()=>Promise.race([qaSay,new Promise((_,reject)=>setTimeout(()=>reject(Error('대화 닫기 시간 초과')),5000))]));
    await page.evaluate(()=>G.StoryArt.end());
   }
  }
  // 실제 대사 원문에 매인 기존 이야기 연결도 같은 논리 키를 사용해야 한다.
  report.routes=await page.evaluate(async()=>{
   const shown=[],oldShow=G.StoryArt.show,oldSay=G.UI.say,oldAsk=G.UI.ask;
   G.StoryArt.show=async key=>{shown.push({key,file:G.Img.file(key)});return true;};G.UI.say=async()=>{};G.UI.ask=async()=>0;
   try{for(const [mode,api,data] of [['gold',G.GoldSea,G.GOLD],['jhook',G.JHook,G.JHOOK]]){
    G.Game.state[mode]={act:1,beats:{},prologue:1};
    await api.play(data.prologue.pro,'prologue');
    if(data.prologue.a1)await api.play(data.prologue.a1,'prologue_a1');
    if(data.prologue.a2)await api.play(data.prologue.a2,'prologue_a2');
    for(const beat of data.beats)await api.play(beat.lines,beat.id);
   }}finally{G.StoryArt.show=oldShow;G.UI.say=oldSay;G.UI.ask=oldAsk;}
   return shown;
  });
  const routes=new Set(report.routes.map(x=>x.key));
  assert(routes.has('gold/cuts/01-childhood')&&routes.has('jhook/cuts/01_gift'));
  assert(report.routes.every(x=>x.file?.startsWith('event-frame-20261128/')));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'browser-checks.json'),JSON.stringify({...report,...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),errors},null,2));
  console.log(JSON.stringify({decoded:report.frames.length,noGaps:report.frames.length,screens:report.screens.length,routes:routes.size,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
