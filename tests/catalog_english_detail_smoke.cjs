/* 영어 첫 방문·저장한 언어·한국어에서 인물 도감의 소개와 인물 이야기를 확인한다. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const results=[];try{
 for(const stored of [null,'en','ko']){
  const c=await b.newContext({locale:'en-US',viewport:{width:1100,height:800}});await c.addInitScript(v=>{if(v)localStorage.setItem('pu.lang',v);else localStorage.removeItem('pu.lang');},stored);
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const url=process.env.WEB_BASE?new URL('catalog.html?view=assets#people',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../catalog.html')).href+'?view=assets#people';
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForSelector('#tabs [data-tab]').catch(async e=>{throw Error(JSON.stringify({stored,url,errors,state:await p.evaluate(()=>({lang:window.G?.I18N?.lang,ready:document.readyState,browser:navigator.language}))})+' '+e.message);});
  // file://에서는 브라우저 기본 언어를 쓰지 않으므로 첫 방문 영어는 웹판에서 별도로 확인한다.
  if(!stored&&new URL(url).protocol==='file:'){assert.equal(await p.evaluate(()=>G.I18N.lang),'ko');await c.close();continue;}
  const state=await p.evaluate(()=>{const tr=s=>s&&G.I18N.packs.en.text[G.I18N.norm(s)];const n=G.MATES.findIndex(m=>{const bio=tr(G.BIOS[m.name]),desc=tr(m.desc);return bio&&desc&&!/[가-힣]/.test(bio+desc);});if(n<0)throw Error('영문 인물 표본 없음');const m=G.MATES[n];return {lang:G.I18N.lang,uid:'people:'+n,name:m.name,bio:tr(G.BIOS[m.name]),desc:tr(m.desc)};});
  assert.equal(state.lang,stored==='ko'?'ko':'en');await p.locator('.card[data-uid="'+state.uid+'"]').click();await p.waitForSelector('#detail[open] .d-text');await p.waitForTimeout(100);
  const text=await p.locator('#dBody .d-text').first().textContent();
  if(stored==='ko')assert(text.includes('〔인물 이야기〕')&&/[가-힣]/.test(text));
  else {assert(state.bio&&state.desc,'번역한 인물 표본');assert(text.includes('[Their story]'),'인물 이야기 제목');assert(!/[가-힣]/.test(text),'영문 인물 소개와 이야기: '+text.slice(0,160));assert(text.includes(state.bio.trim()));}
  assert.deepEqual(errors,[]);results.push({stored,lang:state.lang,errors});console.log(JSON.stringify(results.at(-1)));await c.close();
 }
 console.log(JSON.stringify(results));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
