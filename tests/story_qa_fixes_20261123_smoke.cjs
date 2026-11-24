/* 이야기 QA 1·2·5번 수정, 3·4번 현재 연도·나이 반영. 실제 해전 정산·재도전·옛 저장을 검증한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/story-qa-fixes-20261123');fs.mkdirSync(out,{recursive:true});
let count=0;function ok(v,text){assert(v,text);count++;console.log('✓ '+text);}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],cases=[];
 try{
 const p=await browser.newPage({viewport:{width:960,height:540}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.addInitScript(()=>{localStorage.setItem('pu.lang','ko');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
 await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title');
 await p.evaluate(async()=>{
  await G.Game.ensureGeo();window.SAID=[];window.WINDOWS=[];
  G.UI.say=async t=>SAID.push(String(t));G.UI.ask=async(t,opts)=>opts[0].value;G.UI.alert=async()=>{};G.UI.toast=()=>{};G.UI.fade=async f=>{if(f)f()};
  G.UI.window=o=>{WINDOWS.push(o);return{result:Promise.resolve(o.buttons?.at(-1)?.value),el:document.createElement('div'),content:document.createElement('div'),close(){}}};
  G.Scenes.discoveryCard=async()=>{};G.Names.offer=async()=>{};G.Scenes.battle.headless=true;G.SongStory.cut=async()=>{};
  window.API=mode=>({jhook:G.JHook,gold:G.GoldSea,song:G.SongStory}[mode]);window.DATA=mode=>({jhook:G.JHOOK,gold:G.GOLD,song:G.SONG}[mode]);
  const go=G.Game.go;G.Game.go=function(n,arg){if(n==='sea'||n==='city'){if(G.Game.scene===G.Scenes.battle)G.Scenes.battle.exit(n);G.Game.scene=G.Scenes.title;G.Game.sceneName='title';return;}return go.call(this,n,arg);};
  window.NEW=async mode=>{const api=API(mode);await api.start();G.Game.state[mode].prologue=1;SAID.length=0;WINDOWS.length=0;};
 });
 for(const mode of ['jhook','gold','song']){
  await p.evaluate(mode=>NEW(mode),mode);
  const base=await p.evaluate(()=>G.State.serialize());
  for(const result of ['retreat','lose','escaped-enemy']){
   const r=await p.evaluate(async({mode,base,result})=>{
    G.Game.state=G.State.deserialize(base);const s=G.Game.state,t=s[mode],D=DATA(mode),api=API(mode),target={jhook:'a5_lucia2',gold:'a10_after',song:'a4_after'}[mode],b=D.beats.find(x=>x.id===target),pre=D.beats.find(x=>x.id===b.after[0]);
    t.beats=Object.fromEntries(D.beats.filter(x=>x.id!==target).map(x=>[x.id,1]));for(const id of b.then?.join||[])s.mates=s.mates.filter(x=>x.id!==id);
    const box=pre.box;s.loc={mode:'sea',lon:(box[0]+box[1])/2,lat:(box[2]+box[3])/2};
    await api.apply({battle:pre.then.battle},{});const entered=G.Game.sceneName==='battle';await G.Scenes.battle._t().finish(result);
    const blocked=!api.done(target),reset=t.beats[pre.id]==null;
    G.StoryBattle.finish({id:'unrelated-pirate'},'win');const noOtherWin=!G.StoryBattle.won(mode,b);
    await api.atSea();const retry=G.Game.sceneName==='battle'&&G.Scenes.battle.runtime().npc.storyBattle.beat===pre.id;
    await G.Scenes.battle._t().finish('win');
    const saved=await G.State.saveAsync('journal1');G.Game.state=G.State.load('journal1');
    const winPersisted=G.StoryBattle.won(mode,b);await api.atSea();const completed=api.done(target),joined=(b.then?.join||[]).every(id=>G.Game.state.mates.some(x=>x.id===id));
    const before=JSON.stringify(G.Game.state[mode]);await api.atSea();const once=before===JSON.stringify(G.Game.state[mode]);
    return{mode,result,entered,blocked,reset,noOtherWin,retry,saved:saved.ok,winPersisted,completed,joined,once};
   },{mode,base,result});cases.push(r);
   for(const key of ['entered','blocked','reset','noOtherWin','retry','saved','winPersisted','completed','joined','once'])ok(r[key],mode+' '+result+' → '+key);
  }
  const legacy=await p.evaluate(({mode,base})=>{G.Game.state=G.State.deserialize(base);const t=G.Game.state[mode],D=DATA(mode),b=D.beats.find(x=>x.battles),pre=D.beats.find(x=>x.id===b.after[0]);t.beats={};t.beats[pre.id]=1;delete t.battlePending;delete t.battleWins;G.StoryBattle.recover(mode);return t.beats[pre.id]==null;},{mode,base});ok(legacy,mode+' 승패 없는 옛 저장은 재도전 가능');
  const resumed=await p.evaluate(async({mode,base})=>{
   G.Game.state=G.State.deserialize(base);let s=G.Game.state,t=s[mode];const D=DATA(mode),api=API(mode),b=D.beats.find(x=>x.battles),pre=D.beats.find(x=>x.id===b.after[0]);t.beats={[pre.id]:1};s.loc={mode:'sea',lon:-25,lat:25};await api.apply({battle:pre.then.battle},{});
   delete G.Scenes.battle.runtime().npc.storyBattle;delete t.battlePending;delete t.battleWins;const raw=G.State.serialize();G.Scenes.battle.exit('sea');G.Game.scene=G.Scenes.title;G.Game.sceneName='title';G.Game.state=G.State.deserialize(raw);s=G.Game.state;G.StoryBattle.recover(mode);const kept=s[mode].beats[pre.id]!=null;
   G.Game.go('battle',{battle:s.battle});await G.Scenes.battle._t().finish('win');return kept&&G.StoryBattle.won(mode,b);
  },{mode,base});ok(resumed,mode+' 옛판의 전투 도중 저장을 복원해 승리 처리');
 }
 await p.evaluate(()=>NEW('gold'));
 const goal=await p.evaluate(async()=>{
  const s=G.Game.state,t=s.gold;t.beats=Object.fromEntries(G.GOLD.beats.filter(b=>b.id!=='a16_finale').map(b=>[b.id,1]));s.date={y:1629,m:4,d:1};s.loc={mode:'city',city:24};s.player.bank=0;s.company={shares:{}};s.player.gold=0;const base=G.GoldSea.worth();s.player.gold=G.GOLD.worthGoal-base-1;
  const worth=G.GoldSea.worth(),guide=G.GoldSea.guide();await G.GoldSea.arrive(G.CITY_DATA[24],{});const blocked=!t.finale&&!G.GoldSea.done('a16_finale');s.player.gold++;SAID.length=0;await G.GoldSea.arrive(G.CITY_DATA[24],{});
  return{worth,goal:G.GOLD.worthGoal,blocked,guide,won:!!t.finale,age:G.R.age(),said:SAID.join('\n'),ending:WINDOWS.at(-1).html};
 });cases.push(goal);ok(goal.worth===goal.goal-1&&goal.blocked,'목표보다 1닢 부족하면 결말·칭호·보상 보류');ok(goal.guide.includes('3,000,000')&&goal.guide.includes('2,999,999'),'부족한 순자산을 지금 할 일에 표시');ok(goal.won,'목표와 같아지면 결말 완료');ok(goal.said.includes('1629년')&&goal.said.includes(goal.age+'세')&&!goal.said.includes('1630년'),'결말의 연도·나이를 현재 상태에 맞춤');ok(goal.ending.includes('1629년')&&!goal.ending.includes('{year}'),'끝 창도 현재 연도 표시');
 const dates=await p.evaluate(async()=>{
  const s=G.Game.state,out=[];
  for(const y of [1629,1641]){s.date={y,m:11,d:2};SAID.length=0;await G.GoldSea.play(G.GOLD.beats.find(b=>b.id==='a16_finale').lines);out.push({y,age:G.R.age(),text:SAID.join('\n')});}
  return out;
 });for(const d of dates)ok(d.text.includes(d.y+'년')&&d.text.includes(d.age+'세')&&!/\{year\}|\{age\}|\{elapsed\}/.test(d.text),'부자 결말 '+d.y+'년·'+d.age+'세');
 await p.evaluate(()=>NEW('jhook'));
 for(const [y,m]of [[1559,1],[1565,10]]){const text=await p.evaluate(async({y,m})=>{G.Game.state.date={y,m,d:1};SAID.length=0;for(const id of ['a14_battle','a15_title'])await G.JHook.play(G.JHOOK.beats.find(b=>b.id===id).lines);return SAID.join('\n');},{y,m});ok(text.split(y+'년 '+m+'월').length===3,'무적함대·재판 서술 '+y+'년 '+m+'월');}
 await p.evaluate(()=>NEW('song'));
 const song=await p.evaluate(async()=>{
  const s=G.Game.state;s.song.prologue=0;s.song.pro=0;G.FX.song=G.FX.song||{};G.FX.song.fast=true;await G.SongStory.prologue(G.CITY_DATA[229]);for(let i=0;i<6&&G.SongStory.stage();i++){await G.SongStory.enter(G.CITY_DATA[229],G.SongStory.stage().at);}if(!s.song.prologue||!s.mates.some(m=>m.id==='sy_woldam'))throw Error('여섯 도입 장면 뒤 월담이 실제 합류해야 함');await G.Disc.find(G.DISC.qufu,'land');s.disc.qufu.reported=true;s.contract=null;s.loc={mode:'city',city:229};await G.SongStory.arrive(G.CITY_DATA[229],{});SAID.length=0;await G.Disc.find(G.DISC.sy_todaiji,'land');
  const noGyeonwoo=!s.mates.some(m=>m.id==='gyeonwoo'),early=SAID.join('\n');s.mates.push({id:'gyeonwoo',role:'none'});SAID.length=0;await G.SongStory.play(G.SONG.beats.find(b=>b.id==='a2_todaiji').lines);return{noGyeonwoo,early,normal:SAID.join('\n')};
 });cases.push(song);ok(song.noGyeonwoo&&!song.early.includes('견우')&&song.early.includes('박월담이 다리를'),'미합류 경로에서는 월담이 도움');ok(song.normal.includes('견우가 다리를'),'견우 합류 경로의 원래 장면 유지');
 const langs=await p.evaluate(async()=>{
  const out=[];for(const lang of ['en','fr','es','ja','pt','de','vi','zh-Hans','zh-Hant']){G.I18N.lang=lang;G.Game.state.date={y:1565,m:10,d:1};SAID.length=0;await G.JHook.play(G.JHOOK.beats.find(b=>b.id==='a14_battle').lines);out.push({lang,text:SAID.join('\n')});}G.I18N.lang='ko';return out;
 });for(const l of langs)ok(l.text.includes('1565')&&!/\{year\}|\{month/.test(l.text)&&!/[가-힣]/.test(l.text),l.lang+' 날짜 자리표 번역 유지');
 await p.evaluate(()=>NEW('gold'));
 const translations=await p.evaluate(async()=>{
  const out=[];G.Game.state.date={y:1641,m:11,d:2};for(const lang of ['en','fr','es','zh-Hans','zh-Hant']){G.I18N.lang=lang;SAID.length=0;await G.GoldSea.play(G.GOLD.beats.find(b=>b.id==='a16_finale').lines);out.push({lang,age:G.R.age(),text:SAID[0]});}G.I18N.lang='ko';return out;
 });for(const l of translations)ok(l.text.includes('1641')&&l.text.includes(String(l.age))&&!/\{year\}|\{age\}|\{elapsed\}|[가-힣]/.test(l.text),l.lang+' 결말 연도·나이 번역 유지');
 ok(errors.length===0,'페이지·콘솔 오류 0');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({count,cases,dates,langs,errors},null,2));console.log('통과 '+count);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
