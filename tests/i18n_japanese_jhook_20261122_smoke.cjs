/* 해적여제 일본어: 실제 자료 전체·대사/선택 분기·도시 치환·실제 대화창과 결말을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-ja-jhook-20261122');
function checkCorpus(){
 const ctx=vm.createContext({document:{body:null,documentElement:{dataset:{}},querySelector(){return null;},addEventListener(){}},navigator:{languages:['ko-KR']},location:{protocol:'file:'},localStorage:{getItem(){return null;},setItem(){}}});
 vm.runInContext('window=globalThis;G={};',ctx);
 for(const file of ['js/core/util.js','js/data/base.js','js/data/cities.js','js/core/i18n.js','js/lang/ja.js','js/data/jhook.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),ctx,{filename:file});
 const I=ctx.G.I18N;I.lang='ja';const missing=[],result={dialogueLines:0,pages:0,choices:0,branches:0,fields:0,cityVariants:0,preserved:0};
 function check(ko,key){if(!/[가-힣]/.test(ko))return;const ja=I.tx(ko);if(/[가-힣]|⟦|⟪|\$\d|\{(?:name|city)\}/.test(ja))missing.push({key,ko,ja});}
 function pages(ko,key){for(const line of ko.split('\f'))for(const city of ['리스본','런던','항구','마당섬']){check(line.replace(/\{city\}/g,city).replace(/\{name\}/g,'제시카'),key);result.cityVariants++;}}
 function lines(rows){for(const row of rows){if(Array.isArray(row)){result.dialogueLines++;result.pages+=row[1].split('\f').length;pages(row[1],'대사');}else if(row&&row.ask){result.choices++;pages(row.ask,'질문');for(const [label,next]of row.opts){result.branches++;check(label,'선택 단추');lines(next);}}}}
 for(const rows of Object.values(ctx.G.JHOOK.prologue))lines(rows);
 for(const beat of ctx.G.JHOOK.beats)lines(beat.lines);
 function walk(value,key){if(typeof value==='string'&&/[가-힣]/.test(value)){pages(value,key);result.fields++;}else if(Array.isArray(value))value.forEach((v,i)=>walk(v,key+'.'+i));else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>walk(v,key+'.'+k));}
 walk(ctx.G.JHOOK,'JHOOK');
 for(const line of ['걸린 날: 123일 · 동료 8명 · 바다가 부른 이름: 비밀 기사 · 버리지 않는 선장','(1553년 7월 무렵)','「해적여제 — 교수대 아래서 올린 깃발」 — 끝','항해를 이어 간다'])check(line,'진행기 문구');
 const oldFile=process.env.PREVIOUS_JA_FILE||path.join(OUT,'ja-before.js');
 if(fs.existsSync(oldFile)){
  let old;vm.runInNewContext(fs.readFileSync(oldFile,'utf8'),{window:{G:{I18N:{add(id,pack){old=pack;}}}}});
  const current=I.packs.ja;
  for(const field of ['text','name','city','good'])for(const [key,tr]of Object.entries(old[field])){assert.equal(current[field][I.norm(key)],tr,field+' '+key);result.preserved++;}
  const patterns=new Map(current.pat.map(([rx,tr])=>[rx.source,tr]));
  for(const [rx,tr]of old.pat)assert.equal(patterns.get(new RegExp(rx).source),tr,'기존 치환 틀 '+rx);
  for(const [group,values]of Object.entries(old.person))for(const [key,tr]of Object.entries(values))assert.equal(current.person[group][I.norm(key)],tr,'기존 인명 조각');
  result.preservedPatterns=old.pat.length;
 }
 fs.writeFileSync(path.join(OUT,'corpus.json'),JSON.stringify({...result,missing},null,2));
 assert.equal(missing.length,0,JSON.stringify(missing.slice(0,15)));return result;
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const result=checkCorpus();
 if(process.env.CORPUS_ONLY){console.log(JSON.stringify(result));return;}
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],screens={};
 const deadline=setTimeout(()=>browser.close(),120000);
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900},locale:'ja-JP'});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ja');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  console.log('일본어 해적여제 실제 대화창·선택 분기 검사');
  await p.evaluate(()=>{
   const s=G.State.newGame({name:'제시카 후크',given:'제시카',surname:'후크',nation:'PT',job:'explorer',age:20,birth:{m:3,d:2},st:{str:64,int:66,mar:76,cha:78},sk:{},lg:[],diff:'normal'});
   s.player.g='f';s.player.look='jessica';s.player.home=38;s.player.lg[3]=3;s.date={y:1561,m:4,d:1};s.jhook={act:16,prologue:1,beats:{},titles:['비밀 기사','버리지 않는 선장']};
   s.mates=G.JHOOK.mates.map(d=>({id:d.id,role:'none',joined:G.U.dateNum(s.date),loyal:88}));
   G.Game.state=s;G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();
  });
  async function grab(name){
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.body);const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=w.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;
     if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());
     if(n.nodeType===1)for(const a of ['title','placeholder','aria-label','alt'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(a+': '+n.getAttribute(a));
    }return [...new Set(out)];
   });screens[name]=missing;await p.screenshot({path:path.join(OUT,name+'.png')});assert.deepEqual(missing,[],name+' 미번역');
  }
  async function finishDialogue(){for(let i=0;i<30&&await p.locator('.dlg').count();i++){await p.waitForTimeout(250);await p.keyboard.press('Escape');}assert.equal(await p.locator('.dlg').count(),0);await p.evaluate(()=>window.jaPlay);}
  await p.evaluate(()=>{G.Info.open('jhook');});await p.waitForSelector('.notebook-win');await grab('ja-notebook');await p.keyboard.press('Escape');
  for(const [id,index,name]of [['a1',6,'ja-roger'],['pro',3,'ja-child']]){
   await p.evaluate(([id,index])=>{window.jaPlay=G.JHook.play([G.JHOOK.prologue[id][index]]);},[id,index]);
   await p.waitForSelector('.dlg');await grab(name);await finishDialogue();
  }
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{window.jaPlay=G.JHook.play([G.JHOOK.beats[0].lines[4]]);});await p.waitForSelector('.dlg');await grab('ja-killigrew-small');await finishDialogue();
  await p.evaluate(()=>{const row=G.JHOOK.beats.find(b=>b.id==='a14_after').lines.find(r=>r.ask);window.jaChoice=G.UI.ask(row.ask,row.opts.map((o,i)=>({label:o[0],value:i})),G.JHook.who('P'));});
  await p.waitForSelector('.askrow button');await grab('ja-final-choice-small');
  const choiceRects=await p.locator('.askrow button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,top:r.top,bottom:r.bottom};}));
  assert.equal(choiceRects.length,2);for(const r of choiceRects)assert(r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.keyboard.press('Escape');await p.evaluate(()=>window.jaChoice);
  await p.setViewportSize({width:1280,height:900});
  await p.evaluate(()=>{G.JHook.apply({finale:true},{});});await p.waitForSelector('.modal-back .content');await grab('ja-finale');await p.keyboard.press('Escape');
  const restored=await p.evaluate(()=>{G.I18N.set('ko');return G.I18N.tx(G.JHOOK.prologue.a1[6][1]);});assert.match(restored,/[가-힣]/);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify({...result,screens,choiceRects,koreanRestored:true,errors},null,2)+'\n');
  console.log(JSON.stringify({...result,screens:Object.keys(screens).length,errors}));
 }finally{clearTimeout(deadline);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
