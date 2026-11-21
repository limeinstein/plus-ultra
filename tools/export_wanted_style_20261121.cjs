/* 실제 게임의 수배서 틀로 전 명부를 출력하고, 1~5장 배치·현재 현상금·토벌 도장을 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{pathToFileURL}=require('url');
const {chromium}=require('./procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/wanted-style-20261121');
fs.mkdirSync(path.join(OUT,'posters'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.addInitScript(()=>{window.requestAnimationFrame=cb=>cb.name==='loop'?0:setTimeout(()=>cb(performance.now()),16);});
  await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Wanted&&G.State,null,{timeout:90000});
  const roster=await page.evaluate(async()=>{
   await G.Game.ensureGeo();
   G.State.newGame({name:'수배서 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   const s=G.Game.state;s.flags.prologue=true;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.date={y:1600,m:5,d:1};
   const c=G.CITY_DATA.find(c=>c.name==='리스본');window.wantedCity=c;s.loc={mode:'city',city:c.id,lon:c.lon,lat:c.lat};
   G.Game.sceneName='city';G.UI.clearScreen();G.UI.hud.hide();G.Game.showLayers(false,false,true);if(G.Loader)G.Loader.hide();document.querySelector('#boot-loader')?.remove();
   const bg=await G.Img.resolve(['interiors/tavern_europe']);if(bg)G.Game.setScene(bg.img);
   const list=G.Captains.pirates();
   const results=await Promise.all(list.map(p=>G.Img.resolve(['wanted/'+p.id])));
   await Promise.all(['ui/wanted/parchment','ui/wanted/board'].map(k=>G.Img.resolve([k])));
   await document.fonts.load('900 24px "Noto Serif KR Wanted"','현상수배');await document.fonts.ready;
   return {n:list.length,raw:G.SEA_PIRATES.length,chiefs:G.PIRATE_LAIRS.reduce((n,d)=>n+d.chiefs.length,0),missing:list.filter((p,i)=>!results[i]).map(p=>p.id),assets:['ui/wanted/parchment','ui/wanted/board'].map(k=>!!G.Img.get(k)),people:list.map(p=>({id:p.id,name:p.name,gender:p.g,zones:p.zones,band:G.Wanted.band(p)?.name||'',bounty:G.Wanted.bounty(p),file:'posters/'+p.id+'.png'}))};
  });
  assert.strictEqual(roster.n,156);assert.strictEqual(roster.raw,156);assert.strictEqual(roster.chiefs,14);
  assert.strictEqual(new Set(roster.people.map(p=>p.id)).size,roster.n);assert.deepStrictEqual(roster.missing,[]);assert(roster.assets.every(Boolean));
  checks.push('156명 전원의 고유 초상·이름·해적단·현상금과 새 원화 로딩');
  console.log(JSON.stringify({roster:roster.n,chiefs:roster.chiefs,missing:roster.missing}));
  const layouts=[];
  for(const size of [[1600,900],[960,640],[390,844]]){
   await page.setViewportSize({width:size[0],height:size[1]});
   for(let n=1;n<=5;n++){
    await page.evaluate(n=>{const original=G.Wanted.posters;G.Wanted.posters=()=>G.Captains.pirates().slice(0,n);window.wantedBoardPromise=G.Wanted.board(wantedCity);G.Wanted.posters=original;},n);
    await page.waitForFunction(()=>!document.querySelector('.wp-board .img-wait'));
    await page.waitForTimeout(100);
    const layout=await page.evaluate(()=>{
     const content=document.querySelector('.wp-board-content'),grid=content.querySelector('.wp-grid'),cr=content.getBoundingClientRect();
     const cards=[...grid.querySelectorAll('.wp-card')].map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,visible:r.left>=cr.left-1&&r.right<=cr.right+1&&r.top>=cr.top-1&&r.bottom<=cr.bottom+1};});
     return{count:cards.length,cards,paperLayers:[...grid.querySelectorAll('.wp-sheet')].map(s=>s.querySelectorAll('.wp-art canvas').length),scrollWidth:content.scrollWidth,width:content.clientWidth,scrollHeight:content.scrollHeight,height:content.clientHeight};
    });
    assert.strictEqual(layout.count,n);assert(layout.paperLayers.every(v=>v===1),'수배서마다 종이 틀이 한 장씩 있어야 한다');assert(layout.scrollWidth<=layout.width+2,'게시판 가로 넘침 '+JSON.stringify({size,n,layout}));
    if(size[0]>=960)assert(layout.cards.every(c=>c.visible),'모든 전단지를 창 안에 표시 '+JSON.stringify({size,n,layout}));
    layouts.push({size,n,...layout});
    if(n===5)await page.screenshot({path:path.join(OUT,'board-'+size.join('x')+'.png')});
    if(n===5&&size[0]===1600){await page.locator('.wp-card').first().click();await page.waitForSelector('.wp-big');assert.strictEqual(await page.locator('.wp-big .wp-name').textContent(),roster.people[0].name);checks.push('게시판 전단지를 누르면 해당 해적 상세 수배서가 열린다');}
    await page.locator('.win .title .x').last().click();
   }
  }
  checks.push('화면 3종의 1~5장 가변 배치·가로 넘침·데스크톱 전체 표시');
  await page.setViewportSize({width:1600,height:900});
  await page.evaluate(()=>{window.wantedDetailPromise=G.Wanted.detail(wantedCity,G.Wanted.pirate('pr_kemal'));});
  await page.waitForFunction(()=>!document.querySelector('.wp-detail-sheet .img-wait'));
  await page.screenshot({path:path.join(OUT,'detail-kemal.png')});
  await page.locator('.win .title .x').last().click();
  const changing=await page.evaluate(()=>{
   const p=G.Captains.pirates().find(p=>!p.hist&&p.zones.length===1),w=G.Wanted.st(),before=G.Wanted.bounty(p);
   w.abs[p.id]=[G.Captains.pirates().find(q=>q.id!==p.id).id];const after=G.Wanted.bounty(p),sheet=G.Wanted.paper(p);
   w.due[p.id]=after;const defeated=G.Wanted.paper(p).querySelector('.wp-stamp')?.textContent;
   delete w.abs[p.id];delete w.due[p.id];
   return{before,after,amount:sheet.querySelector('.wp-amount').textContent,defeated};
  });
  assert(changing.after>changing.before);assert.strictEqual(Number(changing.amount.replaceAll(',','')),changing.after);assert.strictEqual(changing.defeated,'무찌름');
  checks.push('잔당 흡수 뒤 현상금 갱신·토벌 도장');
  await page.setViewportSize({width:512,height:768});
  await page.addStyleTag({content:'html:has(body.wanted-export-mode),body.wanted-export-mode{background:transparent!important;background-image:none!important}body.wanted-export-mode>:not(#wanted-export-stage){visibility:hidden!important}#wanted-export-stage{position:fixed;left:0;top:0;width:512px;height:768px;z-index:999999;visibility:visible;background:transparent}#wanted-export-stage .wp-sheet{width:512px;height:768px}'});
  await page.evaluate(()=>{document.body.classList.add('wanted-export-mode');const host=document.createElement('div');host.id='wanted-export-stage';document.body.appendChild(host);});
  for(const [i,p]of roster.people.entries()){
   await page.evaluate(id=>{const host=document.getElementById('wanted-export-stage');host.replaceChildren(G.Wanted.paper(G.Wanted.pirate(id),'export'));},p.id);
   await page.waitForFunction(()=>!document.querySelector('#wanted-export-stage .img-wait'));
   const text=await page.evaluate(()=>{const s=document.querySelector('#wanted-export-stage .wp-sheet'),n=s.querySelector('.wp-name'),b=s.querySelector('.wp-band'),h=s.querySelector('.wp-english');return{id:s.dataset.pirate,name:n.textContent,nameFits:n.scrollWidth<=n.clientWidth+1,bandFits:b.scrollWidth<=b.clientWidth+1,headingFits:h.scrollWidth<=h.clientWidth+1,paperLayers:s.querySelectorAll('.wp-art canvas').length,portrait:s.querySelector('.wp-face canvas').dataset.img,amount:s.querySelector('.wp-amount').textContent};});
   assert.strictEqual(text.id,p.id);assert.strictEqual(text.name,p.name);assert(text.nameFits&&text.bandFits&&text.headingFits,'제목·긴 이름 넘침 '+JSON.stringify(text));assert.strictEqual(text.paperLayers,1);assert.strictEqual(text.portrait,'wanted/'+p.id);assert.strictEqual(Number(text.amount.replaceAll(',','')),p.bounty);
   await page.locator('#wanted-export-stage .wp-sheet').screenshot({path:path.join(OUT,p.file),omitBackground:true,animations:'disabled'});
   if((i+1)%30===0)console.log('개별 전단지 '+(i+1)+'/'+roster.n);
  }
  checks.push('156명 개별 PNG 출력·초상 ID·이름/해적단 길이·현상금 일치');
  assert.deepStrictEqual(errors,[]);
  const report={date:'2026-11-21',wantedCount:roster.n,lairChiefs:roster.chiefs,portraitTotal:roster.n+roster.chiefs,checks,changing,layouts,errors,people:roster.people};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  fs.writeFileSync(path.join(OUT,'index.html'),'<!doctype html><html lang="ko"><meta charset="utf-8"><title>현상금 전단지 156명</title><style>body{margin:0;background:#172841;color:#f3e4c5;font:16px Georgia,serif}header{padding:24px;position:sticky;top:0;background:#172841;border-bottom:1px solid #bd914c;z-index:2}h1{margin:0 0 10px;font-size:24px}input{padding:10px;width:260px;max-width:85%;background:#f3e4c5;border:1px solid #bd914c}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:22px;padding:24px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{padding:8px;text-align:center}a{color:inherit}small{color:#d4b986}</style><header><h1>현상금 전단지 · 156명</h1><p>실제 게임 명부 · 기본 현상금 기준 · 소굴 두목 14명은 현상금 명부 밖의 별도 인물입니다.</p><input id="q" aria-label="해적 이름 검색" placeholder="해적 이름 또는 해적단 검색"></header><main>'+roster.people.map(p=>'<figure data-name="'+esc(p.name+' '+p.band)+'"><a href="'+p.file+'"><img loading="lazy" src="'+p.file+'" alt="'+esc(p.name)+' 현상수배서"></a><figcaption>'+esc(p.name)+'<br><small>'+esc(p.band)+' · '+p.bounty.toLocaleString('en-US')+'닢</small></figcaption></figure>').join('')+'</main><script>document.getElementById("q").oninput=e=>document.querySelectorAll("figure").forEach(f=>f.hidden=!f.dataset.name.includes(e.target.value.trim()));</script></html>');
  console.log(JSON.stringify({passed:true,count:roster.n,checks,errors,out:OUT}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
