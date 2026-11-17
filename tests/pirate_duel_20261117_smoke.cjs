'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/pirate-duel-42-20261117'));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:960,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.addInitScript(()=>{
   const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'&&!String(fn).includes('draw(')?0:raf(fn);
   window.pirateDraws=[];window.pirateWarpChecks=[];const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(im,...args){
    if(im&&im.src&&im.src.includes('pirate-duel-42-20261117'))window.pirateDraws.push(im.src);
    if(im&&im.duelPad!=null&&args.length===4){
     const c=im.getContext('2d'),top=c.getImageData(0,0,im.width,1).data,bottom=c.getImageData(0,im.height-1,im.width,1).data;
     let edge=0;for(let i=3;i<top.length;i+=4)edge=Math.max(edge,top[i],bottom[i]);
     window.pirateWarpChecks.push({height:im.height,pad:im.duelPad,edge});
    }
    return draw.call(this,im,...args);
   };
  });
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async()=>{
   const a=G.DUEL_ART,checks=[],ok=(v,l)=>{if(!v)throw Error(l);checks.push(l);};
   ok(a.pirateFighters.length===41,'기존 인물 41명');
   for(const [id,name] of a.pirateFighters){
    ok(a.pick({name,look:'pirate'})===id&&a.pick({id,name:'이름 변경'})===id,name+' 이름·ID 연결');
    const im=await G.Img.load(a.fighterFiles[id]);ok(im&&im.naturalWidth===2592&&im.naturalHeight===1216,name+' 실제 파일 로딩');
   }
   for(const [alias,id] of [['omalley','pr_omalley'],['bonny','pr_bonny'],['mread','pr_read'],['blackbeard','pr_teach']])ok(a.pick({m:{id:alias}})===id,alias+' 동료 연결');
   ok(a.pick({hist:'rv_teach'})==='pr_teach','역사 사건 연결');
   ok(a.pick({id:'pr_teach',sprite:'samurai'})==='samurai','명시된 시트 우선');
   ok(a.pick({name:'해적 두목',look:'pirate'})!=='pr_teach','일반 해적 구분');
   ok(!a.fighterFiles.concept_zahra,'미등록 후보 제외');
   const s=G.Game.state=G.State.newGame({name:'해적 시트 시험',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.flags.prologue=true;
   G.Games.duel({id:'pr_teach',name:'에드워드 티치',look:'pirate',str:70},{place:'deck',mate:{id:'bonny',hp:100}});
   return {checks};
  });
  await page.waitForFunction(()=>G.Games._duelDebug&&G.Games._duelDebug.en.spriteImg&&G.Games._duelDebug.me.spriteImg);
  await page.waitForFunction(()=>pirateDraws.some(x=>x.includes('pr_teach.png'))&&pirateDraws.some(x=>x.includes('pr_bonny.png')));
  report.duel=await page.evaluate(()=>({enemy:G.Games._duelDebug.en.spriteId,ally:G.Games._duelDebug.me.spriteId,draws:[...new Set(pirateDraws)]}));
  assert.equal(report.duel.enemy,'pr_teach');assert.equal(report.duel.ally,'pr_bonny');
  report.motion=await page.evaluate(async()=>{
   const f=G.Games._duelDebug.en,original=Object.assign({},f),tested=[];
   for(const [id] of G.DUEL_ART.pirateFighters){
    f.spriteId=id;f.spriteImg=await G.Img.load(G.DUEL_ART.fighterFiles[id]);f.atkSheet=f.reactSheet=null;
    for(const [pose,pt,lift] of [['wind',.6,-68],['contact',.5,58],['guardHit',.4,0],['down',.8,0]]){
     Object.assign(f,{pose,pt,poseT:0,armLift:lift,preFall:0,flash:0});
     await new Promise(r=>setTimeout(r,65));tested.push(id+':'+pose);
    }
   }
   Object.assign(f,original);
   return {tested,warps:pirateWarpChecks.length,edgeMax:Math.max(0,...pirateWarpChecks.map(x=>x.edge)),minHeight:Math.min(...pirateWarpChecks.map(x=>x.height))};
  });
  assert.equal(report.motion.tested.length,164);assert(report.motion.warps>=82);
  assert.equal(report.motion.edgeMax,0);assert(report.motion.minHeight>304);
  report.strikes=await page.evaluate(async()=>{
   const d=G.Games._duelDebug;d.me.hp=d.me.maxHp=d.en.hp=d.en.maxHp=10000;
   for(const f of [d.me,d.en])for(const move of ['slash','thrust','bash'])await d.strike(f,move,{sure:true,noCrit:true});
   return {allyHp:d.me.hp,enemyHp:d.en.hp,moves:6};
  });
  assert(report.strikes.allyHp<10000&&report.strikes.enemyHp<10000);
  await page.evaluate(()=>G.Games._duelDebug.choose('guard'));
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(OUT,'runtime-duel.png')});
  assert.deepEqual(errors,[]);report.errors=errors;
  fs.writeFileSync(path.join(OUT,'runtime-report.json'),JSON.stringify(report,null,2));
  console.log('해적 전용 시트: '+report.checks.length+'개 검사, 41명·164개 자세 렌더링, 공격 높이 보정 가장자리 잘림 0, 오류 0');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
