/* 숫자로 고른 방위만 보지 않고 실제 선택된 부하·탈것·동작까지 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/expedition-mounts-20261124');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[];try{
  const page=await browser.newPage({viewport:{width:1380,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.join(ROOT,'test_expedition_formation.html')).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.formationDemo&&G.EXPEDITION_MOUNT_ART,null,{polling:100});
  await page.waitForFunction(()=>Object.values(G.EXPEDITION_PAINTED.sheets).concat(Object.values(G.EXPEDITION_MOUNT_ART.sheets)).every(s=>!!G.Img.get(s.key))&&Object.keys(G.EXPEDITION_MOTION.mounts).every(id=>G.ExpeditionMotion.ready(id)&&G.ExpeditionMotion.ready(id,'turn'))&&G.ExpeditionFormation.crewReady(),null,{polling:100,timeout:90000});
  const report=await page.evaluate(()=>{
   const defs=[['walk','foot'],['porter','porter'],['horse','horse'],['camel','camel'],['camel','camel2','st'],['donkey','donkey'],['llama','llama'],['yak','yak'],['wagon','wagon'],['wagon','oxwagon',null,'ox'],['elephant','elephant'],['reindeer','reindeer']];
   const cv=document.createElement('canvas');cv.width=1000;cv.height=800;const ctx=cv.getContext('2d'),cases=[],fail=[];
   for(const [id,kind,region,draft] of defs)for(const gender of ['m','f'])for(const fast of [false,true])for(const n of [1,99])for(let dir=0;dir<8;dir++){
    const head=Math.PI/2-dir*Math.PI/4,u={pts:[[500,450]],mount:{id,n},region,draft,heroGender:gender,fast,party:4,head,phase:.25,moving:true,t:0,size:1,cache:{}};
    const items=G.Party.draw(ctx,u),leader=items.find(i=>i.leader),female=items.find(i=>!i.leader&&i.gender==='f');
    const valid=items.length===4&&items.every(i=>i.cell&&i.im&&i.direction===dir&&Math.abs(Math.atan2(Math.sin(i.heading-head),Math.cos(i.heading-head)))<1e-6)&&leader.appearance==='captain_'+gender+(kind==='foot'||kind==='porter'?'':'_'+kind);
    const expectedFemale=female.role==='foot'?'scout_f':'scout_f_'+female.role;
    const femalesOk=female&&female.appearance===expectedFemale;
    const runOk=items.filter(i=>i.sheet.character&&i.sheet.kind==null).every(i=>i.sheet.action===(fast?'run':'walk'));
    if(!valid||!femalesOk||!runOk)fail.push({id,kind,gender,fast,n,dir,valid,femalesOk,runOk,items:items.map(i=>({role:i.role,row:i.row,heading:i.heading,appearance:i.appearance,action:i.sheet.action}))});
    cases.push({kind,gender,fast,n,dir});
   }
   // 같은 캐시에서 정지 회전해도 부하만 이전 방위를 보는 일이 없어야 한다.
   const u={pts:[[500,450]],mount:{id:'walk'},heroGender:'m',party:4,moving:true,phase:.3,t:0,size:1,cache:{}};
   const staticTurns=[];
   for(let dir=0;dir<8;dir++){
    const heading=Math.PI/2-dir*Math.PI/4;u.t+=.1;
    const chosen={action:'walk',heading,phase:.3};
    const items=G.ExpeditionFormation.draw(ctx,u,chosen,G.Img.get(G.EXPEDITION_MOTION.sheets.on_foot_walk.key));
    staticTurns.push(items.every(i=>i.row===dir&&Math.abs(i.heading-heading)<1e-6));
   }
   return{cases:cases.length,fail,staticTurns,mountAssets:Object.keys(G.EXPEDITION_MOUNT_ART.sheets).length};
  });
  assert.deepStrictEqual(report.fail,[],'전원 방위·인물·탈것·걷기/달리기');assert(report.staticTurns.every(Boolean),'같은 캐시의 자동 회전');assert(report.mountAssets===32);
  for(const gender of ['m','f']){
   await page.selectOption('#hero',gender);await page.selectOption('#direction','5');await page.selectOption('#speed','2');await page.selectOption('#ground','#c9b47e');
   await page.evaluate(()=>{for(let i=0;i<80;i++)formationDemo.step(1000+i*16.667);});
   const ui=await page.evaluate(()=>formationDemo.cards.map(c=>({id:c.id,items:c.items.map(i=>({direction:i.direction,appearance:i.appearance,gait:i.gait}))})));
   assert(ui.every(c=>c.items.every(i=>i.direction===5)),'사용자 캡처의 남서·2배속 실제 미리보기');
   await page.screenshot({path:path.join(OUT,'southwest-'+gender+'.png'),fullPage:true});
   if(gender==='f')for(let card=0;card<12;card++)await page.locator('article canvas').nth(card).screenshot({path:path.join(OUT,'mount-preview-'+card+'.png')});
  }
  // 여성 부하가 걷기로 남지 않는 실제 대열의 연속 장면.
  for(let frame=0;frame<8;frame++){
   await page.evaluate(frame=>{
    const canvas=formationDemo.cards[0].cv,ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#c9b47e';ctx.fillRect(0,0,600,420);
    G.Party.draw(ctx,{pts:[[350,245]],mount:{id:'walk'},heroGender:'f',party:4,moving:true,fast:true,head:-Math.PI*.75,phase:frame/8,t:0,size:2.2,cache:{}});
   },frame);
   await page.locator('article canvas').first().screenshot({path:path.join(OUT,'run-sw-'+frame+'.png')});
  }
  assert.deepStrictEqual(errors,[],'콘솔 오류');report.errors=errors;fs.writeFileSync(path.join(OUT,'directions-results.json'),JSON.stringify(report,null,2));
  console.log('통과 — '+report.cases+'조합 · 12종 이동 수단 · 전원 8방위 · 남녀 제독 · 여성 부하 · 수량별 도보/탑승 · 정지 회전 · 남서 2배속 / 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
