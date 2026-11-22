'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');process.chdir(ROOT);
const readPack=f=>{let p;vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:{G:{I18N:{add:(id,x)=>p=x}}}});return p;};
function preserve(lang){const file=process.env.CHINESE_RUNTIME_BASELINE_DIR&&path.join(process.env.CHINESE_RUNTIME_BASELINE_DIR,lang+'-runtime-before.js');if(!file||!fs.existsSync(file))return 0;const a=readPack(file),b=readPack(path.join('js/lang',lang+'.js'));let n=0;for(const field of ['text','name','city','good'])for(const[k,v]of Object.entries(a[field])){assert.equal(b[field][k],v,lang+' '+field+' '+k);n++;}const pats=new Map(b.pat);for(const[k,v]of a.pat){assert.equal(pats.get(k),v,lang+' '+k);n++;}for(const[g,rows]of Object.entries(a.person))for(const[k,v]of Object.entries(rows)){assert.equal(b.person[g]?.[k],v,lang+' '+g+' '+k);n++;}assert.equal(JSON.stringify(b.pjoin),JSON.stringify(a.pjoin));return n;}
const OUT=path.resolve('tests/_out/i18n-chinese-runtime-20261122');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const reports=[],deadline=setTimeout(()=>browser.close().catch(()=>{}),360000);try{for(const lang of ['zh-Hans','zh-Hant']){const report={lang,preserved:preserve(lang),screens:[],errors:[]};reports.push(report);
 const p=await browser.newPage({viewport:{width:1366,height:900}});p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await p.addInitScript(l=>{localStorage.setItem('pu.lang',l);window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);},lang);
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
 assert.equal(await p.evaluate(()=>G.I18N.lang),lang);
 const close=async()=>{for(let n=0;n<15&&await p.evaluate(()=>G.UI.busy());n++){await p.keyboard.press('Escape');await p.waitForTimeout(20);}};
 const grab=async name=>{await p.waitForTimeout(180);const missing=await p.evaluate(()=>{G.I18N.sweep(document.body);const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;while(n=w.nextNode()){const el=n.nodeType===3?n.parentElement:n;if(!el||el.closest('script,style,[translate=no],.no-i18n')||!el.getClientRects().length)continue;if(n.nodeType===3&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue.trim());if(n.nodeType===1)for(const a of ['title','alt','aria-label','placeholder'])if(/[가-힣]/.test(n.getAttribute(a)||''))out.push(a+': '+n.getAttribute(a));}return [...new Set(out)];});report.screens.push({name,missing});console.log(lang,name,missing.length);if(['notebook-wander','notebook-achv','notebook-items'].includes(name))await p.screenshot({path:path.join(OUT,lang+'-'+name+'.png')});};
 if(!process.env.CHINESE_RUNTIME_FIXTURES_ONLY){
 await grab('title');await p.evaluate(()=>{G.Scenes.title.help();});await grab('help');await close();await p.evaluate(()=>{G.Display.open();});await grab('display');await close();
 await p.evaluate(async()=>{G.Scenes.title.exit();G.State.newGame({name:'제시카',nation:'PT',job:'merchant',age:22,birth:{m:4,d:17},st:{str:70,int:80,mar:70,cha:80},sk:{nav:3,ops:3,trade:3},lg:G.LANGS.map(()=>3),diff:'normal'});const s=G.Game.state;s.settings.res=.35;s.player.gold=1000000;s.player.bank=5000;s.player.fame=2000;s.player.items=G.ITEMS.filter(x=>x&&x.id).slice(-50).map(x=>({id:x.id}));s.mates=G.MATES.filter(m=>m&&!m.noWander).slice(0,6).map(m=>({id:m.id,role:'none',joined:G.U.dateNum(s.date),loyal:90}));s.mates[0].role='first';await G.Game.ensureGeo();G.Game.go('city',{cityId:0});});
 await close();await grab('city');
 for(const tab of ['admiral','fleet','mates','wander','items','disc','hints','achv','contract','trade','politics','map','log']){await p.evaluate(tab=>{G.Info.open(tab);},tab);await grab('notebook-'+tab);await close();}
 await p.evaluate(()=>{G.Info.settings();});await grab('settings');await close();
 const keys=await p.evaluate(()=>Object.keys(G.Scenes.city.B));report.buildings=keys;
 for(const k of keys){if(!['trade','harbor','shipyard','market','tavern','inn','bank','church','palace','guild','school','library','yard','shop'].includes(k))continue;await p.evaluate(k=>{G.Scenes.city.visit(k);},k);await grab('building-'+k);await close();}
 for(const f of ['buy','sell','quotes']){await p.evaluate(f=>{G.Scenes.city.B.trade[f](G.CITY_DATA[0]);},f);await grab('trade-'+f);await close();}
 await p.evaluate(()=>{G.Scenes.city.B.harbor.supply(G.CITY_DATA[0]);});await grab('supplies');await close();
 await p.evaluate(()=>{G.Game.go('sea',{depart:0});});await close();await grab('sea');
 await p.evaluate(()=>{window.__melody=G.OlympianApostles.melody();});await grab('apostle-melody');await p.locator('.win button').last().click();assert.equal(await p.evaluate(()=>window.__melody),false);
 }
 await p.evaluate(async()=>{G.Scenes.title.exit();await G.Game.ensureGeo();G.UI.clearScreen();G.Loader.hide();});
 report.runtime=await p.evaluate(require('./i18n_chinese_runtime_fixtures_20261122.cjs'));
 if(!process.env.CHINESE_RUNTIME_FIXTURES_ONLY){
  const ko=report.runtime.samples.find(x=>x.scope==='crew-pets'&&x.kind==='say'&&x.ko.includes('\n')).ko;
  await p.evaluate(ko=>{G.UI.say(ko,{});return 1;},ko);await p.waitForSelector('.dialog-speech');await grab('pet-dialogue');await close();
  await p.evaluate(()=>{G.UI.ask('불경 수레를 노리는 낭인들',[{label:'낭인들과 맞서 싸운다',value:'fight'},{label:'금화 1,500닢으로 물린다',value:'pay'},{label:'미수에게 맡긴다',value:'chant'}]);return 1;});
  await p.waitForSelector('.askrow button');await grab('xiyou-choice');await p.locator('.askrow button').last().click();
 }
 console.log(lang,'실행 문구',report.runtime.samples.length,'누락',report.runtime.missing.length);fs.writeFileSync(path.join(OUT,lang+'-runtime.json'),JSON.stringify(report.runtime,null,2));
 report.api=await p.evaluate(()=>G.I18N.missingApi().map(ko=>({ko,n:G.I18N.missApi[ko]})));
await p.close();}}finally{clearTimeout(deadline);await browser.close();fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(reports,null,2));}
for(const r of reports){assert.deepEqual(r.errors,[],r.lang+' 콘솔 오류');assert.deepEqual(r.screens.filter(x=>x.missing.length),[],r.lang+' 화면 누락');assert.deepEqual(r.runtime.missing,[],r.lang+' 사건 누락');console.log(r.lang,'PASS 화면',r.screens.length,'실행 문구',r.runtime.samples.length);}})().catch(e=>{console.error(e);process.exitCode=1;});
