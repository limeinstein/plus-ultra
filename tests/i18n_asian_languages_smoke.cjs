/* 중국어 간체·번체·베트남어: 실제 언어 선택, 설정, 새 항해, 저장한 선택과 도감. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),base=process.env.WEB_BASE||pathToFileURL(root+path.sep).href;
const cases=[['vi','vi-VN','Tiếng Việt','Chuyến hải hành mới','Sẵn sàng ra khơi'],['zh-Hans','zh-CN','简体中文','新的航海','准备出航'],['zh-Hant','zh-TW','繁體中文','新的航海','準備出航']];
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const rows=[];
 try{for(const [id,locale,label,voyage,ready] of cases){
  console.log('시작',id);const ctx=await browser.newContext({locale,viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  async function title(){await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&document.querySelector('.title-menu .btn:not(.disabled)'),null,{timeout:120000});await p.locator('#boot-loader').waitFor({state:'hidden',timeout:120000});}
  async function choose(name,lang){await p.locator('.title-lang').click();const opt=p.locator('.choices > .choice').filter({hasText:name});await opt.waitFor();assert(!(await opt.getAttribute('class')).includes('dis'));await opt.click();await p.waitForFunction(l=>G.I18N.lang===l&&document.documentElement.lang===l,lang);await title();}
  console.log('첫 화면 열기',id);await p.goto(new URL('index.html',base).href,{waitUntil:'domcontentloaded',timeout:120000});await title();console.log('첫 화면 준비',id);
  assert.equal(await p.evaluate(()=>G.I18N.lang),new URL(base).protocol==='file:'?'ko':id,'첫 방문 브라우저 언어');
  assert.deepEqual(await p.evaluate(()=>G.I18N.LANGS.filter(l=>!G.I18N.ready(l.id)).map(l=>l.id)),['ja','es']);
  if(await p.evaluate(()=>G.I18N.lang!=='ko'))await choose('한국어','ko');
  await choose(label,id);console.log('언어 선택',id);
  assert.equal(await p.evaluate(()=>localStorage.getItem('pu.lang')),id);
  assert((await p.locator('.title-menu').textContent()).includes(voyage),'번역된 새 항해 단추');
  console.log('화면 설정 열기',id);await p.evaluate(()=>{G.Display.open();});await p.waitForSelector('.disp-panel');
  assert((await p.locator('[data-dlang="'+id+'"]').getAttribute('class')).includes('on'));
  for(const lang of ['vi','zh-Hans','zh-Hant'])assert(!(await p.locator('[data-dlang="'+lang+'"]').getAttribute('class')).includes('dim'));
  for(let i=0;i<6&&await p.evaluate(()=>G.UI.busy());i++)await p.keyboard.press('Escape');
  console.log('화면 설정 닫기',id);await title();await p.locator('.title-menu .btn').filter({hasText:voyage}).click();await p.waitForSelector('.create');console.log('새 항해',id);
  await p.waitForFunction(t=>document.querySelector('#go').textContent.includes(t),ready);
  if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.screenshot({path:path.join(process.env.OUT,id+'-create.png')});}
  console.log('다시 열기',id);await p.reload({waitUntil:'domcontentloaded'});await title();assert.equal(await p.evaluate(()=>G.I18N.lang),id,'언어 선택 재접속 유지');
  const book=await p.evaluate(()=>G.GUIDEBOOK_I18N&&G.GUIDEBOOK_I18N[G.I18N.lang]?G.Guidebook.book().chapters.length:null);
  if(id.startsWith('zh-'))assert.equal(book,11);
  console.log('도감 열기',id);await p.goto(new URL('catalog.html?view=player',base).href,{waitUntil:'domcontentloaded'});await p.waitForSelector('#tabs [data-tab]');
  assert.equal(await p.evaluate(()=>G.I18N.lang),id);assert.equal(await p.locator('#tabs [data-tab]').count(),7);
  const tabs=await p.locator('#tabs [data-tab]').allTextContents();assert(tabs.every(t=>!/[가-힣]/.test(t)),'일곱 도감 탭 번역: '+tabs.join(' / '));
  await p.goto(new URL('catalog.html?view=assets#people',base).href,{waitUntil:'domcontentloaded'});await p.waitForSelector('.card[data-uid^="people:"]');
  const detail=await p.evaluate(()=>({index:G.MATES.findIndex(m=>G.BIOS[m.name]&&m.desc),heading:G.I18N.packs[G.I18N.lang].text['〔인물 이야기〕']}));
  await p.locator('.card[data-uid="people:'+detail.index+'"]').click();await p.waitForSelector('#detail[open] .d-text');
  const story=await p.locator('#dBody .d-text').first().textContent();assert(story.includes(detail.heading)&&!story.includes('[Their story]'),'현재 언어의 인물 이야기 제목');
  assert.deepEqual(errors,[]);rows.push({id,locale,browserDefault:new URL(base).protocol!=='file:',menu:true,settings:true,create:true,persisted:true,catalog:true,guideChapters:book,errors});console.log(JSON.stringify(rows.at(-1)));await ctx.close();
 }}finally{await browser.close();}
 if(process.env.OUT)fs.writeFileSync(path.join(process.env.OUT,'languages.json'),JSON.stringify(rows,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
