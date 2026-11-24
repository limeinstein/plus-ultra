/* 거리 제독 29종: 모든 보행·달리기·후면·대기 칸의 실제 선택과 이동에 의한 대기 취소. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/hero-street-20261124/browser');
const CHARS=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/hero_street_20261124/characters.json'),'utf8')).filter(c=>!process.env.HERO_IDS||process.env.HERO_IDS.split(',').includes(c.id));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],results=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.evaluate(async()=>{
   await G.Game.ensureGeo();const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   G.Game.state=G.State.newGame({name:'거리 동작 검사',nation:'PT',job:'adventurer',age:25,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
   const s=G.Game.state;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.settings.autosave=false;
   G.State.save=()=>{};G.UI.fade=async fn=>{await fn();};G.Scenes.city.prologue=async()=>{s.flags.prologue=true;};
   if(G.Loader)G.Loader.hide();document.querySelector('#boot-loader')?.remove();
  });
  const faces=await page.evaluate(()=>({women:G.Img.heroFaces('f'),men:G.Img.heroFaces('m')}));
  assert.strictEqual(faces.women.length,15,'여성 제독 15종을 만들기에서 선택');
  assert.strictEqual(faces.men.length,14,'남성 제독 14종을 유지');
  for(const {id} of CHARS){
   await page.evaluate(id=>{const p=G.Game.state.player;p.look=id;p.g=G.Img.heroLookSex(id);p.portrait={img:['portraits/player/'+id]};G.Town.close();G.Game.go('city',{cityId:0});},id);
   await page.waitForFunction(id=>{const s=G.Town.runtime();return s&&!s.hidden&&G.Img.heroLook()===id&&['walk','run','back','idle','stride_walk','stride_run'].every(k=>s.heroMotion[k]);},id,{timeout:90000});
   const result=await page.evaluate(id=>{
    const s=G.Town.runtime(),h=s.hero,cfg=G.HERO_MOTION[id],fx=G.FX.townHeroGestures;
    const kinds=['walk','run','back','idle','stride_walk','stride_run'];
    const dimensions={};for(const k of kinds){const im=s.heroMotion[k];dimensions[k]=[im.naturalWidth,im.naturalHeight];}
    const prefix=id==='admiral'?'characters/run_':'characters/'+id+'/run_';
    const individual=G.Img.chain.heroRun();if(individual.length!==8||individual.some((k,i)=>k!==prefix+(i+1)))throw Error(id+' 전용 달리기 8장 연결');
    const selected={walk:[],run:[],back:[],look:[],greet:[],stretch:[],standing:[]};
    let active='';const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(im,...a){
     if(a.length===8&&active){
      const key=active==='standing'?'walk':['look','greet','stretch'].includes(active)?'idle':active==='walk'||active==='run'?'stride_'+active:'back';
      if(im===s.heroMotion[key]){const cols=key==='idle'?6:key.startsWith('stride_')?8:7;selected[active].push(Math.round(a[0]/a[2])+cols*Math.round(a[1]/a[3]));}
     }
     return original.call(this,im,...a);
    };
    s.folks=[];s.cam=s.camTo=0;h.x=620;h.to=null;h.fade=1;h.entering=false;h.gesture=null;h.keyRun=null;
    try{
     for(const kind of ['walk','run']){
      active=kind;s.keys={right:true,shift:kind==='run'};h.entering=false;h.gesture=null;
      for(let i=0;i<=8;i++){h.gaitPhase=((i%8)+.5)/8;s.dirty=true;G.Town.update(0);}
     }
     active='back';s.keys={};h.to=null;h.entering=true;h.enterRise=0;
     for(let i=0;i<49;i++){h.enterT=(i+.5)/49;h.fade=1;s.dirty=true;G.Town.update(0);}
     h.entering=false;h.fade=1;h.walking=false;h.running=false;h.keyRun=null;s.keys={};
     for(const [row,kind] of ['look','greet','stretch'].entries()){
      active=kind;const action=h.gesture={kind,row,t:0,seconds:fx.seconds[kind],target:null};
      for(let i=0;i<12;i++){action.t=(fx.keyTimes[i]+.001)*action.seconds;s.dirty=true;G.Town.update(0);}
     }
     active='standing';h.gesture=null;h.nextGestureAt=s.t+1000;h.walking=false;h.running=false;s.dirty=true;G.Town.update(0);
     h.gesture={kind:'greet',row:1,t:.5,seconds:fx.seconds.greet,target:null};s.keys={right:true};G.Town.update(1/60);
    }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
    const cancelled=!h.gesture&&h.walking;
    s.keys={};h.walking=false;h.running=false;h.keyRun=null;h.gesture={kind:'stretch',row:2,t:fx.keyTimes[6]*fx.seconds.stretch,seconds:fx.seconds.stretch,target:null};s.dirty=true;G.Town.update(0);
    const portraits=id.endsWith('_f')?[25,40,70].map(age=>({age,face:G.Img.chain.heroPortrait(G.Game.state.player,age)[0],half:G.Img.chain.heroHalf(G.Game.state.player,age)[0]})):[];
    if(portraits.some(p=>!G.Img.has(p.face)||!G.Img.has(p.half)))throw Error(id+' 나이별 초상 연결');
    return {id,dimensions,selected,individual,cancelled,skip:cfg.skip||[],runLoop:cfg.loops.run,portraits};
   },id);
   for(const kind of ['walk','run'])assert.deepStrictEqual(result.selected[kind],[0,1,2,3,4,5,6,7,0],id+' '+kind+' 순환');
   assert.deepStrictEqual(result.selected.back,Array.from({length:49},(_,i)=>i),id+' 후면 49칸');
   for(const [row,kind] of ['look','greet','stretch'].entries())assert.deepStrictEqual(result.selected[kind],Array.from({length:12},(_,i)=>row*12+i),id+' '+kind+' 12칸');
   assert.strictEqual(result.selected.standing.at(-1),0,id+' 양발 대기');assert(result.cancelled,id+' 이동 시 대기 취소');
   assert(!['run','back','idle'].some(k=>result.skip.includes(k)),id+' 새 전용 시트를 숨기지 않음');
   await page.screenshot({path:path.join(OUT,id+'-stretch.png')});
   results.push(result);console.log(id+' 거리의 6동작·모든 칸·순환·멈춤·취소 통과');
  }
  assert.deepStrictEqual(errors,[],'콘솔·페이지 오류');
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({results,errors},null,2));
  console.log('제독 '+CHARS.length+'종 거리 전용 시트와 6동작 검사 통과 · 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
