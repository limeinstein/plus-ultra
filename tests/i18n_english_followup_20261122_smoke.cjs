/* 두 이야기의 모든 자료·선택 분기와 실제 영어 대사·공연 화면을 확인한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-english-followup-20261122');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
 const p=await b.newPage({viewport:{width:1600,height:1000}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.addInitScript(()=>{localStorage.setItem('pu.lang','en');requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
 let game=pathToFileURL(path.join(ROOT,'index.html')).href;
 if(process.env.ENGLISH_ONLY){
  const fixture=path.join(OUT,'english-game.html');
  let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').replace('<head>','<head><base href="'+pathToFileURL(ROOT+path.sep).href+'">');
  html=html.replace(/<script\b[^>]*src="js\/lang\/(?!en(?:_names)?\.js)[^"]+"[^>]*><\/script>/g,'');
  fs.writeFileSync(fixture,html);game=pathToFileURL(fixture).href;
 }
 await p.goto(game+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>window.G&&G.Game?.sceneName==='title',null,{timeout:120000});
 console.log('두 이야기 영어 자료 대조 시작');
 const report=await p.evaluate(()=>{
  G.I18N.set('en');const missing=[],counts={};
  function walk(x,at){if(typeof x==='string'&&/[가-힣]/.test(x)){
   const t=x.replace(/\{city\}/g,'리스본').replace(/\{name\}/g,'소영').replace(/\{ship\}/g,'물마루').replace(/\{rep\}/g,'한산도 뱃노래, 테주 강 뱃사공의 노래.');
   for(const page of t.split('\f')){const translated=G.I18N.tr(page,true)||page;counts[at.split('.')[0]]=(counts[at.split('.')[0]]||0)+1;if(/[가-힣]|⟦|⟪|\{(?:city|name|ship|rep)\}/.test(translated))missing.push({at,ko:page});}
  }else if(Array.isArray(x))x.forEach((v,i)=>walk(v,at+'.'+i));else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))walk(v,at+'.'+k);}
  walk(G.JHOOK,'jhook');walk(G.SONG,'song');walk(G.STORY_MODES,'modes');
  const songs=Object.values(G.SONG.concert.regions).map(r=>r.song);
  for(const group of [[],songs.slice(0,1),songs]){
   const rep=group.length?group.join(', ')+'.':'';
   walk(G.SONG.ending.meet[27][1].replace('{rep}',rep),'repertoire');
   if(group.length)walk(' · '+group.map(n=>'「'+n+'」').join(' · ')+' · ','repertoire');
  }
  return{counts,missing};
 });
 fs.writeFileSync(path.join(OUT,'coverage.json'),JSON.stringify(report,null,2));console.log('원문 검사',report.counts,'미번역',report.missing.length);
 if(process.env.COLLECT_ONLY)return;
 assert.deepEqual(report.missing,[]);
 let old={text:{},name:{},pat:[]};if(process.env.EN_BASELINE)vm.runInNewContext(fs.readFileSync(path.resolve(ROOT,process.env.EN_BASELINE),'utf8'),{window:{G:{I18N:{add:(id,x)=>old=x}}}});
 const preserved=await p.evaluate(old=>{let n=0;const now=G.I18N.packs.en;for(const f of ['text','name'])for(const [k,v]of Object.entries(old[f])){if(now[f][G.I18N.norm(k)]!==v)throw Error('기존 번역 변경: '+k);n++;}const pats=new Map(now.pat.map(([r,v])=>[r.source,v]));for(const [r,v]of old.pat)if(pats.get(new RegExp(r).source)!==v)throw Error('기존 틀 변경: '+r);return{entries:n,patterns:old.pat.length};},old);
 await p.evaluate(()=>{G.Scenes.title.exit();const lg=G.LANGS.map(()=>3);G.State.newGame({name:'Kim Soyoung',nation:'PT',job:'explorer',age:18,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg,diff:'normal'});G.Game.state.settings.res=.35;G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();});
 const screens=[];
 async function grab(name){await p.waitForTimeout(180);await p.evaluate(()=>G.I18N.sweep(document.body));const missing=await p.evaluate(()=>{const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(/[가-힣]/.test(n.nodeValue)&&!n.parentElement.closest('script,style,[translate=no],.no-i18n')&&n.parentElement.getClientRects().length)out.push(n.nodeValue);return out;});assert.deepEqual(missing,[],name);assert.doesNotMatch(await p.locator('body').innerText(),/\d[\d,]*Ming/,name+' 인원 단위');await p.screenshot({path:path.join(OUT,name+'.png')});screens.push(name);}
 await p.evaluate(()=>{const q=G.JHOOK.beats.find(b=>b.id==='a14_after').lines.at(-1);G.UI.ask(q.ask,q.opts.map(o=>o[0]),{name:G.JHOOK.name});return 1;});await p.waitForSelector('.askrow');await grab('jhook-choice');await p.keyboard.press('Escape');
 await p.evaluate(()=>{G.SongStory.play([G.SONG.beats.find(b=>b.id==='r7_confess').lines[8]]);return 1;});await p.waitForSelector('.dlg');assert.match(await p.locator('.dialog-speech').textContent(),/I like you/);await grab('song-confession');await p.keyboard.press('Escape');
 await p.setViewportSize({width:960,height:540});await p.evaluate(()=>{G.SongStory.play([G.SONG.ending.meet[25]]);return 1;});await p.waitForSelector('.dlg');await grab('song-finale-small');await p.keyboard.press('Escape');
 await p.setViewportSize({width:1600,height:1000});
 await p.evaluate(()=>{const s=G.SongStory.start();s.song.prologue=1;s.song.flags={europeBand:true};s.song.rep=[0];s.player.lg=G.LANGS.map(()=>3);s.player.given='소영';s.mates=G.SONG.mates.map(m=>({id:m.id,role:'none',loyal:90}));s.loc.mode='city';s.loc.city=0;s.settings.music=0;G.Game.sceneName='title';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.SongStory.page(G.UI.window({title:'소영의 지도',width:1450,html:'<div class="qa-song-page"></div>'}).content.querySelector('.qa-song-page'));});
 await grab('song-map');await p.keyboard.press('Escape');
 await p.evaluate(()=>{G.FX.song=Object.assign({},G.FX.song,{sec:.2});window.qaConcert=G.SongStory.concert(G.CITY_DATA[0]);return 1;});await p.waitForSelector('.askrow');await grab('concert-song-choices');await p.locator('.askrow button').first().click();await p.waitForSelector('.song-stage .result');await grab('concert-result');await p.locator('.foot button').last().click();await p.waitForSelector('.dlg');await grab('concert-after');await p.keyboard.press('Escape');await p.evaluate(()=>window.qaConcert);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({...report,preserved,screens,errors},null,2));console.log(JSON.stringify({counts:report.counts,preserved,screens,errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
