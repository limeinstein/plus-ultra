/* 기함 사거리·장전 게이지: 난이도, 포대별 발사 판정, 포격 정지, 저장 복원. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU==='1',OUT=path.join(ROOT,'artifacts/battle-gunnery-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[],report={mode:GPU?'GPU':'SwiftShader'};
 try {
  const page=await browser.newPage({viewport:{width:1600,height:900}});page.setDefaultTimeout(90000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>requestAnimationFrame=()=>0);
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.G&&G.Game&&G.State,null,{polling:50});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   const s=G.Game.state=G.State.newGame({name:'포격 안내 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=.35;s.fleet.ships=[G.R.newShip('galleon')];s.fleet.crew=100;s.loc={mode:'sea',lon:-30,lat:30,heading:0};
   G.Game.go('battle',{npc:{kind:'navy',nation:'ES',n:1,ships:['galleon'],K:.4}});
   const B=G.Scenes.battle,st=B.runtime(),b=st.myFlag;st.paused=true;b.heading=-Math.PI/2;b.reload=[3,0,6];b.reloadTotal=[6,6,6];
   const ctx=G.Game.canvases().overlay.getContext('2d'),arc=ctx.arc;window.__guideArcs=[];
   ctx.arc=function(x,y,r,a,z){if([G.FX.battleGunnery.ready,G.FX.battleGunnery.loading,G.FX.battleGunnery.held].includes(this.strokeStyle))window.__guideArcs.push({r,a,z,color:this.strokeStyle,alpha:this.globalAlpha});return arc.apply(this,arguments);};
   window.__readGuide=()=>{window.__guideArcs=[];B.update(0);const e=document.querySelector('.gunnery-readout');return{hidden:e.hidden,text:e.textContent,sides:[...e.querySelectorAll('.gun-state')].map(c=>c.textContent),arcs:window.__guideArcs.slice()};};
  });
  report.normal=await page.evaluate(()=>__readGuide());assert(!report.normal.hidden);assert(report.normal.sides[0].includes('50%'));assert(report.normal.sides[1].includes('발사 준비'));assert.equal(report.normal.sides.length,2);assert(report.normal.arcs.some(a=>a.r===255));
  await page.screenshot({path:path.join(OUT,'normal-half-ready.png')});
  report.diff=[];
  for(const diff of ['easy','original','hard','normal']){const row=await page.evaluate(diff=>{G.Game.state.settings.diff=diff;return __readGuide();},diff);report.diff.push({diff,hidden:row.hidden,arcs:row.arcs.length});assert.equal(row.hidden,!['easy','normal'].includes(diff));if(row.hidden)assert.equal(row.arcs.length,0);if(diff==='original')await page.screenshot({path:path.join(OUT,'hard-hidden.png')});}
  report.held=await page.evaluate(()=>{G.Scenes.battle.holdFire(true);return __readGuide();});assert(report.held.text.includes('포격 정지')&&report.held.text.includes('장전 완료')&&!report.held.text.includes('발사 준비'));
  assert(report.held.arcs.every(a=>a.color=== '#a9b1b8'));await page.screenshot({path:path.join(OUT,'hold-fire.png')});
  report.clock=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime(),b=st.myFlag;const before=b.reload[0];B.update(.5);const paused=b.reload[0];st.paused=false;B.update(.5);st.paused=true;return{before,paused,after:b.reload[0],text:__readGuide().text};});assert.equal(report.clock.before,report.clock.paused);assert(report.clock.after<report.clock.before&&report.clock.after>0);
  // 포격 직후에 기록한 주기는 도중 선원이 줄어도 바뀌지 않으며, 옛 저장에는 기본값을 쓴다.
  report.save=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime();st.myFlag.reload=[2,1,0];st.myFlag.reloadTotal=[6,7,8];st.myFlag.crew=30;const snap=B.snapshot();G.Game.go('battle',{battle:snap});const saved=__readGuide();const totals=B.runtime().myFlag.reloadTotal.slice();const old=B.snapshot();old.ships.forEach(b=>delete b.reloadTotal);G.Game.go('battle',{battle:old});const legacy=__readGuide();return{totals,saved:saved.text,legacy:legacy.text};});assert.deepEqual(report.save.totals,[6,7,8]);assert(report.save.saved.includes('66%'));assert(!/NaN|Infinity/.test(report.save.legacy));
  report.types=[];
  for(const type of ['galley','geobukseon']){
   const row=await page.evaluate(type=>{const B=G.Scenes.battle,b=B.runtime().myFlag,t=G.SHIP[type];b.type=type;b.tr=t.traits;b.t=t;b.sails=t.sails;b.reload=[3,0,1];b.reloadTotal=[6,6,6];B.holdFire(false);return __readGuide();},type);report.types.push({type,sides:row.sides,arcs:row.arcs});assert.equal(row.sides.length,3);if(type==='galley')assert(row.arcs.some(a=>a.r===90));await page.screenshot({path:path.join(OUT,type+'.png')});
  }
  report.long=await page.evaluate(()=>{const b=G.Scenes.battle.runtime().myFlag;b.guns.type='lculverin';return __readGuide();});assert(report.long.arcs.some(a=>a.r===420));assert(report.long.arcs.some(a=>a.r<100&&a.alpha>.9));
  await page.setViewportSize({width:960,height:540});
  report.small=await page.evaluate(()=>{G.Game.fit();__readGuide();const g=document.querySelector('.gunnery-readout').getBoundingClientRect(),p=document.querySelector('.battlepanel').getBoundingClientRect(),bar=document.querySelector('.sailbar').getBoundingClientRect();return{left:g.left,right:g.right,top:g.top,bottom:g.bottom,panelBottom:p.bottom,barTop:bar.top};});assert(report.small.left>=0&&report.small.right<=960&&report.small.top>report.small.panelBottom&&report.small.bottom<report.small.barTop);await page.screenshot({path:path.join(OUT,'small-screen.png')});
  await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>G.Game.fit());
  // 실제 포탄이 생기는지 검사: 양현/선수/근접/추격포 및 사거리 밖의 대기.
  report.firing=await page.evaluate(()=>{
   const B=G.Scenes.battle,st=B.runtime(),b=st.myFlag,e=st.enFlag,rows=[];
   const cases=[['galleon',0,240,-Math.PI/2,true],['galleon',0,270,-Math.PI/2,false],['galleon',0,200,0,false],['galleon',0,150,0,true],['galleon',1,150,0,false],['galleon',1,70,0,true],['galley',2,240,0,true],['galley',2,240,1,false],['galley',0,120,-Math.PI/2,false],['galley',0,70,-Math.PI/2,true],['geobukseon',2,240,0,true],['geobukseon',0,150,0,false]];
   for(const [type,side,d,a,expected] of cases){
    b.type=type;b.tr=G.SHIP[type].traits;b.t=G.SHIP[type];b.guns={type:'saker',n:8};e.guns.n=0;
    b.x=0;b.y=0;e.x=Math.cos(a)*d;e.y=Math.sin(a)*d;b.heading=0;b.reload=[1000,1000,1000];b.reload[side]=0;
    for(const sh of [b,e]){sh.hp=sh.maxHp=10000;sh.crew=sh.crew0=100;sh.halt=true;sh.vel=[0,0];sh.steer=null;sh.moveTo=null;sh.target=null;sh.board=null;sh.boardIntent=false;sh.ramCd=1000;}
    st.holdFire=false;st.balls=[];st.hitstop=0;st.busy=0;st.paused=false;B.update(.001);st.paused=true;
    rows.push({type,side,d,a,expected,fired:st.balls.some(x=>x.from===b),cycle:b.reloadTotal[side],left:b.reload[side]});
   }return rows;
  });for(const r of report.firing){assert.equal(r.fired,r.expected,JSON.stringify(r));if(r.fired)assert.equal(r.cycle,r.left);}
  report.noGun=await page.evaluate(()=>{G.Scenes.battle.runtime().myFlag.guns.n=0;return __readGuide();});assert(report.noGun.hidden&&report.noGun.arcs.length===0);
  await page.evaluate(()=>G.Scenes.battle.exit('sea'));assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('OK: 쉬움·보통 표시 / 어려움 숨김 / 포별 실제 사거리·장전·포격 정지 / 저장·옛 저장 / 발사 판정 12개 / 오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
