/* 영어 이야기 선택·해적여제 도입부·수첩을 실제 파일 실행으로 검증한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/i18n-english-20261122');
fs.mkdirSync(OUT,{recursive:true});
const previous={};
if(process.env.VERIFY_PREVIOUS_EN)vm.runInNewContext(execFileSync('git',['show','HEAD:js/lang/en.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:30*1024*1024}),{window:{G:{I18N:{add:(id,pack)=>Object.assign(previous,pack)}}}});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],found={};let result;
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.setItem('pu.lang','en');window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  console.log('영어 게임 파일 열기 완료');
  result=await p.evaluate(old=>{
   const I=G.I18N;I.set('en');let preserved=0;
   for(const field of ['text','name'])for(const [key,value]of Object.entries(old[field]||{})){if(I.packs.en[field][I.norm(key)]!==value)throw Error('기존 번역 변경: '+field+' '+key);preserved++;}
   const patterns=new Map(I.packs.en.pat.map(r=>[r[0].source,r[1]]));
   for(const [pattern,value]of old.pat||[])if(patterns.get(new RegExp(pattern).source)!==value)throw Error('기존 번역 틀 변경: '+pattern);
   const lines=Object.values(G.JHOOK.prologue).flat().concat(...G.JHOOK.beats.slice(0,2).map(b=>b.lines));let pages=0;
   for(const row of lines)for(const ko of row[1].split('\f')){const en=I.tr(ko,true)||ko;if(/[가-힣]|⟦|⟪/.test(en))throw Error('도입부 미번역: '+ko);pages++;}
   for(const mode of G.STORY_MODES)for(const key of ['hero','title','sub','year','party','tag','synopsis']){const ko=mode[key];if(ko&&/[가-힣]/.test(I.tr(ko,true)||ko))throw Error('이야기 소개 미번역: '+key+' '+ko);}
   for(const d of G.JHOOK.mates){for(const ko of [d.name,d.short,d.desc])if(/[가-힣]/.test(I.tr(ko,true)||ko))throw Error('동료 미번역: '+ko);}
   for(const row of Object.values(G.JHOOK.items))for(const ko of row)if(/[가-힣]/.test(I.tr(ko,true)||ko))throw Error('물건 미번역: '+ko);
   for(const b of G.JHOOK.beats)if(b.guide&&/[가-힣]/.test(I.tr(b.guide,true)||b.guide))throw Error('진행 안내 미번역: '+b.guide);
   for(const ko of ['제시카 후크 — 「해적여제」','항해술 · 지금 3 / 본디 2단계 · 선실 수련 +1','나머지 특기 13개 — 상세에서 모두 보기','여관 일지 3 — Jessica · 1545년 6월 14일 · 런던','체력 64, 지력 66, 무력 76, 매력 78'])if(/[가-힣]|⟦|⟪/.test(I.tr(ko,true)||ko))throw Error('변수 문구 미번역: '+ko);
   return{preserved,preservedPatterns:(old.pat||[]).length,pages,dialogueLines:lines.length,storyModes:G.STORY_MODES.length,mates:G.JHOOK.mates.length,items:Object.keys(G.JHOOK.items).length,guides:G.JHOOK.beats.filter(b=>b.guide).length};
  },previous);
  const grab=async name=>{
   const missing=await p.evaluate(()=>{
    G.I18N.sweep(document.body);const out=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=walker.nextNode())){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;
     if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());
     if(n.nodeType===1)for(const a of ['title','placeholder','aria-label','alt'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(a+': '+n.getAttribute(a));
    }return [...new Set(out)];
   });
   found[name]=missing;await p.screenshot({path:path.join(OUT,name+'.png')});
   assert.deepEqual(missing,[],name+' 화면 미번역');
  };
  await p.evaluate(()=>{G.Scenes.title.exit();});await grab('title');
  await p.evaluate(()=>{G.Scenes.title.loadMenu();return 1;});await p.waitForTimeout(200);await grab('load-menu');await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.Display.open();return 1;});await p.waitForTimeout(200);await grab('display');await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.StorySelect.open();return 1;});
  await p.waitForSelector('.ss-stage');
  const storyCards=await p.locator('.ss-card').count();
  for(let i=0;i<storyCards;i++){
   await p.evaluate(i=>{document.querySelectorAll('.ss-card')[i].click();},i);
   await p.waitForTimeout(180);await grab('story-'+i);
  }
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{
   const s=G.State.newGame({name:'Jessica Hook',nation:'PT',job:'explorer',age:20,birth:{m:3,d:2},st:{str:64,int:66,mar:76,cha:78},sk:{},lg:[],diff:'normal'});
   s.player.name='제시카 후크';s.player.g='f';s.player.look='jessica';s.player.home=38;s.player.lg[3]=3;s.date={y:1545,m:6,d:14};s.jhook={act:4,prologue:1,beats:{a3_killigrew:s.day,a4_grace:s.day},titles:[]};
   s.mates=G.JHOOK.mates.map(d=>({id:d.id,role:'none',joined:G.U.dateNum(s.date),loyal:88,skg:{nav:1}}));
   G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();
   G.Info.open('jhook');
  });
  await p.waitForTimeout(200);await grab('notebook-story');await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.Info.open('mates');});await p.waitForTimeout(200);await grab('mates-list');
  await p.locator('.mb-person').first().click();await p.waitForTimeout(200);await grab('mate-detail');await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.JHook.play([G.JHOOK.prologue.a1[6]]);return 1;});
  await p.waitForSelector('.dlg');await p.waitForTimeout(200);assert.match(await p.locator('.dialog-speech').textContent(),/Piracy\?/);await grab('dialogue-roger');await p.keyboard.press('Escape');
  await p.setViewportSize({width:960,height:540});
  await p.evaluate(()=>{G.JHook.play([G.JHOOK.beats[0].lines[4]]);return 1;});
  await p.waitForSelector('.dlg');await p.waitForTimeout(200);assert.match(await p.locator('.dialog-speech').textContent(),/I know/);await grab('dialogue-killigrew-small');await p.keyboard.press('Escape');
  const ko=await p.evaluate(()=>{G.I18N.set('ko');return G.I18N.tx(G.JHOOK.prologue.a1[6][1]);});assert.match(ko,/[가-힣]/);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify({...result,found,koreanRestored:true,errors},null,2)+'\n');
  if(fs.existsSync(path.join(OUT,'failure.json')))fs.unlinkSync(path.join(OUT,'failure.json'));
  console.log(JSON.stringify({...result,screens:Object.keys(found).length,koreanRestored:true,errors}));
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.message,found,errors},null,2));throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
