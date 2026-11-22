/* 아프리카 17세기 사건 다섯 편의 실제 분기·소식·화자·알림과 저장 일지 번역을 확인한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-spanish-africa17-20261122');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];let corpus;
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','es');requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game?.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  corpus=await p.evaluate(async()=>{
   G.I18N.set('es');window.__africaAsk=G.UI.ask;const missing=new Map(),seen=new Set(),stats={cases:0,speech:0,choices:0,labels:0,names:0,logs:0,toasts:0,news:0};let picks=[],fight='win',luck=true;
   function check(s,kind){if(!s||!/[가-힣]/.test(s))return;seen.add(s);const tr=G.I18N.tr(s,true)||s;if(/[가-힣]|⟦|⟧|\$\d/.test(tr))missing.set(s,{kind,ko:s,tr});}
   function name(s){if(!s)return;stats.names++;if(/[가-힣]/.test(G.N(s)))missing.set(s,{kind:'name',ko:s,tr:G.N(s)});}
   G.UI.say=async(t,w)=>{stats.speech++;check(t,'speech');name(w?.name);};
   G.UI.ask=async(q,opts,w)=>{stats.choices++;check(q,'ask');name(w?.name);opts.forEach(o=>{stats.labels++;check(o.label,'label');});const pick=picks.shift();return (opts.find(o=>o.value===pick&&!o.dis)||opts.at(-1)).value;};
   G.UI.toast=t=>{stats.toasts++;check(t,'toast');};G.State.log=t=>{stats.logs++;check(t,'log');};
   G.FamEv.showPic=o=>{check(o.title,'picture');return{stop:async()=>{}};};
   G.Scenes.land.landBattle=async(t,n,b,o)=>{check(t,'battle');name(o?.leader);return fight;};
   G.U.chance=()=>luck;
   const lot=q=>({q,cost:10,from:0,d:0,lots:{0:{q,cost:10}}});
   function fresh(y,city,skills={}){
    const sk=Object.fromEntries(G.SKILLS.map(x=>[x.id,0]));Object.assign(sk,skills);
    const s=G.State.newGame({name:'Mateus',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
    s.mates=[];s.date={y,m:6,d:1};s.player.gold=10000;s.player.items=[];s.fleet.cargo={herbs:lot(12)};
    const c=G.CITY_DATA[city];s.loc={mode:'city',city,lon:c.lon,lat:c.lat};s.settings.res=.35;
    fight='win';luck=true;stats.cases++;return s;
   }
   for(const gift of ['maize','tobacco',null])for(const pick of ['keep','peek']){
    const s=fresh(1630,100);s.fleet.cargo=gift?{[gift]:lot(15)}:{};picks=gift?['give',pick]:[pick];await G.Afr17.kuba();
   }
   for(const [pick,result,theo]of [['plead','win',2],['plead','win',0],['escape','win',0],['escape','lose',0],['leave','win',0]]){
    fresh(1640,110,{theo});picks=[pick];fight=result;await G.Afr17.gondar();
   }
   for(const [pick,result,survey,fortunate]of [['pay','win',0,true],['night','win',2,true],['night','win',0,true],['night','win',0,false],['night','lose',0,false],['leave','win',0,true]]){
    fresh(1655,101,{survey});picks=[pick];fight=result;luck=fortunate;await G.Afr17.cape();
   }
   for(const [pick,result]of [['pay','win'],['smuggle','win'],['smuggle','lose'],['leave','win']]){
    fresh(1666,100);picks=[pick];fight=result;await G.Afr17.mbwila();
   }
   for(const [pick,result,med]of [['escape','win',0],['escape','lose',0],['medicine','win',0],['medicine','win',2],['leave','win',0]]){
    fresh(1697,107,{med});picks=[pick];fight=result;await G.Afr17.mombasa();
   }
   const s=fresh(1680,100);s.afr17={told:{}};
   for(const row of G.Afr17.daily()){stats.news++;check(row.text,'news');}
   for(const id of G.AFR17_MATES){const d=G.MATE[id];name(d.name);name(d.short);check(d.desc,'mate');}
   for(const id of G.AFR17_FIGS){const d=G.HIST_FIG[id];name(d.name);if(d.full)name(d.full);check(d.title,'figure');}
   for(const id of ['kuba_velvet','senait_braid','buchu_pouch','kongo_rosary','liongo_utenzi']){name(G.ITEM[id].name);check(G.ITEM[id].desc,'item');}
   return{...stats,unique:seen.size,missing:[...missing.values()]};
  });
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({corpus,errors},null,2)+'\n');
  console.log(JSON.stringify({...corpus,missing:corpus.missing.length,errors}));
  assert.deepEqual(corpus.missing,[],'아프리카 17세기 사건 스페인어 누락');assert.equal(corpus.cases,27);assert.equal(corpus.news,6);assert.deepEqual(errors,[]);
  await p.evaluate(()=>{
   G.UI.ask=window.__africaAsk;G.Scenes.title.exit();G.Loader.hide();G.UI.clearScreen();
   window.__africaChoice=G.UI.ask('자흐라의 부탁',[
    {label:'필사본과 그녀를 밤바다로 빼낸다',value:'escape'},
    {label:'그녀의 안내로 요새에 약재 10통을 들여보낸다 (의학 2 — 제독)',value:'medicine'},
    {label:'떠난다',value:'leave'}],G.Legend.speaker('zahra'));
  });
  await p.waitForSelector('.askrow button');await p.waitForTimeout(150);await p.evaluate(()=>G.I18N.sweep(document.body));
  const text=await p.locator('.modal-back').last().innerText();assert.doesNotMatch(text,/[가-힣]|⟦|⟧|\$\d/);
  for(const r of await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};})))assert(r.left>=0&&r.right<=960&&r.top>=0&&r.bottom<=540,JSON.stringify(r));
  await p.screenshot({path:path.join(OUT,'mombasa-choice-small.png')});await p.locator('.askrow button').last().click();assert.equal(await p.evaluate(()=>window.__africaChoice),'leave');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({corpus,screen:{text,width:960,height:540},errors},null,2)+'\n');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
