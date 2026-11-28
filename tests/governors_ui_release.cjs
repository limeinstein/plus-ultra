/* 총독부 설립 확인창·실제 알현·역사 총독의 일일 취임을 공개판에서도 같은 방법으로 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE,args:['--no-sandbox','--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu']});
 const errors=[];try{
  const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');const raf=requestAnimationFrame.bind(window);requestAnimationFrame=cb=>cb.name==='loop'||String(cb).includes('.frameDue(')&&String(cb).includes('.scene.update(')?0:raf(cb)});
  await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.join(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.G?.Game?.sceneName==='title',null,{timeout:180000});
  const daily=await p.evaluate(async()=>{
   await G.Game.ensureGeo();
   window.govFresh=function(date){const s=G.Game.state=G.State.newGame({name:'총독부 화면 검사',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:70,int:70,mar:70,cha:70},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});s.flags.prologue=true;s.player.born={y:date.y-24,m:1,d:1};s.date=date;s.player.fame=100000;s.player.gold=25000;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;G.Colony.apply();G.ColonySp.apply();return s;};
   const s=govFresh({y:1623,m:7,d:6}),sp=G.Governors.found(G.CITY_DATA[173]);if(!sp)throw Error('취임 전 임명');const id=sp.id;
   G.Game.newDay();const result={date:G.U.dateNum(s.date),appointed:G.Sponsor.present(sp),historical:G.Sponsor.holder(G.SPONSOR.pt_macau)};
   if(result.date!==16230707||result.appointed||result.historical!=='프란시스쿠 드 마스카레냐스')throw Error('일일 취임 '+JSON.stringify(result));
   const fresh=govFresh({y:1632,m:1,d:1});if(G.SPONSOR[id])throw Error('새 일지에 임명 총독이 남음');
   fresh.conquests={148:{owner:G.R.myOwnerName(),from:'구자라트',date:16310101,day:1}};
   G.Game.go('city',{cityId:148,load:true});return{...result,newGameIsolated:true};
  });
  await p.waitForSelector('.town-menu',{timeout:180000});await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.city.isBusy(),null,{timeout:180000});
  const start=await p.evaluate(()=>{const c=G.CITY_DATA[148];if(!G.Governors.canFound(c))throw Error('설립 조건');const before=G.Game.state.player.gold;window.govPermit=G.Governors.permit(c);return before});
  await p.getByRole('button',{name:'총독부를 세운다',exact:true}).click();await p.evaluate(async()=>await window.govPermit);
  const founded=await p.evaluate(()=>{const s=G.Game.state,e=s.governorOffices[148],sp=e&&G.SPONSOR[e.id];if(!sp)throw Error('설립 명부');return{id:sp.id,name:G.Sponsor.holder(sp),gold:s.player.gold,cost:G.BALANCE.colonySp.officeCost,entry:G.Scenes.city.buildings(G.CITY_DATA[148]).some(b=>b.arg===sp.id),picture:G.Img.pick(G.Img.chain.interior(sp.bld,G.CITY_DATA[148],sp.id))}});
  assert.equal(start-founded.gold,12000);assert.equal(founded.cost,12000);assert(founded.entry&&founded.picture);
  await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.city.isBusy());
  await p.evaluate(id=>{window.govVisit=G.Scenes.city.visit('mansion',id)},founded.id);
  const out=process.env.OUT||path.join(__dirname,'../artifacts/governors-ui-check');fs.mkdirSync(out,{recursive:true});
  async function audience(name,file){
   for(let step=0;step<120;step++){
    const names=await p.locator('.dlg-stage .actor-name.speaking').allTextContents();
    if(names.some(x=>x.includes(name)&&!x.includes('집사'))){await p.waitForTimeout(800);await p.screenshot({path:path.join(out,file)});return true;}
    if(await p.locator('.dlg-stage').count())await p.keyboard.press('Enter');
    await p.waitForTimeout(250);
   }
   throw Error('문지기 뒤의 실제 후견인 알현이 나오지 않음: '+name);
  }
  async function finishVisit(){
   for(let step=0;step<120;step++){
    if(await p.evaluate(()=>!G.UI.busy()&&!G.Scenes.city.isBusy()))return;
    if(await p.locator('.dlg-stage').count())await p.keyboard.press('Enter');
    await p.waitForTimeout(250);
   }
   throw Error('알현 대화가 닫히지 않음');
  }
  const appointedAudience=await audience(founded.name,'appointed-audience.png');
  assert(await p.evaluate(id=>G.Sponsor.present(G.SPONSOR[id]),founded.id));
  await finishVisit();
  await p.evaluate(()=>{G.Game.go('city',{cityId:150,load:true})});await p.waitForSelector('.town-menu');await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.city.isBusy(),null,{timeout:180000});
  const historical=await p.evaluate(()=>{const sp=G.SPONSOR.pt_india;window.historicalVisit=G.Scenes.city.visit(sp.bld,sp.id);return{name:G.Sponsor.holder(sp),venue:G.Img.pick(G.Scenes.city.interiorKeys(sp.bld,G.CITY_DATA[150],sp.id)),face:G.Img.pick(G.Art.portraitKeys(G.Sponsor.face(sp).portrait))}});
  const historicalAudience=await audience(historical.name,'historical-audience.png');assert(await p.evaluate(()=>G.Sponsor.present(G.SPONSOR.pt_india)));assert.equal(historical.venue,'interiors/governors/goa');assert(historical.face);assert.deepEqual(errors,[]);
  const meta=await p.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'}));fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify({...meta,daily,founded,historical,appointedAudience,historicalAudience,errors},null,2));console.log(JSON.stringify({...meta,daily,founded,historical,appointedAudience,historicalAudience,errors}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
