/* 확대 항해 추적·좁은 화면 메뉴·넓은 해전·아군 포격 정지의 실제 브라우저 검사. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU==='1',OUT=path.join(ROOT,'artifacts/naval-view-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[],report={mode:GPU?'GPU':'SwiftShader'};
 try{
  const page=await browser.newPage({viewport:GPU?{width:1600,height:900}:{width:640,height:360}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>G.Game&&G.State&&G.Img.count()>0,null,{timeout:90000});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);sk.nav=3;
   const s=G.Game.state=G.State.newGame({name:'항해·해전 화면 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=.25;s.fleet.ships=[G.R.newShip('galleon')];s.fleet.crew=100;s.loc={mode:'sea',lon:-30,lat:30,heading:0};G.Game.go('sea',{fresh:true});
   const st=G.Scenes.sea.runtime();st.cam.zoom=2400;st.npcs=[];st.dayAcc=-1000;st.paused=true;st.manual=true;
   const draw=G.Ship3D.draw;window.__draws=[];G.Ship3D.draw=function(ctx,x,y,a,len,spec,t){const ok=draw.apply(this,arguments);window.__draws.push({type:spec.type,sid:spec.sid,ok,length:len,pixelLength:len*Math.hypot(ctx.getTransform().a,ctx.getTransform().b)});return ok;};
  });
  console.log('실제 항해 준비 완료');
  report.tracking=await page.evaluate(()=>{
   const B=G.Scenes.sea,st=B.runtime(),s=G.Game.state,out=[];
   for(const speed of [1,4])for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    st.paused=false;st.speed=speed;st.dayAcc=-1000;st.npcs=[];st.busy=0;st.cam.zoom=2400;st.cam.zoomT=0;B.takeCourse(heading);s.loc.heading=heading;st.vel=[Math.cos(heading),Math.sin(heading)];st.fwd=1;st.lat=0;
    const start=[s.loc.lon,s.loc.lat];let maxOffset=0;
    for(let i=0;i<18;i++){st.frame=0;st.npcs=[];B.update(1/30);const p=B.toScreen(s.loc.lon,s.loc.lat);maxOffset=Math.max(maxOffset,Math.hypot(p[0]-800,p[1]-450));}
    out.push({speed,heading,maxOffset,moved:Math.hypot(s.loc.lon-start[0],s.loc.lat-start[1])});
   }st.paused=true;return out;
  });for(const r of report.tracking){assert(r.maxOffset<=90.01,JSON.stringify(r));assert(r.moved>.001);}
  await page.screenshot({path:path.join(OUT,'sea-tracking.png')});
  report.toolbar=[];
  for(const viewport of [{width:1600,height:900},{width:960,height:540}]){
   // RAF를 멈춘 검사에서는 느린 그래픽의 resize 전달을 기다리지 않고 실제 맞춤 함수를 호출한다.
   await page.setViewportSize(viewport);await page.evaluate(()=>G.Game.fit());
   const row=await page.evaluate(()=>{for(let i=0;i<8;i++)G.Scenes.sea.update(0);const bar=document.querySelector('.sailbar'),b=bar.querySelector('.follow'),r=b.getBoundingClientRect(),br=bar.getBoundingClientRect();return{viewport:[innerWidth,innerHeight],left:r.left,right:r.right,bar:[br.left,br.right],text:b.textContent,title:b.title,svg:!!b.querySelector('svg'),pressed:b.getAttribute('aria-pressed'),children:[...bar.children].map(c=>{const r=c.getBoundingClientRect();return[r.left,r.right];})};});report.toolbar.push(row);
   assert(row.svg&&row.text.trim()===''&&/마우스 따라가기/.test(row.title));assert(row.children.every(r=>r[0]>=-1&&r[1]<=viewport.width+1),JSON.stringify(row));
  }
  await page.getByRole('button',{name:/마우스 따라가기/}).click();assert.equal(await page.locator('.follow').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(OUT,'toolbar-small.png')});await page.setViewportSize({width:1600,height:900});await page.evaluate(()=>G.Game.fit());
  report.initial=await page.evaluate(()=>{
   const s=G.Game.state;s.fleet.ships=['galleon','geobukseon','lgalleon'].map(id=>G.R.newShip(id));s.fleet.crew=400;s.loc={mode:'sea',lon:-30,lat:30,heading:0};
   G.Game.go('battle',{npc:{kind:'navy',nation:'ES',n:3,ships:['galleon','frigate','galley'],K:.4}});const B=G.Scenes.battle,st=B.runtime();st.paused=true;window.__draws=[];B.update(0);
   return{zoom:st.vz,arena:st.arena,separation:Math.hypot(st.enFlag.x-st.myFlag.x,st.enFlag.y-st.myFlag.y),draws:window.__draws.slice(),chart:document.querySelector('.chart-status').textContent};
  });assert.equal(report.initial.zoom,2.2);assert.equal(report.initial.arena,3200);assert(report.initial.separation>1600);assert(/화면 밖 3척/.test(report.initial.chart));assert(report.initial.draws.every(d=>d.ok));assert(report.initial.draws.some(d=>d.pixelLength>250));
  report.chartBounds=await page.evaluate(()=>{const b=document.querySelector('.battle-chart').getBoundingClientRect(),c=document.querySelector('.battle-chart canvas').getBoundingClientRect();return{box:[b.left,b.right,b.top,b.bottom],canvas:[c.left,c.right,c.top,c.bottom]};});assert(report.chartBounds.canvas[0]>=report.chartBounds.box[0]&&report.chartBounds.canvas[1]<=report.chartBounds.box[1]);
  await page.screenshot({path:path.join(OUT,'battle-start.png')});console.log('확대 추적·메뉴 경계·멀리서 시작하는 해전 확인');
  await page.getByRole('button',{name:'전장 전체',exact:true}).click();await page.evaluate(()=>{G.Scenes.battle.update(2);});await page.screenshot({path:path.join(OUT,'battle-overview.png')});
  assert(await page.evaluate(()=>G.Scenes.battle.runtime().vz<.2));
  const chart=page.locator('.battle-chart canvas');await chart.click({position:{x:160,y:120}});assert.equal(await page.evaluate(()=>G.Scenes.battle.runtime().cameraMode),'chart');
  await page.getByRole('button',{name:'기함 보기',exact:true}).click();await page.evaluate(()=>G.Scenes.battle.update(2));assert.equal(await page.evaluate(()=>G.Scenes.battle.runtime().cameraMode),'ship');
  // 포격 정지 상태의 실제 교전: 적의 포탄은 생기고 아군 포탄은 한 발도 생기지 않는다.
  await page.getByRole('button',{name:'포격 정지',exact:true}).click();
  report.hold=await page.evaluate(()=>{
   const B=G.Scenes.battle,st=B.runtime(),fs=st.myFlag;st.ships.forEach((b,i)=>{b.x=b.side==='me'?0:170;b.y=(b.no-1)*140;b.heading=Math.PI/2;b.reload=[0,0,0];b.guns.n=12;b.crew=b.crew0=100;b.hp=b.maxHp=10000;b.vel=[0,0];b.halt=true;b.board=null;b.order='hold';b.hold=[b.x,b.y];});st.paused=false;st.balls=[];st.hitstop=0;st.busy=0;st.retreat=false;
   B.update(.05);st.paused=true;const balls=st.balls.map(b=>b.from.side);return{hold:st.holdFire,balls,boardAvailable:!document.querySelector('.sailbar .red').disabled};
  });assert(report.hold.hold&&report.hold.boardAvailable);assert(report.hold.balls.length>0&&report.hold.balls.every(x=>x==='en'));
  report.resume=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime();B.holdFire(false);st.ships.forEach(b=>b.reload=[0,0,0]);st.balls=[];st.hitstop=0;st.paused=false;B.update(.05);st.paused=true;return st.balls.map(b=>b.from.side);});assert(report.resume.includes('me'));
  // 이미 날아가던 포탄은 지우지 않고, 백병전 접근은 이전 이동 목표·전술에 막히지 않는다.
  report.board=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime(),me=st.myFlag;B.holdFire(true);const count=st.balls.length;me.moveTo=[-1000,-1000];me.tactic='gun';st.enFlag.x=me.x+600;st.enFlag.y=me.y;st.ships.filter(b=>b.side==='en'&&!b.flag).forEach(b=>b.x=2000);document.querySelector('.sailbar .red').click();return{sameBalls:count===st.balls.length,intent:me.boardIntent,move:me.moveTo,tactic:me.tactic,target:!!me.target};});assert(report.board.sameBalls&&report.board.intent&&report.board.move===null&&!report.board.tactic&&report.board.target);
  report.saved=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime();st.paused=true;st.busy=0;const snap=B.snapshot();G.Game.go('battle',{battle:snap});const r=B.runtime();B.update(0);return{hold:r.holdFire,arena:r.arena,view:r.cameraMode,ready:G.Ship3D.stats().ready};});assert(report.saved.hold&&report.saved.arena===3200&&report.saved.ready);
  await page.screenshot({path:path.join(OUT,'battle-hold-fire.png')});
  // 36종 전부를 해전 기함으로 실제 렌더링한다.
  report.types=await page.evaluate(()=>{const B=G.Scenes.battle,st=B.runtime(),rows=[];for(const ship of G.SHIP_TYPES){const id=ship.id;st.myFlag.type=id;st.myFlag.sails=G.SHIP[id].sails;window.__draws=[];B.update(0);rows.push({id,ok:window.__draws.some(d=>d.type===id&&d.ok)});}return rows;});assert.equal(report.types.length,36);assert(report.types.every(r=>r.ok));
  report.exit=await page.evaluate(()=>{G.Scenes.battle.exit('sea');return !G.Ship3D.stats().ready;});assert(report.exit);assert.deepStrictEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('OK: 확대 항해 추적·메뉴·넓은 해전·3D·아군 포격 정지/재개·백병전 접근·저장 복원·오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
