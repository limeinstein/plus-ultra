/* 중국어 자료 묶음 전수 검사. 원문 변수와 화자 표시는 실제 표시 단계에 맞춰 치환한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'tests/_out/i18n-chinese-registry-20261122');fs.mkdirSync(OUT,{recursive:true});
const excluded=new Set(['GUIDEBOOK','GUIDEBOOK_I18N','WORLD_DATA','IMAGE_FILES','MUSIC_FILES','SFX_FILES','SPRITE_SHEETS','SPRITE_PARTY','SONG']);
const roots=[...new Set(fs.readdirSync(path.join(ROOT,'js/data')).filter(f=>f.endsWith('.js')).flatMap(f=>[...fs.readFileSync(path.join(ROOT,'js/data',f),'utf8').matchAll(/G\.([A-Z][A-Z_0-9]+)\s*=/g)].map(m=>m[1])))].filter(k=>!excluded.has(k)).sort();
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const report=[];
try{for(const lang of ['zh-Hans','zh-Hant']){
 const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];const row={lang,errors};report.push(row);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.addInitScript(l=>{localStorage.setItem('pu.lang',l);window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);},lang);
 await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
 row.corpus=await p.evaluate(({roots,lang})=>{
  const I=G.I18N,pack=I.packs[lang],objects=new WeakSet(),seen=new Set(),missing=[],counts={};let fragments=0;
  I.set(lang);
  function format(s){let previous='제시카';const pairs={'이':'이/가','가':'이/가','을':'을/를','를':'을/를','으로':'으로/로','로':'으로/로','은':'은/는','는':'은/는','과':'과/와','와':'과/와','이라':'이라/라','이구나':'이구나/구나'};
   const particle=(value,s)=>s.includes('/')?G.U.jx(value,s):pairs[s]?G.U.jx(value,pairs[s]):s;
   return s.replace(/^[a-z](?:\[[^\]]+\])?:/,'').replace(/\{(?:sk|pow):[^{}]+\}/g,'12').replace(/\{([^{}]+)\}/g,(all,body,offset,whole)=>{
    const m=/^(\^?)([A-Za-z_][A-Za-z_0-9]*)(.*)$/.exec(body);if(!m)return particle(previous,body);
    const [,caret,k,rawSuffix]=m,suffix=rawSuffix.replace(/^[|:~]/,'');
    const value=/city|port|place|home|from|^to$|post/.test(k)?'리스본':k==='good'?'후추':/obj|gift|item/.test(k)?'아버지의 외투':k==='list'?'시장':k==='pre'?'쓰다듬어 ':/son|kid|child|^d$|baby|k1|k2/.test(k)?'아이':/^(?:n|q|qty|grant|profit|pay|days|count|gold|age|amount|price)$/.test(k)?'12':'제시카';
    if(k==='jx')return particle(previous,'이/가');const repeated=caret||whole.slice(0,offset).endsWith('{'+k+'}');previous=value;
    return(repeated?'':value)+(suffix?particle(value,suffix):'');
   });
  }
  function check(ko,key){
   if(!/[가-힣]/.test(ko)||/\.(?:webp|png|jpe?g|gif|mp3|ogg)$/.test(ko))return;
   const norm=I.norm(ko);if(seen.has(norm))return;seen.add(norm);const root=key.split('.')[0];counts[root]=(counts[root]||0)+1;
   let group;
   if(key.startsWith('REGION_FOLK.pools.'))group='R:'+key.split('.')[2];
   else if(key.startsWith('FOLK_JOIN.'))group='F';
   else if(key.startsWith('WANDER_NATIONS.')||key.startsWith('COLONY_NAMES.'))group='W:'+key.split('.')[1];
   if(group&&pack.person[group]?.[norm]){fragments++;return;}
   const sample=format(ko),tr=I.tr(sample,true)||G.N(sample);
   if(!tr||/[가-힣]|⟦|⟧|\$\d/.test(tr))missing.push({key,ko,sample,tr});
  }
  function walk(v,key){if(typeof v==='string'){for(const s of v.split('\f'))check(s,key);return;}
   if(!v||typeof v!=='object'||v.nodeType||ArrayBuffer.isView(v)||v instanceof ArrayBuffer||objects.has(v))return;
   objects.add(v);Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k));
  }
  roots.forEach(k=>walk(G[k],k));return{roots:roots.length,unique:seen.size,fragments,counts,missing};
 },{roots,lang});
 fs.writeFileSync(path.join(OUT,lang+'-corpus.json'),JSON.stringify(row.corpus,null,2)+'\n');assert.deepEqual(row.corpus.missing,[],lang+' 자료 묶음 누락');
 await p.evaluate(()=>{G.Scenes.title.exit();G.State.newGame({name:'제시카',nation:'PT',job:'explorer',age:22,birth:{m:4,d:17},st:{str:60,int:70,mar:60,cha:70},sk:{},lg:[],diff:'normal'});G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();});
 const grab=async name=>{await p.evaluate(()=>G.I18N.sweep(document.body));await p.waitForTimeout(120);const text=await p.locator('.modal-back').last().innerText();assert(!/[가-힣]|⟦|⟧/.test(text),text);await p.screenshot({path:path.join(OUT,lang+'-'+name+'.png')});};
 await p.evaluate(()=>{const t=G.MONSTER_TALES.lich;window.__monster=G.UI.ask(t.choice.q,t.choice.opts.map(o=>({label:o.label,value:o.value})),{name:t.name});return 1;});await p.waitForSelector('.askrow button');await grab('monster-choice');await p.locator('.askrow button').first().click();assert.equal(await p.evaluate(()=>window.__monster),'free');
 await p.evaluate(()=>{const lines=G.OLYMPIAN_APOSTLE_EVENTS.hera.greet;G.UI.say(lines[0][1],{name:'칼리스테'});return 1;});await p.waitForSelector('.dialog-speech');await grab('apostle-dialogue');await p.keyboard.press('Escape');
 assert.deepEqual(errors,[],lang+' 콘솔 오류');console.log(lang,JSON.stringify({roots:row.corpus.roots,checked:row.corpus.unique,fragments:row.corpus.fragments,missing:row.corpus.missing.length,errors}));await ctx.close();
}}finally{await browser.close();fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1;});
