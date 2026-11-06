/* 시간표를 사용하는 새 보행 시트의 실제 선택·루프·정지·Shift 전환을 검사한다. */
'use strict';
const fs=require('fs'), path=require('path'), {pathToFileURL}=require('url');
let pw;try {pw=require('playwright');} catch (_) {pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'), MOTION=process.env.HERO_MOTION||'walk';
const OUT=process.env.HERO_MOTION_OUT||path.join(ROOT,'artifacts/player-loop-20261106/browser-'+MOTION);
fs.mkdirSync(OUT,{recursive:true});
function ok(v,s){if(!v)throw new Error(s);}
(async()=>{
 const browser=await pw.chromium.launch({executablePath:process.env.BROWSER_EXE||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[], results=[];
 try {
  const page=await browser.newPage({viewport:{width:960,height:540}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:90000});
  await page.evaluate(async()=>{
   await G.Game.ensureGeo();const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   G.Game.state=G.State.newGame({name:'반복보행검수',nation:'PT',job:'adventurer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
   G.Game.state.settings.res=.35;G.UI.fade=async fn=>{await fn();};G.Scenes.city.prologue=async()=>{G.Game.state.flags.prologue=true;};
  });
  const looks=process.argv.slice(2);if(!looks.length)looks.push(...await page.evaluate(()=>Object.keys(G.HERO_MOTION)));
  for(const look of looks){
   await page.evaluate(look=>{G.Game.state.player.look=look;G.Game.state.player.portrait={img:['portraits/player/'+look]};G.Town.close();G.Game.go('city',{cityId:0});},look);
   await page.waitForFunction(({look,motion})=>{const s=G.Town.runtime();return s&&!s.hidden&&G.Img.heroLook()===look&&s.heroMotion['stride_'+motion];},{look,motion:MOTION},{timeout:60000});
   const r=await page.evaluate(({look,motion})=>{
    const s=G.Town.runtime(),cfg=G.HERO_MOTION[look],clip=cfg.loops[motion],atlas=s.heroMotion['stride_'+motion],raw=s.heroMotion.walk;
    const w=atlas.naturalWidth/clip.cols,h=atlas.naturalHeight/clip.rows,selected=[],idle=[],renderSizes=[],matrices=[];
    s.folks=[];s.hero.x=600;s.hero.to=null;s.hero.entering=false;s.hero.fade=1;s.hero.gesture=null;s.hero.keyRun=null;s.cam=s.camTo=0;
    s.keys={right:true,shift:motion==='run'};
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(img,...a){
     if(img===atlas&&a.length===8){selected.push(Math.round(a[0]/w)+clip.cols*Math.round(a[1]/h));renderSizes.push(a[7]/a[3]);const m=this.getTransform();matrices.push([Math.abs(m.a),Math.abs(m.d)]);}
     if(img===raw&&a.length===8&&!s.hero.walking&&!s.hero.running)idle.push(Math.round(a[0]/(raw.naturalWidth/7))+7*Math.round(a[1]/(raw.naturalHeight/7)));
     return original.call(this,img,...a);
    };
    try {
     for(let i=0;i<=clip.count;i++){
      const k=i%clip.count;s.hero.gaitPhase=(clip.times[k]+clip.times[k+1])*.5*clip.cycles;s.dirty=true;G.Town.update(0);
     }
     s.keys={};s.hero.walking=false;s.hero.running=false;s.hero.keyRun=null;s.dirty=true;G.Town.update(0);
    } finally {CanvasRenderingContext2D.prototype.drawImage=original;}
    function anatomical(kind,phase){
      const c=cfg.loops[kind],u=(phase/c.cycles)%1;
      const i=c.times.findIndex((v,j)=>j<c.count&&u>=v&&u<c.times[j+1]);
      const mix=(u-c.times[i])/(c.times[i+1]-c.times[i]);
      return Math.floor(phase/c.cycles)*c.cycles+c.pose[i]+(c.pose[i+1]-c.pose[i])*mix;
    }
    s.hero.gaitPhase=clip.cycles-.0001;s.hero.gaitKind=motion;s.keys={right:true,shift:motion==='run'};const before=anatomical(motion,s.hero.gaitPhase);G.Town.update(1/60);const after=anatomical(motion,s.hero.gaitPhase);
    s.keys={right:true,shift:motion!=='run'};G.Town.update(1/60);const switched=anatomical(motion==='run'?'walk':'run',s.hero.gaitPhase);
    s.keys={};G.Town.update(1/60);const stopped=s.hero.gaitPhase;
    s.t+=1000;s.dirty=true;G.Town.update(0);const waited=s.hero.gaitPhase;
    s.hero.x=s.streetW-40;s.keys={right:true,shift:true};G.Town.update(1/60);
    const wall=s.hero.gaitPhase===waited&&!s.hero.walking&&!s.hero.running;
    let gestureSelected=false;
    CanvasRenderingContext2D.prototype.drawImage=function(img,...a){if(img===s.heroMotion.idle)gestureSelected=true;return original.call(this,img,...a);};
    try {
     s.keys={};s.hero.walking=false;s.hero.running=false;s.hero.keyRun=null;s.hero.gesture={kind:'look',row:0,t:.2,seconds:3.2,target:null,resolvers:[]};
     s.dirty=true;G.Town.update(0);s.hero.gesture=null;
    } finally {CanvasRenderingContext2D.prototype.drawImage=original;}
    s.hero.x=600;s.keys={right:true,shift:motion==='run'};s.hero.gaitPhase=.35;s.dirty=true;G.Town.update(0);
    return {look,count:clip.count,selected,idle,expectedIdle:cfg.idle,before,after,switched,stopped,waited,wall,gestureSelected,renderSizes,matrices,fixedScale:!!clip.fixedScale,dimensions:[atlas.naturalWidth,atlas.naturalHeight]};
   },{look,motion:MOTION});
   ok(r.selected.length===r.count+1&&r.selected.every((v,i)=>v===i%r.count),look+' 모든 추가 칸과 마지막→첫 칸 선택');
   ok(r.idle.at(-1)===r.expectedIdle,look+' 원래 양발 대기 자세');
   ok(r.renderSizes.every(v=>Math.abs(v-178/300)<.00001),look+' 걷기와 같은 표시 배율');
   if(r.fixedScale)for(const axis of [0,1])ok(Math.max(...r.matrices.map(m=>m[axis]))-Math.min(...r.matrices.map(m=>m[axis]))<.000001,look+' 실제 화면의 확대·세로 늘어남');
   const delta=(r.after-r.before+2)%2,change=(r.switched-r.after+2)%2;
   ok(delta>0&&delta<.1&&change>0&&change<.1,look+' 반복 경계·Shift 전환의 진행도 연속');
   ok(r.stopped===r.waited&&r.wall,look+' 정지와 벽 앞에서 발 디딤 멈춤');
   ok(r.gestureSelected,look+' 대기 동작의 우선권');
   if(look==='navigator_white'&&MOTION==='walk'){
    const x0=await page.evaluate(()=>{const s=G.Town.runtime();s.keys={};s.hero.walking=false;s.hero.running=false;s.hero.keyRun=null;s.hero.gesture=null;return s.hero.x;});
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(260);await page.keyboard.up('ArrowRight');
    await page.waitForFunction(()=>!G.Town.runtime().hero.walking&&!G.Town.runtime().hero.running);
    const stoppedX=await page.evaluate(()=>G.Town.runtime().hero.x);await page.waitForTimeout(250);
    ok(stoppedX>x0+10&&await page.evaluate(x=>Math.abs(G.Town.runtime().hero.x-x)<.01,stoppedX),'실제 화살표 이동·키를 뗀 뒤 정지');
   }
   if(['admiral','armored_navigator','navigator_white'].includes(look))await page.screenshot({path:path.join(OUT,look+'-town.png')});
   results.push(r);console.log(`${look}/${MOTION}: ${r.count}칸·반복·전환·정지 통과`);
  }
  ok(!errors.length,errors.join('\n'));fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({results,errors},null,2));console.log(`${looks.length}종 ${MOTION} 실제 거리 검사 통과 · 콘솔 오류 0`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
