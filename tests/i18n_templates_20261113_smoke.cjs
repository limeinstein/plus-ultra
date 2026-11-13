/* 번역 캐시 갱신·여러 줄·새 입력칸 속성·준비 중 언어와 도감 자료의 회귀 검사. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  const base=process.env.WEB_BASE||pathToFileURL(ROOT+path.sep).href;
  await p.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const report=await p.evaluate(async()=>{
   function eq(a,b,label){if(a!==b)throw Error(label+': '+JSON.stringify([a,b]));}
   const I=G.I18N;I.set('en');
   eq(I.tr('검증 항해 새말',true),null,'새 번역의 첫 실패');
   I.add('en',{text:{'검증 항해 새말':'Verified voyage','검증 다음 줄':'Next line'}});
   eq(I.tr('검증 항해 새말',true),'Verified voyage','실패 캐시 무효화');
   eq(I.tr('검증 항해 새말\n검증 다음 줄',true),'Verified voyage\nNext line','여러 줄');
   eq(I.tr('— 검증 다음 줄',true),'— Next line','줄표');
   I.add('en',{text:{'검증 항해 새말':'Updated voyage'}});
   eq(I.tr('검증 항해 새말',true),'Updated voyage','성공 캐시 무효화');
   I.set('zh-Hans');I.add('zh-Hans',{text:{'검증 항해 새말':'验证航海'},pat:[['^검증 (\\d+)세$','⟪C$1⟫世']]});
   for(const [n,t] of [[0,'〇'],[1,'一'],[10,'十'],[11,'十一'],[20,'二十'],[99,'九十九'],[100,'100']])eq(I.tr('검증 '+n+'세',true),t+'世','한자 숫자 '+n);
   eq(I.tr('검증 항해 새말',true),'验证航海','언어별 캐시');eq(I.ready('zh-Hans'),false,'준비 상태 유지');
   I.set('en');eq(I.tr('검증 항해 새말',true),'Updated voyage','영어 복귀');
   const box=document.createElement('div');box.innerHTML='<input value="검증 다음 줄" placeholder="검증 다음 줄" title="검증 항해 새말"><textarea placeholder="검증 다음 줄">검증 다음 줄</textarea><span translate="no" title="검증 다음 줄">검증 다음 줄</span>';
   document.body.append(box);I.sweep(box);
   eq(box.firstChild.placeholder,'Next line','입력칸 속성');eq(box.firstChild.value,'검증 다음 줄','입력값 보존');
   eq(box.children[1].placeholder,'Next line','큰 입력칸 속성');eq(box.children[1].value,'검증 다음 줄','큰 입력값 보존');
   eq(box.lastChild.title,'검증 다음 줄','번역 제외 속성');
   const input=document.createElement('input');input.placeholder='검증 다음 줄';box.append(input);
   await new Promise(r=>setTimeout(r,100));eq(input.placeholder,'Next line','새로 삽입한 입력칸');box.remove();
   return {cache:true,lines:true,inputAttributes:true,preservedValues:true,unready:I.LANGS.filter(l=>!I.ready(l.id)).map(l=>l.id)};
  });
  await p.goto(new URL('catalog.html?view=assets',base).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.XIYOU_FIGS&&document.querySelector('[data-tab="people"]'));
  assert.equal(await p.evaluate(()=>G.XIYOU_FIGS.length),10);
  assert.equal(await p.evaluate(()=>G.CATALOG_SCENES.filter(e=>e.key.startsWith('legend-events/xy_')).length),10);
  assert.equal(await p.evaluate(()=>['xy_misu','xy_yukino','xy_mungun','xy_naing'].filter(id=>G.MATE[id]&&G.ITEM.xy_curry_recipe).length),4);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,catalogFigures:10,catalogMates:4,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
