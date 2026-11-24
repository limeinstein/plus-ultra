/* 추가 여성 제독 13종: 실제 거리의 8칸 순환·멈춤, 일기토 그림 선택·파일 읽기와 여성 전용 시트 표시. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.HERO_OUT||path.join(ROOT,'artifacts/hero-women-20261124/browser');
const wanted=(process.env.HERO_IDS||'').split(',').filter(Boolean);
const CHARACTERS=JSON.parse(fs.readFileSync(path.join(ROOT,wanted.length?'tools/hero_street_20261124/characters.json':'tools/hero_women_20261124/characters.json'),'utf8')).filter(c=>!wanted.length||wanted.includes(c.id));
const ONLY_DUELS=process.argv.includes('--duel-only');
fs.mkdirSync(OUT,{recursive:true});

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],results=[];
 async function open(){
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.evaluate(async()=>{
   await G.Game.ensureGeo();const sk={};G.SKILLS.forEach(x=>sk[x.id]=2);
   G.Game.state=G.State.newGame({name:'제독 동작 검사',nation:'PT',job:'adventurer',age:25,birth:{m:4,d:12},st:{str:75,int:70,mar:70,cha:70},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
   const s=G.Game.state;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.settings.autosave=false;
   G.State.save=()=>{};G.UI.fade=async fn=>{await fn();};G.Scenes.city.prologue=async()=>{s.flags.prologue=true;};
   if(G.Loader)G.Loader.hide();document.querySelector('#boot-loader')?.remove();
  });
  return page;
 }
 try{
  const page=await open();
  for(const {id} of (ONLY_DUELS?[]:CHARACTERS)){
   await page.evaluate(id=>{const p=G.Game.state.player;p.look=id;p.g=G.Img.heroLookSex(id);p.portrait={img:['portraits/player/'+id]};G.Town.close();G.Game.go('city',{cityId:0});},id);
   await page.waitForFunction(id=>{const s=G.Town.runtime();return s&&!s.hidden&&G.Img.heroLook()===id&&s.heroMotion.stride_walk;},id,{timeout:90000});
   const r=await page.evaluate(async id=>{
    const fighter=id==='admiral'?'main_admiral':id;
    const walking=G.Img.chain.heroWalk(),prefix=id==='admiral'?'characters/walk_':'characters/'+id+'/walk_';
    if(walking.length!==8||walking.some((key,i)=>key!==prefix+(i+1)))throw Error(id+': 개별 걷기 그림이 다른 인물로 바뀜');
    const duel=G.DUEL_ART.pick(G.Games.playerFighter(),{});
    if(duel!==fighter)throw Error(id+': 다른 인물의 일기토 시트 '+duel);
    if(G.Img.heroLookSex(id)==='f'){
     const female=G.Games.playerFighter();female.portrait=Object.assign({},female.portrait,{g:'f'});
     if(G.DUEL_ART.pick(female,{})!==fighter)throw Error(id+': 여성 초상 정보에서 다른 인물로 바뀜');
    }
    const keys=['duel/fighters/'+fighter,'duel/fighters_ext/'+fighter+'_atk','duel/fighters_ext/'+fighter+'_react','duel/cutins/'+fighter];
    for(const key of keys){if(!G.Img.has(key))throw Error('그림 없음 '+key);const im=await G.Img.load(key);if(!im||!im.naturalWidth)throw Error('그림 읽기 실패 '+key);}
    const s=G.Town.runtime(),clip=G.HERO_MOTION[id].loops.walk,atlas=s.heroMotion.stride_walk,raw=s.heroMotion.walk;
    const cw=atlas.naturalWidth/clip.cols,ch=atlas.naturalHeight/clip.rows,selected=[],idle=[];
    s.folks=[];s.hero.x=600;s.hero.to=null;s.hero.entering=false;s.hero.fade=1;s.hero.gesture=null;s.cam=s.camTo=0;s.hero.keyRun=null;s.keys={right:true};
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(im,...a){
     if(im===atlas&&a.length===8)selected.push(Math.round(a[0]/cw)+clip.cols*Math.round(a[1]/ch));
     if(im===raw&&a.length===8&&!s.hero.walking)idle.push(Math.round(a[0]/(raw.naturalWidth/7))+7*Math.round(a[1]/(raw.naturalHeight/7)));
     return original.call(this,im,...a);
    };
    try{
     for(let i=0;i<=8;i++){s.hero.gaitPhase=(i%8+.5)/8;s.dirty=true;G.Town.update(0);}
     s.keys={};s.hero.walking=false;s.hero.running=false;s.hero.keyRun=null;s.dirty=true;G.Town.update(0);
    }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
    const phase=s.hero.gaitPhase;G.Town.update(.1);
    return {id,fighter,keys,selected,idle,stationary:phase===s.hero.gaitPhase,clip,dimensions:[atlas.naturalWidth,atlas.naturalHeight]};
   },id);
   assert.deepStrictEqual(r.selected,[0,1,2,3,4,5,6,7,0],id+' 보행 순서와 반복 경계');
   assert.strictEqual(r.idle.at(-1),0,id+' 멈춤 자세');assert(r.stationary,id+' 정지 중 발 디딤 고정');
   await page.evaluate(()=>{const s=G.Town.runtime();s.keys={right:true};s.hero.gaitPhase=.4;s.dirty=true;G.Town.update(0);});
   await page.screenshot({path:path.join(OUT,id+'-town.png')});
   results.push(r);console.log(id+' 보행·일기토 연결 통과');
  }
  await page.close();
  for(const {id} of CHARACTERS){
   const duelPage=await open();
   await duelPage.evaluate(id=>{const p=G.Game.state.player;p.look=id;p.g=G.Img.heroLookSex(id);p.portrait={img:['portraits/player/'+id]};G.Game.go('city',{cityId:0});},id);
   await duelPage.waitForFunction(id=>G.Town.active()&&G.Img.heroLook()===id,id,{timeout:90000});
   await duelPage.evaluate(async id=>{
    const p=G.Game.state.player;p.look=id;p.g=G.Img.heroLookSex(id);p.portrait={img:['portraits/player/'+id]};
    const fighter=id==='admiral'?'main_admiral':id;
    const sheet=await G.Img.load('duel/fighters/'+fighter);
    await Promise.all(['duel/backgrounds/deck','duel/fighters/caribbean_pirate','duel/cutins/'+fighter,'portraits/player/'+id].map(key=>G.Img.load(key)));
    window.__heroDrawn=0;
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im===sheet)window.__heroDrawn++;return original.call(this,im,...args);};
    G.Games.duel({name:'동작 검사 상대',look:'pirate',str:60,skill:2},{place:'deck',noSwap:true,stance:'guard'});
    document.querySelector('.rduel .rd-sys .btn').click();
   },id);
   await duelPage.waitForFunction(()=>window.__heroDrawn>0,null,{timeout:60000});
   await duelPage.screenshot({path:path.join(OUT,id+'-duel.png')});
   results.push({id,actualDuelDraws:await duelPage.evaluate(()=>window.__heroDrawn)});
   await duelPage.evaluate(()=>{const duel=G.Games._duelDebug;duel.me.spirit=100;window.__cutTechnique=duel.useTech('deathblow');});
   await duelPage.waitForFunction(()=>{const im=document.querySelector('.rd-motion');return im&&im.classList.contains('show')&&im.complete&&im.naturalWidth>0;},null,{timeout:30000});
   const cutin=await duelPage.evaluate(()=>({fighter:G.Games._duelDebug.me.spriteId,src:document.querySelector('.rd-motion').src,flipped:document.querySelector('.rd-motion').classList.contains('flip')}));
   assert.strictEqual(cutin.fighter,id==='admiral'?'main_admiral':id);assert.strictEqual(cutin.flipped,false,'필살기가 상대를 향하는 방향');
   await duelPage.waitForTimeout(280); // 펼쳐지는 첫 순간을 지나 손과 무기가 모두 보이는 장면을 남긴다.
   await duelPage.screenshot({path:path.join(OUT,id+'-cutin.png')});results.push({id,liveCutin:cutin});
   await duelPage.close();
  }
  assert.deepStrictEqual(errors,[],'브라우저 오류');
  const previous=ONLY_DUELS?JSON.parse(fs.readFileSync(path.join(OUT,'report.json'),'utf8')).results.filter(r=>!r.actualDuelDraws&&!r.liveCutin):[];
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({results:previous.concat(results),errors},null,2));
  console.log('제독 '+CHARACTERS.length+'종 실제 거리·그림 읽기와 일기토·필살기 재생 통과 · 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
