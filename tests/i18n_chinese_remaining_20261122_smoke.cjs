/* 중국어 후속: 후크·황금 이야기와 새 도감 자료, 선택·수첩·대화·분기를 실제 파일 실행으로 확인한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'tests/_out/i18n-chinese-remaining-20261122');
fs.mkdirSync(OUT,{recursive:true});
const readPack=f=>{let out;vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:{G:{I18N:{add:(id,p)=>out=p}}}});return out;};
const baseline={};for(const lang of ['zh-Hans','zh-Hant']){
 const f=process.env.CHINESE_BASELINE_DIR&&path.join(process.env.CHINESE_BASELINE_DIR,lang+'-followup-before.js');
 if(f&&fs.existsSync(f))baseline[lang]=readPack(f);
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const report=[];
 try{for(const lang of ['zh-Hans','zh-Hant']){
  const ctx=await browser.newContext({viewport:{width:1366,height:900}}),p=await ctx.newPage(),errors=[],screens={};
  const row={lang,errors,screens};report.push(row);
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(l=>{localStorage.setItem('pu.lang',l);window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);},lang);
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href+'?song=1',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  row.corpus=await p.evaluate(({lang,old})=>{
   const I=G.I18N,missing=[],counts={},seen=new Set(),objects=new WeakSet();let choices=0,branches=0,preserved=0;
   I.set(lang);
   if(old){
    for(const field of ['text','name','city','good'])for(const[k,v]of Object.entries(old[field]||{})){if(I.packs[lang][field][I.norm(k)]!==v)throw Error('기존 번역 변경: '+field+' '+k);preserved++;}
    const pats=new Map(I.packs[lang].pat.map(r=>[r[0].source,r[1]]));
    for(const[k,v]of old.pat||[])if(pats.get(new RegExp(k).source)!==v)throw Error('기존 틀 변경: '+k);
    for(const[g,vs]of Object.entries(old.person||{}))for(const[k,v]of Object.entries(vs))if(I.packs[lang].person[g]?.[I.norm(k)]!==v)throw Error('기존 인명 변경: '+k);
   }
   function check(s,key){if(!/[가-힣]/.test(s))return;const id=key.split('.')[0];counts[id]=(counts[id]||0)+1;const tr=I.tr(s,true);if(!tr||/[가-힣]|⟦|⟧|\$\d|\{(?:city|name)\}/.test(tr))missing.push({key,ko:s,tr});}
   function walk(v,key){
    if(typeof v==='string'){
     if(key.startsWith('REGION_FOLK.pools.')||key.startsWith('FOLK_JOIN.')){
      const group=key.startsWith('REGION_FOLK')?'R:'+key.split('.')[2]:'F';
      const tr=I.packs[lang].person[group]?.[I.norm(v)]||I.tr(v,true)||G.N(v);if(/[가-힣]/.test(v)&&(!tr||/[가-힣]/.test(tr)))missing.push({key,ko:v,tr});return;
     }
     for(const part of v.split('\f')){if(!/[가-힣]/.test(part))continue;
      const variants=key.startsWith('JHOOK')||key.startsWith('GOLD')?['리스본','항주']:['리스본'];
      for(const city of variants){const s=part.replace(/\{city\}/g,city).replace(/\{name\}/g,key.startsWith('GOLD')?'아드리안':'제시카');if(seen.has(s))continue;seen.add(s);check(s,key);}
     }return;
    }
    if(!v||typeof v!=='object'||objects.has(v)||ArrayBuffer.isView(v))return;
    objects.add(v);if(v.ask){choices++;branches+=(v.opts||[]).length;}
    Object.entries(v).forEach(([k,x])=>walk(x,key+'.'+k));
   }
   for(const key of ['JHOOK','GOLD','DISCOVERIES','ITEMS','MATES','GOODS','CITY_DATA','ACHIEVEMENTS','SPONSORS','DISC_FACTS','DISC_FAM','REGION_FOLK','FOLK_JOIN'])walk(G[key],key);
   for(const k of ['JHOOK','GOLD'])for(const ko of [G[k].name,G[k].given,G[k].surname,G[k].ship,...G[k].mates.flatMap(m=>[m.name,m.short])].filter(Boolean))if(/[가-힣]/.test(G.N(ko)))missing.push({key:k+'.name',ko,tr:G.N(ko)});
   for(const s of ['걸린 날: 1,234일 · 동료 8명 · 바다가 부른 이름: 해적여제','걸린 날: 1,234일 · 동료 8명 · 바다가 부른 이름:','(1545년 6월 무렵)','16장','12막',
    '킬리그루가 카라벨 「되새」호를 빌려주었다.','바다의 사람들이 부르는 이름 — 「해적여제」','항구의 사람들이 부르는 이름 — 「길을 잇는 상인」',
    '금화 1,234닢이 들어왔다.','금화 1,234닢이 사라졌다.','엘리너르 더비트가 배를 떠났다.','선단에 플류트 「반 닢」호가 더해졌다.',
    '연합 동인도 회사에 입회했다 (야코프 포스의 추천).','연합 동인도 회사의 사원이 되었다 — 주식 12주.'])check(s,'RUNTIME');
   return{counts,unique:seen.size,choices,branches,missing,preserved};
  },{lang,old:baseline[lang]||null});
  fs.writeFileSync(path.join(OUT,lang+'-corpus.json'),JSON.stringify(row.corpus,null,2)+'\n');
  assert.deepEqual(row.corpus.missing,[],lang+' 실제 자료 누락');console.log(lang,'자료',row.corpus.unique,'분기',row.corpus.branches);
  const grab=async(name,selector='.win')=>{
   await p.evaluate(()=>G.I18N.sweep(document.body));await p.waitForTimeout(150);
   const text=await p.locator(selector).last().innerText();screens[name]=text;
   await p.screenshot({path:path.join(OUT,lang+'-'+name+'.png')});assert(!/[가-힣]|⟦|⟧/.test(text),lang+' '+name+': '+text);
  };
  const close=async()=>{for(let i=0;i<20&&await p.evaluate(()=>G.UI.busy());i++){await p.keyboard.press('Escape');await p.waitForTimeout(30);}};
  await p.evaluate(()=>{G.Scenes.title.exit();G.StorySelect.open();});await p.waitForSelector('.ss-card');
  await grab('story-world','.ss-stage');
  for(const id of ['jhook','gold']){await p.locator('.ss-card[data-story="'+id+'"]').click();await grab('story-'+id,'.ss-stage');await p.locator('.ss-back').click();}
  await close();
  for(const id of ['jhook','gold']){
   await p.evaluate(id=>{
    const D=G[id==='jhook'?'JHOOK':'GOLD'],s=G.State.newGame({name:D.name,nation:'PT',job:'merchant',age:22,birth:{m:4,d:17},st:{str:60,int:78,mar:64,cha:72},sk:{},lg:[],diff:'normal'});
    s.player.name=D.name;s.player.given=D.given;s.player.nation=D.nation;s.date={...D.start};s.day=1234;
    const c=G.CITY_DATA[D.home];s.loc={mode:'city',city:D.home,lon:c.lon,lat:c.lat};
    s[id]={act:16,prologue:1,beats:{},flags:{},titles:[],startDay:1};s.settings.res=.35;
    s.mates=D.mates.map(m=>({id:m.id,role:'none',loyal:88,joined:G.U.dateNum(s.date)}));
    G.Game.sceneName='city';G.Game.showLayers(false,false,true);G.UI.clearScreen();G.UI.hud.hide();G.Loader.hide();G.Info.open(id);
   },id);
   await p.waitForSelector('.notebook-win');await grab(id+'-notebook','.notebook-win');await close();
   await p.evaluate(id=>{const D=G[id==='jhook'?'JHOOK':'GOLD'],sys=G[id==='jhook'?'JHook':'GoldSea'];sys.play([D.prologue.pro[2]]);return 1;},id);
   await p.waitForSelector('.dialog-speech');await grab(id+'-dialogue','.modal-back');await close();
   if(id==='gold'){
   await p.setViewportSize({width:960,height:540});
   await p.evaluate(id=>{const D=G[id==='jhook'?'JHOOK':'GOLD'],sys=G[id==='jhook'?'JHook':'GoldSea'],r=D.beats.flatMap(b=>b.lines||[]).find(r=>r&&r.ask&&r.opts.length===3);window.__choice=G.UI.ask(r.ask,r.opts.map((o,i)=>({label:o[0],value:i})),sys.who('P'));},id);
   await p.waitForSelector('.askrow button');await grab(id+'-choice-small','.modal-back');
   const rects=await p.locator('.askrow button').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom};}));assert.equal(rects.length,3);for(const r of rects)assert(r.top>=0&&r.bottom<=540,JSON.stringify(r));
   await p.locator('.askrow button').last().click();assert.equal(await p.evaluate(()=>window.__choice),2);await p.setViewportSize({width:1366,height:900});
   }
   await p.evaluate(id=>{G[id==='jhook'?'JHook':'GoldSea'].apply({finale:true},{});return 1;},id);await p.waitForSelector('.win');await grab(id+'-finale');await close();
  }
  assert.deepEqual(errors,[],lang+' 콘솔 오류');await ctx.close();
 }}finally{await browser.close();fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify(report.map(r=>({lang:r.lang,counts:r.corpus.counts,choices:r.corpus.choices,branches:r.corpus.branches,screens:Object.keys(r.screens).length,errors:r.errors}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
