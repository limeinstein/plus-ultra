/* 일본어 후속: 네 주인공 소개·이야기 수첩·지도·실제 공연 결과와 변수 치환. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-ja-stories-20261122');
const ko=/[가-힣]/;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900},locale:'ja-JP'});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','ja');localStorage.setItem('pu_song_preview','1');});
  await p.goto(pathToFileURL(path.join(root,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  console.log('일본어 이야기 선택·변수 치환');
  const select=await p.evaluate(()=>G.STORY_MODES.map(m=>Object.fromEntries(['hero','title','sub','party','tag','synopsis','year'].filter(k=>m[k]).map(k=>[k,G.I18N.tx(m[k])]))));
  assert(!ko.test(JSON.stringify(select)),JSON.stringify(select));report.select=select;
  const rows=['runtime_20261122','story_jhook_ui_20261122','story_song_ui_20261122'].flatMap(f=>fs.readFileSync(path.join(root,'tools/i18n/en',f+'.tsv'),'utf8').split(/\r?\n/).filter(l=>l.includes('\t')&&!l.startsWith('#\t')).map(l=>l.split('\t')[0]));
  report.templates=await p.evaluate(rows=>{
   const missing=[];let checked=0;
   for(const row of rows){
    if(row.startsWith('/')&&row.endsWith('/'))continue;
    for(const n of ['1','75','1,200','9,876']){
     const values={city:'리스본',crowd:n,gold:n,fame:n,fatigue:n,discipline:n,shows:n,cities:n};
     const line=row.replace(/\(이\|가\)/g,'이').replace(/#/g,n).replace(/@/g,'제시카 후크');
     const tr=/\{[a-z]/.test(line)?G.T(line,values):G.I18N.tx(line);checked++;
     if(/[가-힣]|⟦|⟧|\$\d|\{(?:city|crowd|gold|fame|fatigue|discipline|shows|cities)\}/.test(tr))missing.push({line,tr});
    }
   }return {checked,missing};
  },rows);
  assert.equal(report.templates.missing.length,0,JSON.stringify(report.templates.missing.slice(0,10)));
  for(const id of ['photo','jhook','gold','song']){
   await p.evaluate(()=>{G.StorySelect.open();});await p.waitForSelector('.ss-card');
   await p.locator('.ss-card[data-story="'+id+'"]').click();
   await p.waitForTimeout(150);
   const text=await p.locator('.ss-stage').innerText();assert(!ko.test(text),id+': '+text);
   await p.screenshot({path:path.join(out,'ja-select-'+id+'.png')});
   await p.locator('.ss-return').click();
  }
  console.log('일본어 지도·공연 결과');
  await p.evaluate(()=>{G.SongStory.start();G.Game.state.song.prologue=1;G.Info.open('song');});
  await p.waitForSelector('.song-map');await p.waitForTimeout(150);
  let text=await p.locator('.notebook-win').innerText();assert(!ko.test(text),'수첩 지도: '+text);
  await p.screenshot({path:path.join(out,'ja-song-map.png')});await p.locator('.notebook-win .x').click();
  await p.evaluate(()=>{
   G.FX.song={sec:0.5};const s=G.Game.state;s.settings.music=0;s.loc.city=177;s.loc.mode='city';
   G.UI.ask=async()=> 'learn';G.UI.say=async()=>{};window.__concert=G.SongStory.concert(G.CITY_DATA[177]);
  });
  await p.waitForSelector('.song-stage .result',{timeout:30000});await p.waitForTimeout(150);
  text=await p.locator('.song-stage').innerText();assert(!ko.test(text),'공연 결과: '+text);
  await p.screenshot({path:path.join(out,'ja-concert.png')});await p.locator('.win .foot button').last().click();
  report.concert=await p.evaluate(()=>window.__concert);assert(report.concert.crowd>0&&report.concert.gold>0&&report.concert.learn);
  await p.evaluate(async()=>{await G.JHook.start();G.Game.state.jhook.prologue=1;G.Info.open('jhook');});
  await p.waitForSelector('.notebook-win');await p.waitForTimeout(150);
  text=await p.locator('.notebook-win').innerText();assert(!ko.test(text),'해적여제 수첩: '+text);
  await p.screenshot({path:path.join(out,'ja-jhook-notebook.png')});
  assert.deepEqual(errors,[]);report.errors=errors;report.screens=true;
  console.log(JSON.stringify({checked:report.templates.checked,errors,concert:report.concert}));
 }finally{await browser.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
