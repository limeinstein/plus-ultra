/* 다듬기 전 원문으로 번역해야 하는 실제 대사·질문을 원래 대화 함수에서도 확인한다. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1100,height:800}}),errors=[];
 await p.addInitScript(()=>{localStorage.setItem('pu.lang','en');const add=document.addEventListener.bind(document);document.addEventListener=function(type,fn,...args){return add(type,type==='DOMContentLoaded'?function(e){if(window.G?.UI?.say&&!window.__rawSay){window.__rawSay=G.UI.say;window.__rawAsk=G.UI.ask;}return typeof fn==='function'?fn.call(this,e):fn.handleEvent(e);}:fn,...args);};});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(process.env.WEB_BASE?new URL('index.html',process.env.WEB_BASE).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
 const sample=await p.evaluate(()=>{
  if(!window.__rawSay||window.__rawSay===G.UI.say)throw Error('원래 대화 함수 미확인');
  G.UI.clearScreen();const text=Object.keys(G.I18N.packs.en.text).find(s=>s.length>30&&s.length<140&&!/[<>{}\f]/.test(s)&&s.includes(' — ')&&G.I18N.tr(s,true)&&!/[가-힣]/.test(G.I18N.tr(s,true))&&G.UI.tidySpeech(s).text.length>10&&G.UI.tidySpeech(s).text!==s&&!G.I18N.tr(G.UI.tidySpeech(s).text,true));
  if(!text)throw Error('원문 번역 표본 없음');window.__dialogSample=text;window.__speech=window.__rawSay(text,{});return {text,expected:G.UI.tidySpeech(G.I18N.tr(text,true)).text};
 });
 await p.waitForSelector('.modal-back.catch .body');let text=await p.locator('.modal-back.catch .body').last().textContent();assert(!/[가-힣]/.test(text)&&text.includes(sample.expected),'다듬기 전 대사 번역: '+text);
 await p.waitForTimeout(250);await p.keyboard.press('Escape');await p.evaluate(()=>window.__speech);
 await p.evaluate(()=>{window.__question=window.__rawAsk(window.__dialogSample,[{label:'확인',value:true}],{});});await p.waitForSelector('.askrow button');text=await p.locator('.modal-back .body').last().textContent();assert(!/[가-힣]/.test(text)&&text.includes(sample.expected),'다듬기 전 질문 번역: '+text);
 await p.locator('.askrow button').first().click();assert.equal(await p.evaluate(()=>window.__question),true);assert.deepEqual(errors,[]);console.log(JSON.stringify({sample:sample.text,say:true,ask:true,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
