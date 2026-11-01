/* 실제 항해의 모든 역할·선종, 정지/배속/카메라, 물길과 발자국의 실제 초 수명. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/water-tracks-20261101');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']});
 const errors=[],report={};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>requestAnimationFrame=()=>0);
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Game&&G.State,null,{polling:100});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=1);
   const s=G.Game.state=G.State.newGame({name:'물길 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'});
   s.settings.res=.35;s.fleet.ships=['galleon','geobukseon','galley'].map(id=>G.R.newShip(id));s.fleet.crew=400;s.loc={mode:'sea',lon:-30,lat:30,heading:0};
   const escort=G.R.newShip('carrack');escort.escort=true;window.__escort=G.Escort.seaShips;G.Escort.seaShips=ships=>ships.concat(escort);
   G.Game.go('sea',{fresh:true});const B=G.Scenes.sea,st=B.runtime();st.dayAcc=-1000;st.cam.zoom=330;st.cam.zoomT=0;st.manual=true;B.takeCourse(0);st.vel=[1,0];st.fwd=1;
   st.npcs=[['merchant',-31,31],['pirate',-30,29],['navy',-28.5,30.9]].map((v,i)=>({id:'wake'+i,kind:v[0],lon:v[1],lat:v[2],heading:0,spd:.55,n:2,ships:['caravel','junk'],nation:'ES',K:.3,cooldown:100}));B.update(0);
  });
  for(let i=0;i<14;i++)await page.evaluate(()=>{const st=G.Scenes.sea.runtime();st.frame=0;G.Scenes.sea.update(.08);});
  report.roles=await page.evaluate(()=>Object.entries(G.Scenes.sea.runtime().shipWater).map(([key,w])=>({key,type:w.type,points:w.fx.trail.length,particles:w.fx.parts.length})));
  assert.equal(report.roles.length,10);assert(report.roles.every(r=>r.points>0),JSON.stringify(report.roles));
  await page.screenshot({path:path.join(OUT,'all-roles-moving.png')});console.log('기함·동행선·호위 상선·상선·해적·군함 물길 확인');
  report.paused=await page.evaluate(()=>{const B=G.Scenes.sea,st=B.runtime();st.paused=true;st.frame=0;const old=st.shipWater['npc:wake0:0'].fx.trail.at(-1).x;B.update(.15);return{flag:st.fx.last.sr,npcMoved:st.shipWater['npc:wake0:0'].fx.trail.at(-1).x!==old};});assert.equal(report.paused.flag,0);assert(report.paused.npcMoved);
  report.fade=await page.evaluate(()=>[0,.9,1,1.7,2.4].map(t=>({t,water:G.SeaFX.fade(t),foot:G.ExpeditionTracks.fade(t),fallback:G.Party.trackFade(t)})));
  assert(report.fade.slice(0,3).every(r=>r.water===1&&r.foot===1&&r.fallback===1));assert(Math.abs(report.fade[3].water-.5)<1e-8);assert(report.fade[4].foot===0&&report.fade[4].water===0);
  report.stopped=await page.evaluate(()=>{const B=G.Scenes.sea,st=B.runtime();st.busy=1;const before=Object.values(st.shipWater).reduce((n,w)=>n+w.fx.trail.length,0);st.speed=4;st.cam.zoom=650;B.update(.9);const held=Object.values(st.shipWater).reduce((n,w)=>n+w.fx.trail.length,0);B.update(1.6);return{before,held,points:Object.values(st.shipWater).reduce((n,w)=>n+w.fx.trail.length,0),particles:Object.values(st.shipWater).reduce((n,w)=>n+w.fx.parts.length,0)};});
  assert(report.stopped.held>0&&report.stopped.held<=report.stopped.before);assert.equal(report.stopped.points,0);assert.equal(report.stopped.particles,0);
  await page.screenshot({path:path.join(OUT,'stopped-after-fade.png')});
  report.cleanup=await page.evaluate(()=>{const B=G.Scenes.sea,st=B.runtime();st.npcs=[];B.update(0);B.update(2.5);const left=Object.keys(st.shipWater);B.exit('land');G.Escort.seaShips=__escort;return{left,released:Object.keys(st.shipWater).length===0&&!G.Ship3D.stats().ready};});assert(report.cleanup.left.every(k=>k.startsWith('fleet:')));assert(report.cleanup.released);
  // 36종 전체의 실제 3D와 독립 물길을 한 장으로 확인한다.
  const atlas=await page.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=1560;cv.height=1800;const ctx=cv.getContext('2d'),rows=[];
   G.SHIP_TYPES.forEach((sh,i)=>{
    const col=i%6,row=Math.floor(i/6),x=col*260,y=row*300;ctx.save();ctx.beginPath();ctx.rect(x,y,260,300);ctx.clip();ctx.fillStyle='#163d50';ctx.fillRect(x,y,260,300);
    const F=G.SeaFX.create({spacing:3,kz:1}),g={len:150,wid:150*G.SeaFX.profile(sh.id).width,ref:105,type:sh.id};
    for(let f=0;f<30;f++){const h=(i%3-1)*.13*Math.sin(f/20);G.SeaFX.step(F,{x0:f*3,y0:0,x:(f+1)*3,y:0,h,vx:105,vy:0,lat:i%3===1?20:0,turn:i%3===1?.4:0},g);G.SeaFX.age(F,1/30);}
    const px=x+150,py=y+223;G.SeaFX.draw(F,ctx,(a,b)=>[px+a-90,py-b],1,150);G.SeaFX.drawHull(F,ctx,px,py,0,150,1,.2,1,2+i*.23);
    const look=G.Art.shipLook(sh.id,{flag:'#e6c36c'});look.sid='water-atlas-'+sh.id;look.noWake=true;look.furl=i%3===1?.6:0;look.motionSpeed=1;
    G.Ship3D.beginFrame();const ok=G.Ship3D.draw(ctx,px,py,i%2?.15:-.1,150,look,2+i*.2);G.Ship3D.endFrame();
    ctx.fillStyle='#f5e6bd';ctx.font='16px sans-serif';ctx.fillText(sh.name,x+14,y+24);ctx.fillStyle='#93cbd3';ctx.font='12px sans-serif';ctx.fillText(sh.id+' · '+(sh.oar?'노 파문':sh.cap>=550?'넓은 포말':'선측 물살'),x+14,y+45);ctx.restore();
    rows.push({id:sh.id,ok,points:F.trail.length,particles:F.parts.length});
   });G.Ship3D.dispose();return{url:cv.toDataURL(),rows};
  });report.types=atlas.rows;assert.equal(report.types.length,36);assert(report.types.every(r=>r.ok&&r.points>0));fs.writeFileSync(path.join(OUT,'all-36-ships.png'),Buffer.from(atlas.url.split(',')[1],'base64'));
  report.tracks=await page.evaluate(()=>{
   const rows=[];for(const role of ['foot','porter','horse','camel','camel2','donkey','llama','yak','wagon','oxwagon','elephant','reindeer']){
    const state={root:{x:0,y:0},trail:[[0,0],[-50,0]]},u={pts:[[0,0]],follow:{zoom:1},t:0,cache:{formation:state}};
    for(let f=0;f<10;f++){u.t=f*.06;G.ExpeditionTracks.update(u,[{index:0,role,worldX:f*8,worldY:0,heading:0}],1);}
    const marks=state.tracks.length,kinds=[...new Set(state.tracks.map(m=>m.type))];u.t+=2.5;G.ExpeditionTracks.update(u,[{index:0,role,worldX:72,worldY:0,heading:0}],1);rows.push({role,marks,kinds,after:state.tracks.length,route:state.trail.length});
   }return rows;
  });assert(report.tracks.every(r=>r.marks>0&&r.after===0&&r.route===2));
  const tracksImage=await page.evaluate(()=>{
   const cv=document.createElement('canvas');cv.width=1000;cv.height=460;const ctx=cv.getContext('2d');ctx.fillStyle='#c5b58a';ctx.fillRect(0,0,1000,460);
   const ages=[0,.9,1.7,2.4],kinds=['boot','hoof','pad','split','elephant','wheel','runner'];
   ages.forEach((age,c)=>{ctx.globalAlpha=1;ctx.fillStyle='#302819';ctx.font='18px sans-serif';ctx.fillText(age+'초',c*250+25,32);kinds.forEach((type,r)=>{ctx.save();ctx.translate(c*250+90,65+r*55);ctx.fillStyle=ctx.strokeStyle='#3c2c1d';ctx.globalAlpha=G.ExpeditionTracks.fade(age)*.36;ctx.scale(3,2.1);if(type==='wheel'||type==='runner'){ctx.lineWidth=type==='wheel'?1.5:1.1;ctx.beginPath();ctx.moveTo(-12,-4);ctx.lineTo(12,-4);ctx.moveTo(-12,4);ctx.lineTo(12,4);ctx.stroke();}else G.ExpeditionTracks.glyph(ctx,type);ctx.restore();ctx.globalAlpha=1;ctx.fillStyle='#4c402c';ctx.font='13px sans-serif';ctx.fillText(type,c*250+140,70+r*55);});});return cv.toDataURL();
  });fs.writeFileSync(path.join(OUT,'tracks-fade.png'),Buffer.from(tracksImage.split(',')[1],'base64'));
  assert.deepStrictEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('OK: 36종·10척 역할·배속/정지/확대·1초 유지/2.4초 소멸·발자국 12종·경로 보존·효과 해제·오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
