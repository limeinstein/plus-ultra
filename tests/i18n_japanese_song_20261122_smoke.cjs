/* 바닷길 노래 일본어: 실제 자료·진행기의 치환·선택 분기·대화/지도/두 결말 화면. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-ja-song-20261122');
function corpus(){
 const ctx=vm.createContext({document:{body:null,documentElement:{dataset:{}},querySelector(){return null;},addEventListener(){}},navigator:{languages:['ko-KR']},location:{protocol:'file:'},localStorage:{getItem(){return null;},setItem(){}}});
 vm.runInContext('window=globalThis;G={};',ctx);
 for(const f of ['js/core/util.js','js/data/base.js','js/data/cities.js','js/core/i18n.js','js/lang/ja.js','js/data/song.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f});
 const I=ctx.G.I18N;I.lang='ja';const result={dialogueLines:0,pages:0,choices:0,branches:0,fields:0,combinations:0,preserved:0},missing=[];
 function check(ko,key){if(!/[가-힣]/.test(ko))return;const ja=I.tx(ko);if(/[가-힣]|⟦|⟪|\$\d|\{(?:name|city|ship|rep)\}/.test(ja))missing.push({key,ko,ja});}
 const reps=['','「서호의 연밥 따는 노래」.','「서호의 연밥 따는 노래」, 「가믈란 물결 가락」.'];
 function pages(text,key){for(const p of text.split('\f'))for(const city of ['리스본','한산도','항구'])for(const rep of reps){check(p.replace(/\{city\}/g,city).replace(/\{name\}/g,'소영').replace(/\{ship\}/g,'물마루').replace(/\{rep\}/g,rep),key);result.combinations++;}}
 function lines(rows){for(const row of rows||[]){if(Array.isArray(row)){result.dialogueLines++;result.pages+=row[1].split('\f').length;pages(row[1],'대사');}else if(row&&row.ask){result.choices++;pages(row.ask,'질문');for(const [label,next]of row.opts){result.branches++;check(label,'선택 단추');lines(next);}}}}
 for(const rows of Object.values(ctx.G.SONG.prologue))lines(rows);
 for(const beat of ctx.G.SONG.beats)lines(beat.lines);
 for(const rows of Object.values(ctx.G.SONG.markScenes))lines(rows);
 lines(ctx.G.SONG.ending.meet);
 function walk(v,key){if(typeof v==='string'&&/[가-힣]/.test(v)){pages(v,key);result.fields++;}else if(Array.isArray(v))v.forEach((x,i)=>walk(x,key+'.'+i));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k));}
 walk(ctx.G.SONG,'SONG');
 for(const s of ['걸린 날: 123일 · 공연 12번 · 배운 노래 3곡','공연 12번 · 관객 1,234명 · 배운 노래 3곡 · 고친 지도 8곳','사또 임처사와 「공자 사당」 탐색 계약을 맺었다. (선금 1,200닢, 기한 1482년 5월 1일)','도현을 만났다. 끝맺지 못한 노래에 마지막 소절이 붙었다. 「바닷길 노래」는 이제 끝까지 부를 수 있다. (탐험 명성 +900 · 사교 명성 +300)','「내가 가 본 데부터 이야기해 줄게. 그다음은 네가 가서 알려 줘.」'])check(s,'진행기');
 const before=process.env.PREVIOUS_JA_FILE||path.join(OUT,'ja-before.js');
 if(fs.existsSync(before)){
  let old;vm.runInNewContext(fs.readFileSync(before,'utf8'),{window:{G:{I18N:{add(id,pack){old=pack;}}}}});const p=I.packs.ja;
  for(const field of ['text','name','city','good'])for(const [key,tr]of Object.entries(old[field])){assert.equal(p[field][I.norm(key)],tr,'기존 번역 '+field+' '+key);result.preserved++;}
  const pats=new Map(p.pat.map(([rx,tr])=>[rx.source,tr]));for(const [rx,tr]of old.pat)assert.equal(pats.get(new RegExp(rx).source),tr,'기존 틀 '+rx);
  for(const [g,items]of Object.entries(old.person))for(const [ko,tr]of Object.entries(items))assert.equal(p.person[g][I.norm(ko)],tr,'기존 인명');result.preservedPatterns=old.pat.length;
 }
 fs.writeFileSync(path.join(OUT,'corpus.json'),JSON.stringify({...result,missing},null,2));assert.equal(missing.length,0,JSON.stringify(missing.slice(0,15)));return result;
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const result=corpus();if(process.env.CORPUS_ONLY){console.log(JSON.stringify(result));return;}
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],screens={};const deadline=setTimeout(()=>browser.close(),180000);
 try{
  const p=await browser.newPage({locale:'ja-JP',viewport:{width:1280,height:900}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ja');localStorage.setItem('pu_song_preview','1');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  console.log('일본어 바닷길 노래 실제 진행기 치환 검사');
  await p.evaluate(()=>{G.SongStory.start();const s=G.Game.state;s.song.prologue=1;s.mates=['sy_hwanggyu','sy_woldam','sy_imcheosa','gyeonwoo','jiknyeo','jina','sy_malindi','sy_hook'].map(id=>({id,role:'none',loyal:90}));G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();});
  result.runtime=await p.evaluate(async()=>{
   const say=G.UI.say,ask=G.UI.ask,missing=[];let count=0;
   function check(text){for(const ko of String(text).split('\f')){const ja=G.I18N.tx(ko);count++;if(/[가-힣]|\{(?:name|city|ship|rep)\}|⟦/.test(ja))missing.push({ko,ja});}}
   const s=G.Game.state;
   try{
    G.UI.say=async(text,opts)=>{check(text);if(opts&&opts.name)check(opts.name);};G.UI.ask=async(text,choices,opts)=>{check(text);choices.forEach(o=>check(o.label));if(opts&&opts.name)check(opts.name);return window.songChoice||0;};
    for(const city of [0,229])for(const rep of [[],['6'],['6','8']])for(const choice of [0,1]){
     s.loc.city=city;s.song.rep=rep;window.songChoice=choice;
     for(const rows of Object.values(G.SONG.prologue))await G.SongStory.play(rows);
     for(const beat of G.SONG.beats)await G.SongStory.play(beat.lines);
     for(const rows of Object.values(G.SONG.markScenes))await G.SongStory.play(rows);
     await G.SongStory.play(G.SONG.ending.meet);
    }
   }finally{G.UI.say=say;G.UI.ask=ask;}
   return {count,missing};
  });assert.equal(result.runtime.missing.length,0,JSON.stringify(result.runtime.missing.slice(0,10)));
  async function grab(name){const missing=await p.evaluate(()=>{G.I18N.sweep(document.body);const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;while((n=w.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());if(n.nodeType===1)for(const a of ['title','placeholder','alt','aria-label'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(n.getAttribute(a));}return [...new Set(out)];});screens[name]=missing;await p.screenshot({path:path.join(OUT,name+'.png')});assert.deepEqual(missing,[],name);}
  async function finishDialogue(){for(let i=0;i<30&&await p.locator('.dlg').count();i++){await p.waitForTimeout(250);await p.keyboard.press('Escape');}assert.equal(await p.locator('.dlg').count(),0);await p.evaluate(()=>window.songPlay);}
  await p.evaluate(()=>{G.Game.state.song.rep=['6','8'];G.Info.open('song');});await p.waitForSelector('.song-map');await grab('ja-map');await p.keyboard.press('Escape');
  for(const [kind,index,name]of [['flash',2,'ja-child'],['after',2,'ja-depart']]){
   await p.evaluate(([kind,index])=>{window.songPlay=G.SongStory.play([G.SONG.prologue[kind][index]]);},[kind,index]);await p.waitForSelector('.dlg');await grab(name);await finishDialogue();
  }
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{const rows=Object.values(G.SONG.prologue).flat();const q=rows.find(r=>r&&r.ask);window.songQuestion=G.UI.ask(q.ask,q.opts.map((o,i)=>({label:o[0],value:i})),G.SongStory.who('P'));});await p.waitForSelector('.askrow button');await grab('ja-choice-small');
  const rects=await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,top:r.top,bottom:r.bottom};}));for(const r of rects)assert(r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.keyboard.press('Escape');await p.evaluate(()=>window.songQuestion);await p.setViewportSize({width:1280,height:900});
  await p.evaluate(()=>{window.songPlay=G.SongStory.play([G.SONG.ending.meet[7]]);});await p.waitForSelector('.dlg');await grab('ja-atlantis');await finishDialogue();
  await p.evaluate(()=>{window.songCut=G.SongStory.cut('atlantis');});await p.waitForSelector('.story-cut-win');await grab('ja-atlantis-cut');await p.keyboard.press('Escape');await p.evaluate(()=>window.songCut);
  await p.evaluate(()=>{G.SongStory.cut=async()=>false;G.UI.say=async()=>{};window.songEnd=G.SongStory.ending();});await p.waitForSelector('.win .foot button');await grab('ja-last-verse');await p.keyboard.press('Escape');await p.evaluate(()=>window.songEnd);
  await p.evaluate(()=>{window.songFinale=G.SongStory.apply({finale:true},{city:G.CITY_DATA[229]});});await p.waitForSelector('.win .foot button');await grab('ja-home-finale');await p.keyboard.press('Escape');await p.evaluate(()=>window.songFinale);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify({...result,screens,choiceRects:rects,errors},null,2)+'\n');console.log(JSON.stringify({...result,runtime:{count:result.runtime.count},screens:Object.keys(screens).length,errors}));
 }finally{clearTimeout(deadline);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
