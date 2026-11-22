/* 황금의 바다 전체 자료·선택 분기·실제 진행기 치환과 영어 화면을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-english-gold-20261122');fs.mkdirSync(OUT,{recursive:true});
let old=null;if(process.env.EN_BASELINE)vm.runInNewContext(fs.readFileSync(path.resolve(ROOT,process.env.EN_BASELINE),'utf8'),{window:{G:{I18N:{add:(id,p)=>old=p}}}});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],screens={};let corpus,played;
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','en');requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  let game=pathToFileURL(path.join(ROOT,'index.html')).href;
  if(process.env.ENGLISH_ONLY){
   const file=path.join(OUT,'english-game.html');let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').replace('<head>','<head><base href="'+pathToFileURL(ROOT+path.sep).href+'">');
   html=html.replace(/<script\b[^>]*src="js\/lang\/(?!en(?:_names)?\.js)[^"]+"[^>]*><\/script>/g,'');fs.writeFileSync(file,html);game=pathToFileURL(file).href;
  }
  await p.goto(game+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game?.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  console.log('황금의 바다 영어 자료 검사');
  corpus=await p.evaluate(old=>{
   G.I18N.set('en');const I=G.I18N,D=G.GOLD,missing=[],seen=new Set();let choices=0,branches=0,preserved=0,patterns=0,people=0;
   if(old){
    for(const field of ['text','name','city','good'])for(const[k,v]of Object.entries(old[field]||{})){if(I.packs.en[field][I.norm(k)]!==v)throw Error('기존 번역 변경: '+field+' '+k);preserved++;}
    const pats=new Map(I.packs.en.pat.map(([k,v])=>[k.source,v]));for(const[k,v]of old.pat||[]){if(pats.get(new RegExp(k).source)!==v)throw Error('기존 틀 변경: '+k);patterns++;}
    for(const[g,vs]of Object.entries(old.person||{}))for(const[k,v]of Object.entries(vs)){if(I.packs.en.person[g]?.[I.norm(k)]!==v)throw Error('기존 인명 변경: '+k);people++;}
   }
   function check(s,at){if(!/[가-힣]/.test(s)||seen.has(s))return;seen.add(s);const tr=I.tr(s,true);if(!tr||/[가-힣]|⟦|⟧|\$\d|\{(?:city|name|ship)\}/.test(tr))missing.push({at,ko:s,tr});}
   function walk(x,at){if(typeof x==='string')for(const part of x.split('\f'))for(const city of ['리스본','항주','항구'])check(part.replace(/\{city\}/g,city).replace(/\{name\}/g,'아드리안'),at);
    else if(x&&typeof x==='object'){if(x.ask){choices++;branches+=x.opts.length;}for(const[k,v]of Object.entries(x))walk(v,at+'.'+k);}}
   walk(D,'GOLD');walk(G.STORY_MODES.find(m=>m.id==='gold'),'mode');
   for(const s of [D.name,D.given,D.surname,D.ship,...D.mates.flatMap(m=>[m.name,m.short]),...Object.values(D.npcs).map(n=>n[0]),...Object.values(D.items).map(n=>n[0])])if(/[가-힣]/.test(G.N(s)))missing.push({at:'name',ko:s,tr:G.N(s)});
   for(const s of ['걸린 날: 1,234일 · 동료 8명 · 바다가 부른 이름: 길을 잇는 상인','걸린 날: 1,234일 · 동료 8명 · 바다가 부른 이름:','(1545년 6월 무렵)','16장','항구의 사람들이 부르는 이름 — 「길을 잇는 상인」','금화 1,234닢이 들어왔다.','금화 1,234닢이 사라졌다.','엘리너르 더비트가 배를 떠났다.','선단에 플류트 「반 닢」호가 더해졌다.','연합 동인도 회사에 입회했다 (야코프 포스의 추천).','연합 동인도 회사의 사원이 되었다 — 주식 12주.'])check(s,'runtime');
   return{unique:seen.size,beats:D.beats.length,choices,branches,missing,preserved:{entries:preserved,patterns,people}};
  },old);
  fs.writeFileSync(path.join(OUT,'coverage.json'),JSON.stringify(corpus,null,2));console.log('원문',corpus.unique,'누락',corpus.missing.length);
  if(process.env.COLLECT_ONLY)return;
  assert.deepEqual(corpus.missing,[]);
  await p.evaluate(()=>{G.Scenes.title.exit();G.StorySelect.open();});await p.waitForSelector('.ss-card');
  async function grab(name,selector){await p.waitForTimeout(180);await p.evaluate(()=>G.I18N.sweep(document.body));const text=await p.locator(selector).last().innerText();assert.doesNotMatch(text,/[가-힣]|⟦|⟧|\$\d|\d[\d,]*Ming/,name+': '+text);screens[name]=text;await p.screenshot({path:path.join(OUT,name+'.png')});}
  async function close(){for(let i=0;i<20&&await p.evaluate(()=>G.UI.busy());i++){await p.keyboard.press('Escape');await p.waitForTimeout(30);}}
  await grab('story-world','.ss-stage');await p.locator('.ss-card[data-story="gold"]').click();await grab('story-gold','.ss-stage');await close();
  await p.evaluate(()=>{
   const D=G.GOLD,s=G.State.newGame({name:D.name,nation:'PT',job:'merchant',age:22,birth:{m:4,d:17},st:{str:60,int:78,mar:64,cha:72},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   s.player.name=D.name;s.player.given=D.given;s.player.nation=D.nation;s.date={...D.start};s.day=1234;const c=G.CITY_DATA[D.home];s.loc={mode:'city',city:D.home,lon:c.lon,lat:c.lat};
   s.gold={act:16,prologue:1,beats:{},flags:{},titles:[],startDay:1};s.settings.res=.35;s.mates=D.mates.map(m=>({id:m.id,role:'none',loyal:88,joined:G.U.dateNum(s.date)}));
   G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();
  });
  // Use the real formatter, speaker lookup and branch traversal with only the modal rendering intercepted.
  played=await p.evaluate(async()=>{
   const say=G.UI.say,ask=G.UI.ask,result={pages:0,names:0,choices:0};let pick=0;
   function check(s){for(const part of String(s).split('\f')){if(!/[가-힣]/.test(part))continue;const tr=G.I18N.tr(part,true)||part;if(/[가-힣]|⟦|⟧|\$\d|\{(?:city|name)\}/.test(tr))throw Error('실제 진행기 미번역: '+part);result.pages++;}}
   G.UI.say=async(s,who)=>{check(s);if(who?.name){if(/[가-힣]/.test(G.N(who.name)))throw Error('화자 미번역: '+who.name);result.names++;}};
   G.UI.ask=async(s,opts,who)=>{check(s);opts.forEach(o=>check(o.label));result.choices++;return Math.min(pick,opts.length-1);};
   try{for(const city of [0,177,null])for(pick=0;pick<3;pick++){
    const s=G.Game.state;s.loc.mode=city===null?'sea':'city';if(city!==null)s.loc.city=city;
    await G.GoldSea.play(G.GOLD.prologue.pro);for(const beat of G.GOLD.beats)await G.GoldSea.play(beat.lines);
   }}finally{G.UI.say=say;G.UI.ask=ask;G.Game.state.loc.mode='city';G.Game.state.loc.city=G.GOLD.home;}
   return result;
  });console.log('실제 진행기',JSON.stringify(played));
  await p.evaluate(()=>{G.Info.open('gold');return 1;});await p.waitForSelector('.notebook-win');await grab('gold-notebook','.notebook-win');await close();
  await p.evaluate(()=>{G.GoldSea.play([G.GOLD.prologue.pro[2]]);return 1;});await p.waitForSelector('.dialog-speech');await grab('gold-dialogue','.modal-back');await close();
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{const r=G.GOLD.beats.flatMap(b=>b.lines).find(r=>r.ask&&r.opts.length===3);window.__goldChoice=G.UI.ask(r.ask,r.opts.map((o,i)=>({label:o[0],value:i})),G.GoldSea.who('P'));});
  await p.waitForSelector('.askrow button');await grab('gold-choice-small','.modal-back');
  const rects=await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));assert.equal(rects.length,3);for(const r of rects)assert(r.left>=0&&r.right<=960&&r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.locator('.askrow button').last().click();assert.equal(await p.evaluate(()=>window.__goldChoice),2);await p.setViewportSize({width:1600,height:1000});
  await p.evaluate(()=>{G.GoldSea.apply({finale:true},{});return 1;});await p.waitForSelector('.win');await grab('gold-finale-empty-titles','.win');await close();
  await p.evaluate(()=>{G.Game.state.gold.titles=Object.values(G.GOLD.beats.map(b=>b.then||{}).filter(t=>t.title).reduce((a,t)=>{a[t.title]=t.title;return a;},{}));G.GoldSea.apply({finale:true},{});return 1;});await p.waitForSelector('.win');await grab('gold-finale-titles','.win');await close();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({unique:corpus.unique,beats:corpus.beats,branches:corpus.branches,preserved:corpus.preserved,played,screens:Object.keys(screens),errors}));
 }finally{await browser.close();fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({englishOnly:!!process.env.ENGLISH_ONLY,corpus,played,screens,errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
