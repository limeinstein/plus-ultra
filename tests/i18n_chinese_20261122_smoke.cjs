/* 중국어 후속 번역: 실제 이야기 자료·선택 화면·조작 안내·지도·공연과 숫자 치환. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tests/_out/i18n-chinese-20261122');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const report=[];
 try {for(const lang of ['zh-Hans','zh-Hant']){
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await ctx.addInitScript(l=>localStorage.setItem('pu.lang',l),lang);
  await p.goto(pathToFileURL(path.join(root,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const corpus=await p.evaluate(()=>{
   const I=G.I18N,missing=[],samples=[];let count=0;
   function check(line,key){if(!/[가-힣]/.test(line))return;count++;const tr=I.tr(line,true);if(tr==null||/[가-힣]|⟦|⟧|\$\d|\{(?:city|rep|ship|name)\}/.test(tr))missing.push({key,line,tr});}
   function walk(v,key){if(Array.isArray(v))return v.forEach((x,i)=>walk(x,key+'.'+i));if(v&&typeof v==='object')return Object.entries(v).forEach(([i,x])=>walk(x,key+'.'+i));if(typeof v!=='string')return;
    for(const part of v.split('\f'))for(const rep of ['', '「서호의 연밥 따는 노래」.', '「서호의 연밥 따는 노래」, 「가믈란 물결 가락」.'])check(part.replace(/\{name\}/g,'소영').replace(/\{city\}/g,'리스본').replace(/\{ship\}/g,'물마루').replace(/\{rep\}/g,rep),key);
   }
   walk(G.SONG,'song');walk(G.STORY_MODES.map(m=>({hero:m.hero,title:m.title,sub:m.sub,party:m.party,tag:m.tag,synopsis:m.synopsis,year:m.year})),'select');
   for(const n of ['1','75','1,200','9,876'])for(const s of ['계약 성립! 선금 '+n+'닢을 받았다.','이 도시에서는 '+n+'일 뒤에 다시 열 수 있다','선원 '+n+'명이 갑판원이 되었다.','리스본에서 바닷길 공연을 열었다 — 관객 '+n+'명, 사례 2,400닢.']){check(s,'number');samples.push([s,I.tr(s,true)]);}
   let rainChecks=0;
   for(const o of Object.values(G.Rain.ORDERS))for(const selected of ['', ' (지금)'])for(const fatigue of ['+1.0','-0.6','0.0']){
    const line=o.name+selected+'<br><small style="opacity:.8">'+o.desc+' (하루 피로 '+fatigue+' · 속력 ×0.92)</small>',tr=I.tr(line,true);
    if(!tr||/[가-힣]|⟦|⟧/.test(tr)||!tr.includes(fatigue)||!tr.includes('0.92'))missing.push({key:'rain',line,tr});rainChecks++;
   }
   return {count,missing,samples,rainChecks};
  });
  assert.deepEqual(corpus.missing,[],lang+' 이야기 자료 번역 누락');console.log(lang,'자료',corpus.count);
  await p.evaluate(()=>{G.StorySelect.open();});await p.waitForSelector('.ss-card');
  await p.keyboard.press('ArrowLeft');await p.waitForTimeout(800);
  await p.locator('.ss-card').filter({hasText:'金素英'}).click();await p.waitForTimeout(300);
  let text=await p.locator('.ss-stage').innerText();assert(!/[가-힣]/.test(text),lang+' 이야기 선택: '+text);
  await p.screenshot({path:path.join(out,lang+'-stories.png')});await p.locator('.ss-return').click();
  await p.evaluate(()=>{G.Scenes.title.help();});await p.waitForSelector('.help-guide');await p.waitForTimeout(200);
  text=await p.locator('.win').last().innerText();assert(!/[가-힣]/.test(text),lang+' 조작 안내: '+text);
  await p.locator('.win .x').last().click();
  await p.evaluate(()=>{G.SongStory.start();G.Game.state.song.prologue=1;G.Info.open('song');});
  await p.waitForSelector('.song-map');await p.waitForTimeout(200);
  text=await p.locator('.notebook-win').innerText();assert(!/[가-힣]/.test(text),lang+' 수첩 지도: '+text);
  await p.screenshot({path:path.join(out,lang+'-map.png')});await p.locator('.notebook-win .x').click();
  await p.evaluate(()=>{
   G.FX.song={sec:0.5};const s=G.Game.state;s.settings.music=0;s.loc.city=177;s.loc.mode='city';
   // 공연 선택·공연 뒤 한마디는 자료 검사에서 확인하고, 실제 공연창을 끝까지 연다.
   G.UI.ask=async()=> 'learn';G.UI.say=async()=>{};window.__concert=G.SongStory.concert(G.CITY_DATA[177]);
  });
  await p.waitForSelector('.song-stage .result',{timeout:30000});await p.waitForTimeout(250);
  text=await p.locator('.song-stage').innerText();assert(!/[가-힣]/.test(text),lang+' 공연 결과: '+text);
  await p.screenshot({path:path.join(out,lang+'-concert.png')});await p.locator('.win .foot button').last().click();
  const concert=await p.evaluate(()=>window.__concert);assert(concert.crowd>0&&concert.gold>0&&concert.learn);
  assert.deepEqual(errors,[],lang+' 콘솔 오류');report.push({lang,corpus,storySelect:true,help:true,map:true,concert,errors});await ctx.close();
 }} finally {await browser.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report.map(({corpus,...r})=>({...r,checked:corpus.count}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
