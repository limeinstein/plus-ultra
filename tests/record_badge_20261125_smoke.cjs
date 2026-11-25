/* 실제 증거 구매·역사 발생 → 배지 → 선택 열람·읽음·저장 복원. 자동 팝업과 배치도 검사한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/record-badge-20261125');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 let p;const errors=[],report={layouts:[]};
 try{
  p=await browser.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.addInitScript(()=>{localStorage.clear();localStorage.setItem('pu.lang','ko');localStorage.setItem('pu.uiSize','normal');const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>cb.name==='loop'?setTimeout(()=>raf(cb),150):raf(cb);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await p.evaluate(async()=>{
   await G.Game.ensureGeo();G.Nav.init();const s=G.Game.state=G.State.newGame({name:'선장',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   s.settings.res=.35;s.flags.prologue=true;G.State.save=()=>{};G.UI.fade=async fn=>fn();G.Scenes.city.findInside=async()=>{};
   const say=G.UI.say;G.UI.say=async()=>{};window.__say=say;G.Game.go('city',{cityId:0,load:true});
  });
  await p.waitForFunction(()=>G.Game.sceneName==='city'&&!G.Scenes.city.isBusy()&&!G.UI.busy()&&!!document.querySelector('.record-badge'),null,{timeout:60000});await p.evaluate(()=>{G.UI.say=window.__say;document.querySelector('.toasts').replaceChildren();});
  assert.equal(await p.locator('.record-badge').isVisible(),false,'기록이 없을 때 배지 자리 없음');
  report.purchase=await p.evaluate(async()=>{
   const c=G.CITY_DATA.find(c=>c&&G.TavernRumor.special(c));if(!c)throw Error('실제 구매 가능한 주점 증거품 없음');
   const t=G.TavernRumor.special(c),confirm=G.UI.confirm,say=G.Scenes.city.say,s=G.Game.state,gold=s.player.gold;
   G.UI.confirm=async()=>true;G.Scenes.city.say=async()=>{};
   try{await G.TavernRumor.tellSpecial(c,{name:'술집 주인'});}finally{G.UI.confirm=confirm;G.Scenes.city.say=say;}
   const item=s.player.items.find(it=>it.sp===t.id),entry=G.Records.items().find(e=>e.title===t.ev.name);
   return{name:t.ev.name,desc:t.ev.desc,paid:gold-s.player.gold,price:G.TavernRumor.evPrice(t),hasItem:!!item,record:entry,unread:G.Records.unread(),busy:G.UI.busy(),toasts:[...document.querySelectorAll('.toast')].map(e=>e.textContent)};
  });
  assert.equal(report.purchase.hasItem,true);assert.equal(report.purchase.paid,report.purchase.price);assert.ok(report.purchase.record);assert.ok(report.purchase.record.text.includes(report.purchase.desc));assert.equal(report.purchase.busy,false);
  assert.ok(!report.purchase.toasts.some(t=>t.includes(report.purchase.name)||t.includes('단서를 얻었다')));
  assert.equal(await p.locator('.record-badge').innerText(),'새 기록 '+report.purchase.unread+'건');
  const sources=await p.evaluate(()=>{
   const text='같은 내용을 서로 다른 곳에서 들은 기록 시험';
   const a=G.Records.add('evidence',{text,source:'술집'}),b=G.Records.add('evidence',{text,source:'후원자'}),again=G.Records.add('evidence',{text,source:'술집'});
   return{a:a.id,b:b.id,again:again.id};
  });assert.notEqual(sources.a,sources.b,'같은 날 같은 말이어도 출처가 다르면 따로 보존');assert.equal(sources.a,sources.again,'같은 소식의 이중 표시 경로는 중복하지 않음');
  // 실제 하루 처리에서 나온 역사 메시지는 배지에 들어간다. 나중에 보여 주는 경로가 또 불려도 중복되지 않는다.
  report.history=await p.evaluate(async()=>{
   const s=G.Game.state,h=G.HISTORY.find(h=>!h.quiet&&h.y>=1481);s.history=G.HISTORY.indexOf(h);s.date=G.U.addDays({y:h.y,m:h.m,d:h.d||1},-1);s.day=0;
   const out=G.Game.newDay(),news=out.filter(m=>m.history),before=G.Records.items().length,at=s.date;
   s.date=G.U.addDays(s.date,2);await G.Scenes.city.news(news);G.SeaNews.show(news);s.date=at;
   return{text:h.text,found:G.Records.items().some(e=>e.text.includes(h.text)),before,after:G.Records.items().length,busy:G.UI.busy(),panels:document.querySelectorAll('.sea-news').length};
  });assert.equal(report.history.found,true);assert.equal(report.history.after,report.history.before);assert.equal(report.history.busy,false);assert.equal(report.history.panels,0);
  // 대화 중 기록이 와도 대화창을 추가하지 않고, 대화 뒤에도 원문 팝업을 자동으로 띄우지 않는다.
  await p.evaluate(()=>{document.querySelector('.toasts').replaceChildren();window.__talk=G.UI.say('기록 알림이 대화를 가리지 않는지 확인합니다.',G.Scenes.mateSpeaker('first'));});await p.waitForSelector('.dlg');
  const inTalk=await p.evaluate(()=>{const n=G.Records.unread();G.UI.toast('대화 중 접수한 역사 기록','scroll',8000,{record:'history'});return{before:n,after:G.Records.unread(),dialogs:document.querySelectorAll('.modal-back').length,toasts:document.querySelectorAll('.toast').length};});
  assert.equal(inTalk.after,inTalk.before+1);assert.equal(inTalk.dialogs,1);assert.equal(inTalk.toasts,0);await p.waitForTimeout(250);await p.keyboard.press('Escape');await p.waitForFunction(()=>!G.UI.busy());await p.waitForTimeout(1000);
  assert.equal(await p.locator('.toast').filter({hasText:'대화 중 접수한 역사 기록'}).count(),0);
  const unreadBefore=await p.evaluate(()=>G.Records.unread());await p.locator('.record-badge').click();await p.waitForSelector('.record-browser');assert.equal(await p.evaluate(()=>G.Records.unread()),unreadBefore,'목록을 열기만 하면 읽음 처리하지 않는다');
  const proofRow=p.locator('.record-row').filter({hasText:report.purchase.name});await proofRow.focus();await p.keyboard.press('Enter');
  assert.match(await p.locator('.record-detail').innerText(),new RegExp(report.purchase.name));assert.ok((await p.locator('.record-text').innerText()).includes(report.purchase.desc));
  assert.equal(await p.evaluate(()=>G.Records.unread()),unreadBefore-1);assert.equal(await p.locator('.record-browser').count(),1,'목록의 Enter가 창을 닫지 않는다');
  await p.waitForFunction(()=>{const img=document.querySelector('.record-picture');return img&&img.complete&&img.naturalWidth>0;});
  await p.screenshot({path:path.join(OUT,'record-evidence-reader.png')});
  await p.locator('[data-filter="history"]').click();assert.ok(await p.locator('.record-row').count()>0);assert.equal(await p.locator('.record-row').filter({hasText:report.purchase.name}).count(),0);
  await p.locator('.record-row').first().click();assert.ok((await p.locator('.record-text').innerText()).length>0);await p.screenshot({path:path.join(OUT,'record-history-reader.png')});
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!G.UI.busy());
  // 실제 저장 직렬화와 불러오기에서 원문·그림·읽음과 미열람 개수를 함께 복원한다.
  report.persist=await p.evaluate(()=>{
   const before=G.Records.items(),unread=G.Records.unread(),json=G.State.serialize(),loaded=G.State.deserialize(json);G.Game.state=loaded;G.Game.cityHud();
   return{before:before.length,after:G.Records.items().length,unreadBefore:unread,unreadAfter:G.Records.unread(),picture:G.Records.items().some(e=>e.img),read:G.Records.items().filter(e=>e.read).length};
  });assert.equal(report.persist.before,report.persist.after);assert.equal(report.persist.unreadBefore,report.persist.unreadAfter);assert.equal(report.persist.picture,true);assert.ok(report.persist.read>=2);
  // 3개 장면·4개 창 크기에서도 배지가 나침반 옆에 붙고 상단 숫자가 잘리지 않는다.
  for(const scene of ['city','sea','land']){
   await p.evaluate(scene=>G.Game.go(scene,scene==='city'?{cityId:0,load:true}:scene==='sea'?{depart:0}:{from:0}),scene);
   await p.waitForFunction(scene=>G.Game.sceneName===scene&&!G.UI.busy()&&(scene!=='city'||!G.Scenes.city.isBusy())&&!!document.querySelector('.record-badge'),scene,{timeout:60000});
   await p.evaluate(()=>{const s=G.Game.scene;if(s.runtime)s.runtime().paused=true;G.Game.refreshHud();});
   for(const [width,height,size]of[[1600,900,'normal'],[1280,720,'auto'],[960,540,'max'],[800,600,'normal']]){
    await p.setViewportSize({width,height});await p.evaluate(s=>G.Game.setUiSize(s),size);await p.waitForTimeout(180);
    const layout=await p.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const b=document.querySelector('.record-badge');return{badge:rect(b),compass:rect(document.querySelector('.notice-btn')),cells:[...document.querySelectorAll('.hud .cell')].map(e=>({key:e.dataset.k,...rect(e)})),text:b.textContent};});
    assert.ok(layout.badge.x>=layout.compass.right-1);assert.ok(layout.badge.right<=layout.cells[0].x+1,'배지가 날짜를 가리지 않음');layout.cells.forEach(c=>assert.ok(c.right<=width+1&&c.x>=-1,c.key+' 화면 안'));
    await p.screenshot({path:path.join(OUT,'badge-'+scene+'-'+width+'-'+size+'.png')});report.layouts.push({scene,width,height,size,...layout});
   }
  }
  // 작은 화면의 기록함도 원문을 잘라 버리지 않고 내부에서 스크롤한다.
  await p.setViewportSize({width:960,height:540});await p.evaluate(()=>{G.Game.setUiSize('max');G.Records.add('history',{title:'긴 기록 열람 시험',text:'원문이 길어도 읽을 수 있어야 합니다.\n'.repeat(80)});});await p.locator('.record-badge').click();await p.waitForSelector('.record-browser');await p.locator('.record-row').filter({hasText:'긴 기록 열람 시험'}).click();
  assert.equal(await p.locator('.record-detail').evaluate(e=>e.scrollHeight>e.clientHeight),true);const win=await p.locator('.record-browser').boundingBox();assert.ok(win.x>=0&&win.x+win.width<=961);await p.screenshot({path:path.join(OUT,'record-reader-960-max.png')});await p.keyboard.press('Escape');
  // 이미 읽은 기록의 보관 한도를 넘겨도 미열람 원문은 삭제하지 않는다.
  const retention=await p.evaluate(()=>{const k=G.BALANCE.notice,keep=k.recordKeep;k.recordKeep=1;const before=G.Records.items().filter(e=>!e.read).map(e=>e.id);G.Records.add('history',{text:'미열람 보존 확인'});const after=G.Records.items().map(e=>e.id);k.recordKeep=keep;return before.every(id=>after.includes(id));});assert.equal(retention,true);
  await p.setViewportSize({width:1600,height:900});await p.evaluate(()=>{G.Game.setUiSize('normal');G.Game.go('city',{cityId:0,load:true});});await p.waitForFunction(()=>!G.UI.busy()&&!G.Scenes.city.isBusy());
  await p.locator('.record-badge').click();await p.getByRole('button',{name:'모두 읽음',exact:true}).click();assert.equal(await p.evaluate(()=>G.Records.unread()),0);await p.keyboard.press('Escape');assert.equal(await p.locator('.record-badge').innerText(),'기록함');
  await p.locator('.notice-btn').click();await p.getByRole('button',{name:'증거·역사 기록함',exact:true}).click();await p.waitForSelector('.record-browser');await p.keyboard.press('Escape');
  assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('통과: 실제 증거 구매·역사 발생·배지·대화 보호·원문/그림·읽음·저장 복원·3장면/4크기·콘솔 오류 0');
 }catch(e){if(p){console.error(await p.evaluate(()=>document.querySelector('#ui').innerText.slice(-1700)).catch(()=>''));await p.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
