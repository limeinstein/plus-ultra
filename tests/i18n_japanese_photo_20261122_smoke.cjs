/* 일본어 「아버지의 사진」 자료·실제 말 끼우기·가족과 세대 계승·화면 검사. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-ja-photo-20261122');
fs.mkdirSync(out,{recursive:true});
let entry=path.join(root,'index.html');
if(process.env.JA_PHOTO_ALL_LANGS!=='1'){
 // 게임 코드·스타일·자료는 실제 index.html 그대로 읽고, 관련 없는 언어 묶음만 제외한다.
 // 모든 언어의 동시 등록은 기존 i18n_ja_smoke.cjs가 검사한다.
 const html=fs.readFileSync(entry,'utf8').replace(/<script src="js\/lang\/(?!ja\.js)[^"]+"><\/script>/g,'').replace('<head>','<head>\n<base href="'+pathToFileURL(root+path.sep).href+'">');
 entry=path.join(out,'focused.html');fs.writeFileSync(entry,html);
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={};const deadline=setTimeout(()=>browser.close(),180000);
 try{
  const p=await browser.newPage({locale:'ja-JP',viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(entry).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  await p.evaluate(()=>G.I18N.set('ja'));
  console.log('일본어 이야기 화면 준비');
  report.corpus=await p.evaluate(async()=>{
   const I=G.I18N,rows=[];function walk(v,key){if(typeof v==='string'&&/[가-힣]/.test(v)){for(const t of v.split('\f'))if(t.trim())rows.push({key,t});}else if(Array.isArray(v))v.forEach((x,n)=>walk(x,key+'.'+n));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k));}
   walk(G.STORY,'photo');G.Story.start();
   const s=G.Game.state,maids=Object.keys(G.MAID);s.player.wife=maids[0];s.player.kids=[{name:'마테우스',sex:'m',born:0}];
   const oldSay=G.UI.say,oldAsk=G.UI.ask,oldGrandma=G.Story.grandma,missing=[];let raw='',speakerChecks=0;
   // 포맷 검사에는 초상 생성이 필요 없어 할머니의 표시 이름만 고정한다.
   G.Story.grandma=()=>({name:'레오노르 할머니'});
   G.UI.say=async(text,opts)=>{raw=String(text);if(opts&&opts.name){const tr=I.tx(opts.name);speakerChecks++;if(/[가-힣]|⟦|⟧/.test(tr))missing.push({key:'speaker',raw:opts.name,tr});}};G.UI.ask=async()=>0;
   let checked=0;
   try{for(const generation of [1,2,3])for(const forced of [false,true]){
    s.player.generation=generation;s.player.given='마테우스';
    s.story.line=[{gen:generation,dad:'마테우스 다 코스타',dadGiven:'마테우스',forced,mom:maids[1]}];
    for(const row of rows){if(generation===1&&/\.homeLife\.heir\.|\.ending\.heir|\.heirTrace\./.test(row.key))continue;await G.Story.play([['N',row.t]]);const tr=I.tr(raw,true);checked++;if(!tr||/[가-힣]|⟦|⟧|\$\d|\{[^}]+\}/.test(tr))missing.push({key:row.key,generation,forced,raw,tr});}
   }
   for(const who of ['P','G','A','E','M','O','F','keeper'])await G.Story.play([[who,G.STORY.prologue.intro[3][1]]]);
   }finally{G.UI.say=oldSay;G.UI.ask=oldAsk;G.Story.grandma=oldGrandma;}
   return{uniqueOriginalLines:new Set(rows.map(r=>r.t)).size,checks:checked,speakerChecks,missing:missing.filter((m,i,a)=>a.findIndex(x=>x.raw===m.raw)===i)};
  });
  console.log('사진 이야기 자료 검사',report.corpus.checks,'누락',report.corpus.missing.length);
  if(process.env.JA_PHOTO_COLLECT==='1')return;
  assert.deepEqual(report.corpus.missing,[],'이야기·가족·세대별 대사 누락');
  const grab=async name=>{
   await p.waitForTimeout(120);
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.body);const out=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=walker.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;
     if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());
     if(n.nodeType===1)for(const a of ['title','placeholder','alt','aria-label'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(a+': '+n.getAttribute(a));
    }return [...new Set(out)];
   });
   report[name]=missing;await p.screenshot({path:path.join(out,name+'.png')});
   if(process.env.JA_PHOTO_COLLECT_SCREENS!=='1')assert.deepEqual(missing,[],name+' 화면 누락');
  };
  await p.evaluate(()=>{G.Story.start();G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();G.Info.open('story');});
  await grab('notebook-first');await p.keyboard.press('Escape');
  await p.evaluate(()=>{const s=G.Game.state;for(const tr of G.STORY.traces){s.disc[tr[0]]={day:0,found:true,me:true};s.hints[tr[0]]=true;}s.story.found=G.STORY.traces.map(t=>t[0]);s.story.letter=true;G.Info.open('story');});
  await grab('notebook-letter');await p.keyboard.press('Escape');
  report.atlantisStages=[];
  report.atlantisNames=await p.evaluate(()=>Object.fromEntries(G.Story.ATL_PATH.map(id=>[id,G.DISC[id].name])));
  for(const id of ['knossos','akrotiri','timaeus','gibraltar','gadir','azoresridge','atlantis']){
   await p.evaluate(id=>{G.Game.state.disc[id]={found:true,me:true,day:0};G.Info.open('story');},id);
   await grab('guide-'+id);report.atlantisStages.push(id);await p.keyboard.press('Escape');
  }
  await p.evaluate(()=>{G.Info.open('mates');});await grab('mates');
  for(let i=0;i<3;i++){
   await p.locator('.mb-person').nth(i).click();await grab('mate-'+i);await p.keyboard.press('Escape');
   if(i<2)await p.evaluate(()=>{G.Info.open('mates');});
  }
  await p.evaluate(()=>{G.Story.showPhoto();});await grab('photo-large');await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.Story.play([G.STORY.prologue.intro[3]]);});await grab('prologue-dialogue');
  for(let i=0;i<30&&await p.locator('.dlg').count();i++){await p.waitForTimeout(250);await p.keyboard.press('Escape');}assert.equal(await p.locator('.dlg').count(),0);
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{window.photoPlay=G.Story.play([G.STORY.homeLife.family[2].lines[3]]);});await p.waitForSelector('.askrow button');await grab('family-choice');
  report.choiceRects=await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,top:r.top,bottom:r.bottom};}));for(const r of report.choiceRects)assert(r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.keyboard.press('Escape');
  for(let i=0;i<30&&await p.locator('.dlg').count();i++){await p.waitForTimeout(250);await p.keyboard.press('Escape');}
  assert.equal(await p.locator('.dlg').count(),0);await p.evaluate(()=>window.photoPlay);await p.setViewportSize({width:1280,height:900});
  for(const generation of [2,3]){
   await p.evaluate(g=>{G.Game.state.player.generation=g;G.Info.open('story');},generation);await grab('heir-notebook-'+generation);await p.keyboard.press('Escape');
  }
  await p.evaluate(()=>{window.photoCut=G.Story.cut('atlantis');});await p.waitForSelector('.story-cut-win');await grab('atlantis-cut');await p.keyboard.press('Escape');await p.evaluate(()=>window.photoCut);
  await p.evaluate(()=>{G.Story.cut=async()=>false;G.UI.say=async()=>{};window.photoEnd=G.Story.ending();});await p.waitForSelector('.win .foot button');await grab('heir-ending');await p.keyboard.press('Escape');await p.evaluate(()=>window.photoEnd);
  await p.evaluate(()=>{G.Game.state.player.generation=1;delete G.Game.state.story.end;window.photoEnd=G.Story.ending();});await p.waitForSelector('.win .foot button');await grab('father-ending');await p.keyboard.press('Escape');await p.evaluate(()=>window.photoEnd);
  assert.deepEqual(errors,[]);
 }finally{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({...report,errors},null,2));clearTimeout(deadline);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
