/* 스페인어 후속: 두 이야기 전체·분기·변수·이름·수첩·공연과 기존 번역을 확인한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-spanish-remaining-20261122');
fs.mkdirSync(OUT,{recursive:true});
const previous={};
const source=process.env.PREVIOUS_ES_FILE?fs.readFileSync(process.env.PREVIOUS_ES_FILE,'utf8'):execFileSync('git',['show','HEAD:js/lang/es.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:30*1024*1024});
vm.runInNewContext(source,{window:{G:{I18N:{add:(id,p)=>Object.assign(previous,p)}}}});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],screens={};let corpus;
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','es');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:180000});
  await p.waitForFunction(()=>window.G&&G.Game?.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:180000});
  console.log('스페인어 후속 자료 검사');
  corpus=await p.evaluate(old=>{
   const I=G.I18N;I.set('es');const missing=[],counts={song:0,gold:0};let preserved=0,choices=0,branches=0;
   for(const field of ['text','name','city','good'])for(const[k,v]of Object.entries(old[field]||{})){if(I.packs.es[field][I.norm(k)]!==v)throw Error('기존 번역 변경: '+field+' '+k);preserved++;}
   const pats=new Map(I.packs.es.pat.map(r=>[r[0].source,r[1]]));
   for(const[k,v]of old.pat||[])if(pats.get(new RegExp(k).source)!==v)throw Error('기존 틀 변경: '+k);
   for(const[group,values]of Object.entries(old.person||{}))for(const[k,v]of Object.entries(values))if(I.packs.es.person[group]?.[I.norm(k)]!==v)throw Error('기존 인명 변경: '+k);
   const check=(line,key,id)=>{if(!/[가-힣]/.test(line))return;counts[id]++;const tr=I.tr(line,true);if(tr==null||/[가-힣]|⟦|⟪|\$\d|\{(?:city|rep|ship|name)\}/.test(tr))missing.push({key,line,tr});};
   function walk(v,key,id){
    if(Array.isArray(v))return v.forEach((x,i)=>walk(x,key+'.'+i,id));
    if(v&&typeof v==='object'){if(v.ask){choices++;branches+=v.opts.length;}return Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k,id));}
    if(typeof v!=='string')return;
    for(const part of v.split('\f'))for(const city of ['리스본','항주'])for(const rep of part.includes('{rep}')?['','「서호의 연밥 따는 노래」.','「서호의 연밥 따는 노래」, 「가믈란 물결 가락」.']:[''])check(part.replace(/\{name\}/g,'소영').replace(/\{city\}/g,city).replace(/\{ship\}/g,'물마루').replace(/\{rep\}/g,rep),key,id);
   }
   walk(G.SONG,'SONG','song');walk(G.GOLD,'GOLD','gold');
   for(const id of ['SONG','GOLD']){
    const d=G[id];for(const ko of [d.name,d.given,d.surname,d.ship,...d.mates.flatMap(m=>[m.name,m.short])])if(ko&&/[가-힣]/.test(G.N(ko)))missing.push({key:id+'.name',line:ko,tr:G.N(ko)});
   }
   for(const ko of ['리스본에서 바닷길 공연을 열었다 — 관객 1,234명, 사례 2,400닢.','걸린 날: 234일 · 공연 12번 · 배운 노래 4곡','선원 12명이 갑판원이 되었다.'])check(ko,'숫자 틀','song');
   return{counts,choices,branches,missing,preserved,preservedPatterns:(old.pat||[]).length,preservedPersons:Object.values(old.person||{}).reduce((n,g)=>n+Object.keys(g).length,0)};
  },previous);
  fs.writeFileSync(path.join(OUT,'corpus.json'),JSON.stringify(corpus,null,2)+'\n');
  assert.deepEqual(corpus.missing,[],'두 이야기 자료의 스페인어 누락');
  console.log(JSON.stringify({...corpus,missing:corpus.missing.length}));
  const grab=async name=>{
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.body);const out=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;
    while((n=walk.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;
     if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());
     if(n.nodeType===1)for(const a of ['title','aria-label','alt','placeholder'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(a+': '+n.getAttribute(a));
    }return [...new Set(out)];
   });
   screens[name]=missing;await p.screenshot({path:path.join(OUT,name+'.png')});assert.deepEqual(missing,[],name+' 화면 미번역');
  };
  const close=async()=>{for(let i=0;i<20&&await p.evaluate(()=>G.UI.busy());i++){await p.keyboard.press('Escape');await p.waitForTimeout(30);}};
  await p.evaluate(()=>{G.Scenes.title.exit();G.StorySelect.open();});await p.waitForSelector('.ss-card');await grab('story-world');
  await close();
  await p.evaluate(()=>{
   G.SongStory.start();const s=G.Game.state;s.song.prologue=1;s.song.beats={};s.song.rep=['0','6'];s.settings.res=.35;
   G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();G.Info.open('song');
  });
  await p.waitForSelector('.song-map');await p.waitForTimeout(200);await grab('song-notebook');await close();
  corpus.songPlayed=await p.evaluate(async()=>{
   const say=G.UI.say,ask=G.UI.ask,s=G.Game.state,D=G.SONG,result={pages:0,names:0,choices:0};let pick=0;
   function check(text){for(const part of String(text).split('\f')){if(!/[가-힣]/.test(part))continue;const tr=G.I18N.tr(part,true)||part;if(/[가-힣]|⟦|⟧|\$\d|\{(?:city|name|ship|rep)\}/.test(tr))throw Error('실제 노래 진행기 미번역: '+part);result.pages++;}}
   G.UI.say=async(text,who)=>{check(text);if(who?.name){if(/[가-힣]/.test(G.N(who.name)))throw Error('노래 화자 미번역: '+who.name);result.names++;}};
   G.UI.ask=async(text,opts)=>{check(text);opts.forEach(o=>check(o.label));result.choices++;return Math.min(pick,opts.length-1);};
   const mates=s.mates,rep=s.song.rep;
   s.mates=[...mates,...D.mates.filter(d=>!mates.some(m=>m.id===d.id)).map(d=>({id:d.id,role:'none',loyal:88}))];
   try{for(const city of [0,177,null])for(const repertoire of [[],Object.keys(D.concert.regions)])for(pick=0;pick<2;pick++){
    s.loc.mode=city===null?'sea':'city';if(city!==null)s.loc.city=city;s.song.rep=repertoire;
    for(const lines of Object.values(D.prologue))await G.SongStory.play(lines);
    for(const beat of D.beats)await G.SongStory.play(beat.lines);
    for(const lines of Object.values(D.markScenes))await G.SongStory.play(lines);
    await G.SongStory.play(D.ending.meet);
   }}finally{G.UI.say=say;G.UI.ask=ask;s.mates=mates;s.song.rep=rep;s.loc.mode='city';s.loc.city=D.home;}
   return result;
  });
  console.log('실제 노래 진행기',JSON.stringify(corpus.songPlayed));
  await p.evaluate(()=>{G.SongStory.play([G.SONG.prologue.flash[2]]);return 1;});await p.waitForSelector('.dialog-speech');await grab('song-dialogue');await close();
  await p.evaluate(()=>{
   G.FX.song={sec:.3};const s=G.Game.state;s.settings.music=0;s.loc.city=177;s.loc.mode='city';
   s.song.beats=Object.fromEntries(G.SONG.beats.map(b=>[b.id,s.day]));
   window.__savedAsk=G.UI.ask;window.__savedSay=G.UI.say;G.UI.ask=async()=> 'learn';G.UI.say=async()=>{};
   window.__concert=G.SongStory.concert(G.CITY_DATA[177]);
  });
  await p.waitForSelector('.song-stage .result',{timeout:60000});await p.waitForTimeout(200);await grab('song-concert');
  await p.locator('.win .foot button').last().click();const concert=await p.evaluate(async()=>{const r=await window.__concert;G.UI.ask=window.__savedAsk;G.UI.say=window.__savedSay;return r;});
  assert(concert.crowd>0&&concert.gold>0&&concert.learn);
  await p.evaluate(()=>{
   window.__savedCut=G.SongStory.cut;G.SongStory.cut=async()=>{};
   window.__savedSay=G.UI.say;window.__savedAsk=G.UI.ask;G.UI.say=async()=>{};G.UI.ask=async()=>0;
   G.Game.state.song.rep=Object.keys(G.SONG.concert.regions);
   window.__songEnding=G.SongStory.ending();return 1;
  });
  await p.waitForSelector('.modal-back .content');await grab('song-ending');await close();
  await p.evaluate(async()=>{await window.__songEnding;G.SongStory.cut=window.__savedCut;G.UI.say=window.__savedSay;G.UI.ask=window.__savedAsk;G.Info.open('song');});
  await grab('song-notebook-complete');await close();
  await p.evaluate(()=>{
   const s=G.State.newGame({name:'Adriaan van der Velde',nation:'PT',job:'merchant',age:22,birth:{m:4,d:17},st:{str:60,int:78,mar:64,cha:72},sk:{},lg:[],diff:'normal'});
   s.player.name=G.GOLD.name;s.player.given=G.GOLD.given;s.player.nation='NL';s.date={y:1598,m:4,d:12};s.loc={mode:'city',city:24,lon:G.CITY_DATA[24].lon,lat:G.CITY_DATA[24].lat};
   s.gold={act:16,prologue:1,beats:{},titles:['돌아온 회계의 선장']};s.mates=G.GOLD.mates.map(d=>({id:d.id,role:'none',joined:G.U.dateNum(s.date),loyal:88}));
   G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();G.Info.open('gold');
  });
  await p.waitForTimeout(200);await grab('gold-notebook');await close();
  corpus.goldPlayed=await p.evaluate(async()=>{
   const say=G.UI.say,ask=G.UI.ask,result={pages:0,names:0,choices:0};let pick=0;
   function check(text){for(const part of String(text).split('\f')){if(!/[가-힣]/.test(part))continue;const tr=G.I18N.tr(part,true)||part;if(/[가-힣]|⟦|⟧|\$\d|\{(?:city|name)\}/.test(tr))throw Error('실제 황금 진행기 미번역: '+part);result.pages++;}}
   G.UI.say=async(text,who)=>{check(text);if(who?.name){if(/[가-힣]/.test(G.N(who.name)))throw Error('황금 화자 미번역: '+who.name);result.names++;}};
   G.UI.ask=async(text,opts)=>{check(text);opts.forEach(o=>check(o.label));result.choices++;return Math.min(pick,opts.length-1);};
   try{for(const city of [0,177,null])for(pick=0;pick<3;pick++){
    const s=G.Game.state;s.loc.mode=city===null?'sea':'city';if(city!==null)s.loc.city=city;
    await G.GoldSea.play(G.GOLD.prologue.pro);for(const beat of G.GOLD.beats)await G.GoldSea.play(beat.lines);
   }}finally{G.UI.say=say;G.UI.ask=ask;G.Game.state.loc.mode='city';G.Game.state.loc.city=G.GOLD.home;}
   return result;
  });
  console.log('실제 황금 진행기',JSON.stringify(corpus.goldPlayed));
  await p.evaluate(()=>{G.GoldSea.play([G.GOLD.prologue.pro[22]]);return 1;});await p.waitForSelector('.dialog-speech');await grab('gold-dialogue');await close();
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{
   const row=G.GOLD.beats.flatMap(b=>b.lines).find(r=>r.ask&&r.opts.length===3);
   window.__choice=G.UI.ask(row.ask,row.opts.map((o,i)=>({label:o[0],value:i})),G.GoldSea.who('P'));
  });
  await p.waitForSelector('.askrow button');await p.waitForTimeout(200);await grab('gold-choice-small');
  const rects=await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom};}));assert.equal(rects.length,3);for(const r of rects)assert(r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.locator('.askrow button').last().click();assert.equal(await p.evaluate(()=>window.__choice),2);
  await p.setViewportSize({width:1600,height:1000});
  await p.evaluate(()=>{G.GoldSea.apply({finale:true},{});return 1;});await p.waitForSelector('.modal-back .content');await grab('gold-finale');await close();
  await p.evaluate(()=>{G.Guidebook.open(0);return 1;});await p.waitForSelector('.gb-nav');
  const guidePages=await p.evaluate(()=>{
   const b=G.Guidebook.book();if(b!==G.GUIDEBOOK_I18N.es)throw Error('스페인어 가이드북 선택 실패');
   return G.Guidebook.pages(b).length;
  });
  assert.equal(guidePages,70);
  const guideMissing=[];
  for(let i=0;i<guidePages;i++){
   const text=await p.evaluate(i=>{document.querySelector('.gb-nav [data-pg="'+i+'"]').click();G.I18N.sweep(document.body);return document.querySelector('.gb').innerText;},i);
   if(/[가-힣]/.test(text))guideMissing.push({page:i,text});
   if([0,20,40,69].includes(i))await grab('guide-'+i);
  }
  assert.deepEqual(guideMissing,[],'가이드북 모든 쪽의 미번역');
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>document.querySelector('.gb-nav [data-pg="0"]').click());await p.waitForTimeout(200);await grab('guide-small');await close();
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({corpus,screens,concert,guidePages,guideMissing,errors},null,2)+'\n');
  if(fs.existsSync(path.join(OUT,'failure.json')))fs.unlinkSync(path.join(OUT,'failure.json'));
  console.log(JSON.stringify({counts:corpus.counts,choices:corpus.choices,branches:corpus.branches,screens:Object.keys(screens).length,concert,guidePages,errors}));
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.message,corpus,screens,errors},null,2)+'\n');throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
