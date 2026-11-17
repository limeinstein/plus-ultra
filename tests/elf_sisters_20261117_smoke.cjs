'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/elf-sisters-20261117'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const errors=[],page=await browser.newPage({viewport:{width:960,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.ELF_SISTERS&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async()=>{
   const checks=[],ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
   const crew=G.ELF_SISTERS.map(id=>G.MATE[id]),T=G.Scenes.city.B.tavern;
   const s=G.Game.state=G.State.newGame({name:'엘프 자매 시험',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   s.player.fame=100000;s.player.gold=500000;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.flags.prologue=true;
   ok(crew.length===20&&new Set(crew.map(m=>m.id)).size===20&&new Set(crew.map(m=>m.name)).size===20,'고유 이름·ID 20명');
   ok(new Set(crew.map(m=>m.sisterPair)).size===10,'서로 다른 자매 10쌍');
   const original={confirm:G.UI.confirm,say:G.UI.say,window:G.UI.window,afterHire:G.Achieve.afterHire};
   G.UI.confirm=async()=>true;G.UI.say=async()=>{};G.UI.window=()=>({result:Promise.resolve(1)});G.Achieve.afterHire=async()=>[];
   try{
    for(const m of crew){
     const sister=G.MATE[m.sisterId];
     ok(sister&&sister.sisterId===m.id&&sister.sisterPair===m.sisterPair&&sister.sisterRank!==m.sisterRank,m.name+' 상호 자매 관계');
     ok(m.g==='f'&&m.race==='elf'&&m.portraitAge>=27&&m.desc.includes(sister.name),m.name+' 성인·관계 설명');
     ok(G.MATES.filter(x=>x.id===m.id||x.name===m.name).length===1,m.name+' 기존 명부와 중복 없음');
     ok(G.Frontier.mateReady(m)&&!G.MatePower.blocked(m),m.name+' 영입 가능');
     const city=G.MateMove.where(m.id);ok(city&&G.MATE_ZONES.nordic.ids.includes(city.id),m.name+' 북유럽 활동');
     ok(T.candidates(city).some(x=>x.id===m.id),m.name+' 실제 모집 명부');
     const face=G.Img.pick(G.Art.portraitKeys(G.Art.mateSpec(m.id))),half=G.Img.pick(G.Img.chain.mateHalf(m.id));
     ok(face===m.face&&half===m.halfKey,m.name+' 얼굴상·무릎상 선택');
     for(const [key,w,h] of [[face,512,512],[half,1024,1536]]){
      const image=await G.Img.load(key),coord=G.PORTRAIT_FACES[key];
      ok(image&&image.naturalWidth===w&&image.naturalHeight===h&&coord&&coord.box[2]>0,m.name+' 그림 해독·규격·얼굴 자리 '+key);
     }
     ok(await T.hireMate(city,m),m.name+' 실제 고용');
     ok(s.mates.some(x=>x.id===m.id)&&!T.candidates(city).some(x=>x.id===m.id),m.name+' 고용 후 후보 제외');
    }
   }finally{Object.assign(G.UI,{confirm:original.confirm,say:original.say,window:original.window});G.Achieve.afterHire=original.afterHire;}
   G.Game.state=G.State.deserialize(G.State.serialize());
   ok(crew.every(m=>G.Game.state.mates.some(x=>x.id===m.id)),'20명 동시 고용 저장·복원');
   return {checks,characters:crew.map(m=>({id:m.id,name:m.name,sister:m.sisterId,rank:m.sisterRank})),preview:crew[0].id};
  });
  await page.evaluate(id=>{G.UI.say('제 여동생 아르웬도 이 바다를 여행하고 있어요. 함께라면 먼 항해도 두렵지 않아요.',{name:G.MATE[id].name,portrait:G.Art.mateSpec(id),half:G.Img.chain.mateHalf(id)});},report.preview);
  await page.waitForSelector('.dlg-actor.active.tall');await page.waitForTimeout(400);
  await page.screenshot({path:path.join(OUT,'dialogue.png')});await page.keyboard.press('Enter');
  await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#people',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.ELF_SISTERS&&G.Img,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>G.ELF_SISTERS.length),20);
  for(const name of ['갈라드리엘','아르웬']){
   await page.locator('#q').fill(name);await page.locator('#grid .card').filter({hasText:name}).first().click();
   const text=await page.locator('#detail').innerText();assert(text.includes(name)&&text.includes(name==='아르웬'?'여동생':'언니'));
   await page.screenshot({path:path.join(OUT,name==='아르웬'?'catalog-younger.png':'catalog-elder.png')});await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);report.errors=errors;
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log('엘프 자매: '+report.checks.length+'개 검사, 20명 실제 영입·저장·복원, 초상 40장, 게임·도감 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
