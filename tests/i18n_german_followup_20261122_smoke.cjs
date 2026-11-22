/* 독일어 후속: 실제 튜토리얼 자료·선택 분기·설정·도시 상세·이야기 선택을 확인한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-de-followup-20261122');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={passed:false};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultNavigationTimeout(120000);
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // 독일어 후속 검사에서는 쓰지 않는 대형 언어 사전을 읽지 않는다.
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','de');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&G.Tutorial,null,{timeout:120000});
  await p.locator('#boot-loader').waitFor({state:'hidden',timeout:120000});
  report.tutorial=await p.evaluate(()=>{
   G.State.newGame({name:'Alonso de Montero',nation:'ES',job:'explorer',age:22,birth:{m:1,d:1},st:{str:60,int:65,mar:60,cha:60},sk:{survey:1},lg:[],diff:'easy'});
   G.Game.state.settings.res=.35;
   const missing=[],stats={pages:0,choices:0,branches:0};
   function text(raw,label){for(const line of G.Tutorial.fmt(raw).split('\f')){
    const tr=G.I18N.tx(line);stats.pages++;
    if(/[가-힣]|⟦|⟪|\{(?:sk|pow|name):?/.test(tr))missing.push({label,ko:line,de:tr});
   }}
   function walk(value,key){
    if(typeof value==='string'&&/[가-힣]/.test(value))text(value,key);
    else if(Array.isArray(value))value.forEach((v,i)=>walk(v,key+'.'+i));
    else if(value&&typeof value==='object'){
     if(value.ask){stats.choices++;stats.branches+=(value.opts||[]).length;}
     Object.entries(value).forEach(([k,v])=>walk(v,key+'.'+k));
    }
   }
   walk(G.TUTORIAL,'TUTORIAL');
   return {...stats,steps:G.TUTORIAL.steps.length,missing};
  });
  console.log('튜토리얼 자료 검사',report.tutorial.pages,'쪽',report.tutorial.missing.length,'누락');
  assert.deepEqual(report.tutorial.missing,[]);
  report.storyModes=await p.evaluate(()=>G.STORY_MODES.map(mode=>({id:mode.id,missing:['hero','title','sub','year','party','tag','synopsis'].filter(k=>mode[k]&&/[가-힣]/.test(G.I18N.tx(mode[k]))).map(k=>({field:k,ko:mode[k]}))})));
  assert(report.storyModes.every(m=>m.missing.length===0),JSON.stringify(report.storyModes));
  async function close(){for(let n=0;n<20&&await p.evaluate(()=>G.UI.busy());n++){await p.keyboard.press('Escape');await p.waitForTimeout(25);}}
  async function grab(name){
   await p.waitForTimeout(200);
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.querySelector('#ui'));
    const found=[],w=document.createTreeWalker(document.querySelector('#ui'),NodeFilter.SHOW_TEXT);let n;
    while((n=w.nextNode())){const el=n.parentElement;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;if(/[가-힣]/.test(n.nodeValue))found.push(n.nodeValue.trim());}
    return [...new Set(found)].filter(Boolean);
   });
   report[name]={missing};await p.screenshot({path:path.join(out,name+'.png')});
   assert.deepEqual(missing,[],name+' 화면 미번역');
  }
  await p.evaluate(()=>{G.StorySelect.open();});await p.waitForSelector('.ss-stage');
  const cards=await p.locator('.ss-card').count();
  for(let i=0;i<cards;i++){await p.locator('.ss-card').nth(i).click();await grab('story-'+i);}
  await close();
  await p.evaluate(()=>{G.Info.settings();});await p.waitForSelector('.win');await grab('settings');await close();
  await p.evaluate(async()=>{await G.Game.ensureGeo();G.Game.go('city',{cityId:7});});
  await p.waitForFunction(()=>G.Game.sceneName==='city');await close();
  await p.evaluate(()=>{G.Scenes.city.B.harbor.supply(G.CITY_DATA[7]);});await p.waitForSelector('.win');await grab('supplies');await close();
  await p.evaluate(()=>{G.UI.say(G.Tutorial.fmt(G.TUTORIAL.steps.find(s=>s.id==='roles').teach[0][1]),{name:'루카',lang:3});});
  await p.waitForSelector('.dlg');await grab('tutorial-roles');await close();
  report.epilogue=await p.evaluate(()=>G.T('<div style="font-size:19px;line-height:1.7">튜토리얼을 마쳤습니다.<br>얻은 것: 동료 <b>{mates}</b>명 · 발견 <b>{found}</b> · 명성 <b>{fame}</b> · 금화 <b>{gold}</b>닢<div class="sep"></div><b>이 항해를 이어 간다</b> — 지금 상태({city}, {date})를 그대로 본 게임으로 넘깁니다. 안내는 꺼집니다.<br><b>타이틀로 돌아간다</b> — 처음부터 「새로운 항해」로 제독을 직접 만들 수 있습니다.</div>',{mates:3,found:1,fame:450,gold:7200,city:'세빌리아',date:'1. Mai 1480'}));
  assert(!/[가-힣]|\{(?:mates|found|gold|fame|city|date)\}/.test(report.epilogue));
  assert(['3','1','450','7200','Sevilla'].every(x=>report.epilogue.includes(x)));
  assert.deepEqual(errors,[]);report.passed=true;console.log('독일어 후속 번역·실제 화면 검사 통과');
 }finally{report.errors=errors;fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
