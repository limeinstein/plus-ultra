/* 일본어 후속 번역: 실제 튜토리얼 전체 문구·치환 값, 가이드북 11장 70쪽을 검사한다. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/i18n-ja-followup-20261122');
function corpus(){
 const ctx=vm.createContext({document:{body:null,readyState:'loading',documentElement:{dataset:{}},querySelector(){return null;},addEventListener(){}},navigator:{languages:['ko-KR']},location:{protocol:'file:'},localStorage:{getItem(){return null;},setItem(){}},addEventListener(){},console});
 vm.runInContext('window=globalThis;G={Game:{state:{player:{name:"アルベルト",sk:{survey:1,sail:2}}}}}',ctx);
 for(const f of ['js/core/util.js','js/data/base.js','js/data/cities.js','js/core/i18n.js','js/lang/ja.js','js/data/tutorial.js','js/systems/tutorial.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 ctx.G.I18N.lang='ja';
 const strings=new Set();
 function walk(x){if(typeof x==='string'&&/[가-힣]/.test(x))strings.add(x);else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')Object.values(x).forEach(walk);}
 walk(ctx.G.TUTORIAL.steps);
 const rows=[...strings].map(ko=>{const formatted=ctx.G.Tutorial.fmt(ko);return {ko,formatted,ja:formatted.split('\f').map(s=>ctx.G.I18N.tx(s)).join('\f')};});
 const missing=rows.filter(r=>/[가-힣]|\{(?:sk|pow):/.test(r.ja));
 const result={steps:ctx.G.TUTORIAL.steps.length,rows,missing};
 fs.writeFileSync(path.join(out,'tutorial-runtime.json'),JSON.stringify(result,null,2));
 assert.deepEqual(missing,[],'실제 튜토리얼 자료의 미번역');
 const names=new Set();
 for(const f of ['names_disc1.tsv','names_disc2.tsv','names_disc3.tsv'])for(const line of fs.readFileSync(path.join(root,'tools/i18n/en',f),'utf8').split(/\r?\n/))if(line.includes('\t')&&!line.startsWith('#\t'))names.add(line.split('\t')[0]);
 assert.deepEqual([...names].filter(ko=>/[가-힣]/.test(ctx.G.N(ko))),[],'발견물 이름의 미번역');
 result.discoveryNames=names.size;return result;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const tutorial=corpus();
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({locale:'ja-JP',viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('pu.lang','ja'));
  // 실제 UI·가이드 모듈을 직접 연다. 전체 게임 검사는 i18n_ja_smoke.cjs가 맡는다.
  const scripts=['js/core/util.js','js/data/base.js','js/core/i18n.js','js/lang/ja.js','js/data/guidebook.js','js/ui/icons.js','js/ui/ui.js','js/ui/guidebook.js'];
  const images=Object.fromEntries(fs.readdirSync(path.join(root,'images/guide')).filter(n=>/\.(webp|jpg|png)$/.test(n)).map(n=>['guide/'+n.replace(/\.[^.]+$/,''),pathToFileURL(path.join(root,'images/guide',n)).href]));
  const fixture=path.join(out,'ja-guide-runtime.html');
  fs.writeFileSync(fixture,'<!doctype html><html><head><meta charset="utf-8"><base href="'+pathToFileURL(root+path.sep).href+'"><link rel="stylesheet" href="css/style.css"></head><body><div id="ui"></div>'+scripts.map(s=>'<script src="'+s+'"></script>').join('')+'<script>G.Game={state:{settings:{}}};G.UI.init();var guideImages='+JSON.stringify(images)+';G.Img={has:function(k){return !!guideImages[k];},resolve:function(ks){return Promise.resolve({img:{src:guideImages[ks[0]]}});}};</script></body></html>');
  console.log('일본어 가이드북 화면 열기');
  await page.goto(pathToFileURL(fixture).href,{waitUntil:'domcontentloaded',timeout:60000});
  const book=await page.evaluate(()=>({chapters:G.Guidebook.book().chapters.length,pages:G.Guidebook.pages().length,imageKeys:G.Guidebook.book().chapters.flatMap(c=>[...c.html.matchAll(/data-gk="([^"]+)"/g)].map(m=>m[1]))}));
  assert.equal(book.chapters,11);assert.equal(book.pages,70);assert.equal(new Set(book.imageKeys).size,38);
  await page.evaluate(()=>{G.Guidebook.open(0);});await page.waitForSelector('.gb-win');
  const pages=[];
  for(let i=0;i<book.pages;i++){
   const text=await page.evaluate(i=>{G.Guidebook._show(i);const el=document.querySelector('.gb-win');G.I18N.sweep(el);return el.innerText;},i);
   pages.push({page:i+1,hangul:(text.match(/[^\n]*[가-힣][^\n]*/g)||[])});
   if([0,31,69].includes(i))await page.screenshot({path:path.join(out,'ja-guide-'+String(i+1).padStart(2,'0')+'.png')});
  }
  fs.writeFileSync(path.join(out,'guide-pages.json'),JSON.stringify(pages,null,2));
  assert(pages.every(p=>!p.hangul.length),JSON.stringify(pages.filter(p=>p.hangul.length)));
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({tutorialSteps:tutorial.steps,tutorialStrings:tutorial.rows.length,discoveryNames:tutorial.discoveryNames,guidebook:book,errors},null,2)+'\n');
  console.log('일본어 튜토리얼 '+tutorial.rows.length+'문구 · 가이드북 11장 70쪽·그림 38장 연결 · 한국어 잔류·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
