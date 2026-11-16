/* 아프리카 동물 장신구 10종·북방 코트 5종: 시장 지역·위도·장비·원화·소지품·도감. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/africa-fur-items-20261116'));
const specs=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/africa_fur_item_prompts_20261116.json'),'utf8')).assets;
const rulesOnly=process.argv.includes('--rules-only');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
 try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});await context.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
 const page=await context.newPage();watch(page);await page.addInitScript(()=>{const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
 await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
 const report=await page.evaluate(async specs=>{
  const check=(v,t)=>{if(!v)throw Error(t);};await G.Game.ensureGeo();const s=G.State.newGame({name:'모피와 동물 장신구',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state=s;s.date.y=1700;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.player.gold=100000000;
  const jewels=specs.filter(a=>a.kind==='gift'),coats=specs.filter(a=>a.kind==='armor'),M=G.Scenes.city.B.market;
  check(jewels.length===10&&coats.length===5,'품목 수');check(new Set(G.ITEMS.map(x=>x.id)).size===G.ITEMS.length,'아이템 ID 중복 없음');
  const seen=new Set(),northCities=new Set();
  for(let period=0;period<12;period++){
   s.day=period*45;
   G.CITY_DATA.filter(c=>c&&G.R.cityExists(c)).forEach(c=>{
    const st=M.stock(c);
    st.filter(it=>specs.some(a=>a.id===it.id)).forEach(it=>{seen.add(it.id);if(it.kind==='gift')check(c.region===3,'아프리카 지역 제한');else{check(c.lat>=55&&[1,7,10].includes(c.region),'북방 위도·지역 제한');northCities.add(c.name);}});
   });
  }
  check(seen.size===15,'15종 전체 입고');
  const base=G.CITY_DATA.find(c=>c&&c.region===1&&c.lat>=55);
  for(const a of coats){let boundary=false;for(let w=0;w<20;w++){s.day=w*45;check(!M.stock({...base,lat:54.999}).some(x=>x.id===a.id),'위도 하한 미만 제외');if(M.stock({...base,lat:55}).some(x=>x.id===a.id))boundary=true;}check(boundary,'북위55도 경계 입고');}
  // 원래 50종/20종 수집 업적의 과거 달성 조건을 변경하지 않는다.
  check(G.Achieve.itemCollectionPool('jewels').length===50&&G.Achieve.itemCollectionPool('all').length===70,'기존 수집 조건 호환');
  specs.forEach(a=>check(G.R.addItem(a.id),'새 아이템 수령 '+a.id));
  const saved=G.State.serialize();G.Game.state=G.State.deserialize(saved);check(specs.every(a=>G.R.hasItem(a.id)),'저장 복원');
  G.UI.clearScreen();G.Info.open('items');return {items:specs.map(x=>x.id),northCities:[...northCities],seen:seen.size};
 },specs);
 assert.equal(report.seen,15);
 const equip=page.locator('.items-tbl tr').filter({hasText:'담비 코트'}).locator('[data-eq]');await equip.click();
 assert.equal(await page.evaluate(()=>G.Game.state.player.equip.armor),'furcoat_sable');
 await page.screenshot({path:path.join(OUT,'sable-equipped.png')});
 if(!rulesOnly){
  await page.evaluate(async specs=>{for(const a of specs){const it=G.ITEM[a.id],key=G.Img.pick(G.Img.chain.item(it));if(key!=='items/'+a.id)throw Error('개별 원화 '+a.id);const im=await G.Img.load(key);if(!im||im.naturalWidth!==256||im.naturalHeight!==256)throw Error('규격 '+a.id);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.drawImage(im,0,0);if(x.getImageData(0,0,1,1).data[3])throw Error('투명도 '+a.id);}},specs);
  const jewelRow=page.locator('.items-tbl tr').filter({hasText:'표범 문양 금반지'});await jewelRow.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(OUT,'african-jewels-inventory.png')});
  const catalog=await context.newPage();watch(catalog);await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#items');
  for(const name of ['사자 갈기 금목걸이','호피 코트']){await catalog.locator('#q').fill(name);const card=catalog.locator('#grid .card').filter({hasText:name});await card.locator('.thumb canvas').waitFor();await card.click();await catalog.locator('#dHero canvas').waitFor();await catalog.screenshot({path:path.join(OUT,name==='호피 코트'?'tiger-coat-catalog.png':'lion-necklace-catalog.png')});await catalog.locator('#detail').evaluate(el=>el.close());}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,rulesOnly?'rules-check.json':'browser-check.json'),JSON.stringify({...report,errors,rulesOnly},null,2));console.log('통과: 동물 장신구10·모피코트5·지역/북위55도 제한·저장·착용'+(rulesOnly?'':'·15종 원화·도감')+'·콘솔 오류0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
