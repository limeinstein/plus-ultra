/* 지역 시장 수집 업적 9종: 획득·사용·매각·옛 저장·보상·업적샷·수첩·도감. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/market-collection-achievements-20261116'));
const rulesOnly=process.argv.includes('--rules-only');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failures=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>{if(r.resourceType()==='image')failures.push(r.url());});};
 try{
 const context=await browser.newContext({viewport:{width:1280,height:800}});await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
 const page=await context.newPage();watch(page);
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.G&&G.Achieve&&G.Game.sceneName==='title',null,{timeout:120000});
 const report=await page.evaluate(async()=>{
  const A=G.Achieve,R=G.R,checks=[];
  function check(v,t){if(!v)throw Error(t);checks.push(t);}
  function fresh(){const s=G.State.newGame({name:'市場収集試験',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state=s;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.settings.autosave=false;s.date.y=1600;return s;}
  const ids=G.ACHIEVEMENTS.filter(a=>a.itemCollectionRule).map(a=>a.id),j=A.itemCollectionPool('jewels'),med=A.itemCollectionPool('medicine'),legend=A.itemCollectionPool('legend'),all=A.itemCollectionPool('all');
  check(ids.length===9&&new Set(ids).size===9,'수집 업적 9개·ID 고유');check(j.length===50&&med.length===20&&legend.length===6&&all.length===70,'수집 대상 50·20·6·70종');
  let s=fresh();s.player.items=[{id:j[0]},{id:j[0],qty:8},{id:j[1]}];s.player.storage=[{id:j[2]},{id:med[0]}];
  check(A.progress(A.get('collect_jewel10')).have===3&&A.progress(A.get('collect_medicine5')).have===1,'옛 저장: 소지품·보관함·중복 제외');
  s.player.items=[];s.player.storage=[];G.Game.state=G.State.deserialize(G.State.serialize());
  check(A.progress(A.get('collect_jewel10')).have===3,'보관·매각 뒤 저장 복원 기록 유지');
  s=fresh();R.addItem(j[0]);R.addItem(j[0]);R.addMarketItems(j[0],7,0,100);
  check(A.progress(A.get('collect_jewel10')).have===1&&R.itemCount(j[0])===9,'같은 품목 일반 획득·시장 묶음은 1종');
  while(R.slotsUsed()<R.ITEM_MAX)s.player.items.push({id:'test_full_'+s.player.items.length});
  check(!R.addItem(j[1])&&!R.addMarketItems(j[2],1,0,100)&&!A.itemEver()[j[1]]&&!A.itemEver()[j[2]],'가득 차 실패한 획득은 기록하지 않음');
  s=fresh();const gold=s.player.gold,tr=G.Fame.get('tr');
  j.slice(0,9).forEach(id=>R.addItem(id));check(!A.done('collect_jewel10'),'장신구 9종은 미달성');R.addItem(j[9]);
  check(A.done('collect_jewel10')&&s.player.gold===gold+G.BALANCE.marketCollections.collect_jewel10.gold,'장신구 10종 즉시 달성·금화 보상');
  check(G.Fame.get('tr')===tr+G.Fame.mul('tr',G.BALANCE.marketCollections.collect_jewel10.fame),'교역 명성 보상');
  const once=s.player.gold;R.addItem(j[9]);A.onItem(j[9]);check(s.player.gold===once&&s.achvPend.filter(x=>x==='collect_jewel10').length===1,'보상·업적샷 중복 방지');
  s=fresh();med.slice(0,4).forEach(id=>R.addItem(id));s.player.hp=10;R.useMedicine(med[0]);
  check(A.progress(A.get('collect_medicine5')).have===4&&!A.done('collect_medicine5'),'약 사용 후 수집 기록 4종 유지');R.addItem(med[4]);check(A.done('collect_medicine5'),'약 5종 수집 업적');
  s=fresh();G.REGIONS.forEach((_,reg)=>R.addItem(j.find(id=>G.ITEM[id].reg.includes(reg))));
  check(A.done('collect_jewel_regions'),'열한 지역 수집 판정');
  s=fresh();s.player.gold=100000000;j.slice(0,9).forEach(id=>R.addItem(id));const target=G.ITEM[j[9]],M=G.Scenes.city.B.market;
  let city;for(let w=0;w<10&&!city;w++){s.day=w*7;city=G.CITY_DATA.find(c=>c&&M.stock(c).some(it=>it.id===target.id));}
  check(!!city,'실제 시장 입고 대상');const old={choose:G.UI.choose,number:G.UI.number,confirm:G.UI.confirm,say:G.Scenes.city.say,play:A.playPending};let picked=false,played=[];
  G.UI.choose=async()=>picked?null:(picked=true,target.id);G.UI.number=async()=>1;G.UI.confirm=async()=>true;G.Scenes.city.say=async()=>{};A.playPending=async()=>{played=played.concat(s.achvPend||[]);s.achvPend=[];};
  try{await M.buy(city);}finally{Object.assign(G.UI,{choose:old.choose,number:old.number,confirm:old.confirm});G.Scenes.city.say=old.say;A.playPending=old.play;}
  check(A.done('collect_jewel10')&&played.includes('collect_jewel10'),'실제 구입 뒤 업적샷 대기열 재생');
  s=fresh();const ordinary=j.filter(id=>!G.ITEM[id].legendary);
  med.concat(ordinary,legend.slice(0,5)).forEach(id=>{check(R.addItem(id),'획득 '+id);R.removeItem(id);});
  check(!A.done('collect_legend_jewels')&&!A.done('collect_jewel50')&&!A.done('collect_market70'),'69종·전설 5종은 최종 미달성');R.addMarketItems(legend[5],1,191,700000);R.removeItem(legend[5]);
  check(ids.every(id=>A.done(id)),'70종·전설 6종·수집 업적 9개 완성');
  check(s.player.items.length===2&&A.progress(A.get('collect_market70')).have===70,'모두 사용·매각해도 70종 유지');
  G.Game.state=G.State.deserialize(G.State.serialize());s=G.Game.state;const savedGold=s.player.gold;A.onItem(legend[5]);A.check();
  check(ids.every(id=>A.done(id))&&s.player.gold===savedGold,'저장 복원 후 중복 보상 없음');
  s.achvPend=[];G.UI.clearScreen();G.Info.open('achv');
  const el=document.createElement('div');A.page(el);check(el.querySelectorAll('.market-collections .ac-card').length===9,'수첩 앞쪽 수집 카드 9개');check(el.textContent.includes('세상의 장신구')&&el.textContent.includes(G.ITEM[med[0]].name)&&!el.textContent.includes('regional_jewel_'),'진행 화면에 실제 품목명');
  return {ids,checks,recorded:Object.keys(A.itemEver()).length,collectionAwards:ids.map(id=>({id,gold:A.get(id).gold,fame:A.get(id).fame,cat:A.get(id).fameCat}))};
 });
 assert.equal(report.recorded,70);
 if(!rulesOnly){
  await page.evaluate(async ids=>{G.UI.clearScreen();for(const id of ids){const ev=G.ACHV_EVENTS[id];if(!ev||ev.pic!=='achievement-events/'+id)throw Error('업적샷 연결 '+id);const im=await G.Img.load(ev.pic);if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('업적샷 규격 '+id);}},report.ids);
  for(const id of report.ids){
   await page.evaluate(id=>{window.__collectionDone=false;window.__collectionPromise=G.Achieve.scene(G.Achieve.get(id)).then(()=>{window.__collectionDone=true;});},id);
   await page.waitForFunction(id=>{const im=document.querySelector('.famscene.on img');return im&&im.complete&&im.naturalWidth===1881&&im.src.includes('/'+id+'.');},id,{timeout:30000});
   await page.waitForFunction(()=>{const el=document.querySelector('.famscene.on');return el&&Number(getComputedStyle(el).opacity)>.99;});
   assert.equal(await page.locator('.dlg-actor.active.tall').count(),0);await page.screenshot({path:path.join(OUT,id+'-runtime.png')});
   let popup=false;
   for(let i=0;i<22;i++){if(await page.evaluate(()=>window.__collectionDone))break;const button=page.locator('.modal-back button.navy').last();if(await button.isVisible()){popup=true;await button.click();}else await page.keyboard.press('Enter');await page.waitForTimeout(240);}
   await page.waitForFunction(()=>window.__collectionDone,null,{timeout:5000});assert(popup,id+' 보상 창');assert.equal(await page.locator('.famscene').count(),0);
  }
  await page.evaluate(()=>{G.Info.open('achv');});await page.screenshot({path:path.join(OUT,'achievement-page.png')});
  const catalog=await context.newPage();watch(catalog);await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#achievements');
  await catalog.waitForFunction(()=>window.G&&G.ACHV_EVENTS&&G.Img,null,{timeout:60000});
  await catalog.evaluate(async ids=>{for(const id of ids){const e=G.ACHV_EVENTS[id];const im=await G.Img.load(e.pic);if(!im||G.Img.file(e.pic)!=='achievement-events/'+id+'.webp')throw Error('도감 연결 '+id);}},report.ids);
  await catalog.locator('#q').fill('바다의 약재상');const card=catalog.locator('#grid .card').filter({hasText:'바다의 약재상'});await card.click();
  assert((await catalog.locator('#detail').innerText()).includes('사교 명성'));await catalog.screenshot({path:path.join(OUT,'medicine-collection-catalog.png')});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);fs.writeFileSync(path.join(OUT,rulesOnly?'rules-check.json':'browser-check.json'),JSON.stringify({...report,errors,failures,rulesOnly},null,2));
 console.log('통과: 수집 업적 9종·중복 제외·실패 획득 제외·사용/매각 기록·옛 저장·일회 보상·시장 연동'+(rulesOnly?'':'·업적샷 9장·수첩·도감')+'·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
