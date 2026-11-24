/* 실제 회화 시트·남녀 제독·여성 부하·속도 전환·게임 지도를 file://에서 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/expedition-blender-painted-20261124');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[];
 function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
 try{
  const page=await browser.newPage({viewport:{width:1200,height:960}});watch(page);
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.join(ROOT,'test_expedition_following.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.followDemo&&G.EXPEDITION_PAINTED,null,{polling:100});
  await page.evaluate(()=>G.ExpeditionMotion.preload('walk'));
  await page.waitForFunction(()=>Object.values(G.EXPEDITION_PAINTED.sheets).every(s=>!!G.Img.get(s.key))&&G.ExpeditionMotion.ready('walk')&&G.ExpeditionFormation.ready('foot'),null,{polling:100,timeout:60000});
  const report=await page.evaluate(()=>{
   const F=G.ExpeditionFormation,canvas=document.getElementById('stage'),ctx=canvas.getContext('2d'),cases=[];
   function pose(gender,fast,party=4,dir=3,moving=true){
    return G.Party.draw(ctx,{pts:[[460,340]],mount:{id:'walk'},party,head:Math.PI/2-dir*Math.PI/4,heroGender:gender,phase:.25,moving,fast,t:0,size:1,cache:{}});
   }
   for(const gender of ['m','f'])for(const fast of [false,true])for(let dir=0;dir<8;dir++){
    const items=pose(gender,fast,4,dir),leader=items.find(i=>i.leader);
    cases.push({gender,fast,dir,leader:leader.appearance,action:leader.sheet.action,count:items.length,females:items.filter(i=>!i.leader&&i.gender==='f').length,valid:items.every(i=>i.cell&&i.cell.length===6&&i.im&&i.sheet.character)});
   }
   const parties=[1,2,3,4].map(n=>({n,females:pose('m',false,n).filter(i=>!i.leader&&i.gender==='f').length}));
   const u={pts:[[0,0]],follow:{x:0,y:0,zoom:1},mount:{id:'walk'},party:4,head:0,moving:true,phase:0,t:0,size:1,cache:{}};
   let items=F.follow(u,{heading:0,phase:0},1);
   function advance(speed,frames){for(let f=0;f<frames;f++){u.t+=1/60;u.follow.x+=speed/60;u.moving=speed>0;u.phase+=speed/60/20;items=F.follow(u,{heading:0,phase:u.phase},1);}return items.map(i=>({index:i.index,gait:i.gait,speed:i.speed,moving:i.moving}));}
   const fast=advance(110,180),slow=advance(30,240),stopped=advance(0,420);
   const cacheOnly=!Object.prototype.hasOwnProperty.call(u,'formation');
   // 비교 그림은 모두 실제 게임의 그리기 함수로 만든다.
   canvas.width=1120;canvas.height=760;ctx.fillStyle='#78916c';ctx.fillRect(0,0,1120,760);ctx.fillStyle='#1c3029';ctx.font='23px sans-serif';
   [['m',false,'남성 제독 · 걷기'],['f',false,'여성 제독 · 걷기'],['m',true,'남성 제독 · 달리기'],['f',true,'여성 제독 · 달리기']].forEach(([gender,fast,label],i)=>{
    const col=i%2,row=Math.floor(i/2);ctx.fillStyle='#1c3029';ctx.fillText(label,30+col*560,35+row*380);
    G.Party.draw(ctx,{pts:[[300+col*560,300+row*380]],mount:{id:'walk'},party:4,head:-Math.PI/4,heroGender:gender,phase:.25,moving:true,fast,t:0,size:2.2,cache:{}});
   });
   return{cases,parties,fast,slow,stopped,cacheOnly,assets:Object.values(G.EXPEDITION_PAINTED.sheets).map(s=>({key:s.key,cells:s.cells.length,width:G.Img.get(s.key).width,height:G.Img.get(s.key).height}))};
  });
  assert(report.cases.every(c=>c.leader==='captain_'+c.gender&&c.action===(c.fast?'run':'walk')&&c.count===4&&c.females===1&&c.valid),'양성·8방향·실제 별도 달리기 시트');
  assert(report.parties.every(p=>p.females===(p.n>1?1:0)),'있는 부하 중 여성 한 명');
  assert(report.fast[0].gait==='run'&&report.slow[0].gait==='walk','실제 거리/시간으로 달리기·걷기 전환');
  assert(report.stopped.every(i=>i.gait==='idle'&&!i.moving),'뒤따라온 대원도 정지');assert(report.cacheOnly);
  assert(report.assets.reduce((n,s)=>n+s.cells,0)===288);
  await page.locator('#stage').screenshot({path:path.join(OUT,'in-game-comparison.png')});
  // 실제 게임에서는 성별 공통 판정을 거쳐 여성 제독 의상을 선택한다.
  const game=await browser.newPage({viewport:{width:1100,height:760}});watch(game);
  await game.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
  await game.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:90000});
  await game.evaluate(async()=>{
   await G.Game.ensureGeo();G.Game.state=G.State.newGame({name:'여성 탐험대 점검',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   G.Game.state.player.g='f';G.Game.state.fleet.crew=4;G.Game.state.settings.res=.35;
   G.Game.go('land',{from:0,mount:{id:'walk',n:4}});
  });
  await game.waitForFunction(()=>{const r=G.Scenes.land.runtime(),leader=r&&r.unitItems&&r.unitItems.find(i=>i.leader);return leader&&r.unitItems.length===4&&leader.appearance==='captain_f';},null,{timeout:60000});
  report.game=await game.evaluate(()=>{const r=G.Scenes.land.runtime();return{gender:G.R.heroSex(),items:r.unitItems.map(i=>({index:i.index,appearance:i.appearance,gender:i.gender,gait:i.gait})),saveClean:!Object.prototype.hasOwnProperty.call(G.Game.state.loc,'formation')};});
  assert(report.game.gender==='f'&&report.game.saveClean);assert(report.game.items.filter(i=>i.index&&i.gender==='f').length===1);
  await game.screenshot({path:path.join(OUT,'actual-map-female.png')});
  assert.deepStrictEqual(errors,[],'콘솔 오류 0');
  report.errors=errors;fs.writeFileSync(path.join(OUT,'browser-results.json'),JSON.stringify(report,null,2));
  console.log('통과 — 288개 회화 자세·남녀 제독·여성 부하·8방향·걷기/달리기/정지·실제 여성 제독 지도·저장 호환 / 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
