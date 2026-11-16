/* 지역 장신구·약 70종 전용 원화·투명도·시장·소지품·도감 표시를 실제 Chromium에서 검사한다. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require('../tools/procedural_art/node_modules/playwright-core'));}
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/regional-item-art-20261116'));
const SPEC=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/art/regional-item-prompts-20261116.json'),'utf8'));
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
 const offline=p=>p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960}});watch(page);await offline(page);
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  await page.waitForFunction(()=>G.Loader&&!G.Loader.shown(),null,{timeout:120000});
  const report=await page.evaluate(async assets=>{
   const loaded=[];
   for(const a of assets){
    const it=G.ITEM[a.id];if(!it||it.name!==a.name)throw Error('아이템 불일치 '+a.id);
    const key=G.Img.pick(G.Img.chain.item(it));if(key!=='items/'+a.id)throw Error('원화 연결 '+a.id+' '+key);
    const im=new Image();im.src=G.Img.itemSrc(it);await im.decode();if(im.naturalWidth!==256||im.naturalHeight!==256)throw Error('크기 '+a.id);
    const cv=document.createElement('canvas');cv.width=cv.height=256;const cx=cv.getContext('2d');cx.drawImage(im,0,0);
    const data=cx.getImageData(0,0,256,256).data;let opaque=0;
    for(let i=3;i<data.length;i+=4)if(data[i])opaque++;
    if(data[3]||opaque<500)throw Error('투명도·빈 그림 '+a.id);
    loaded.push({id:a.id,key,opaque});
   }
   const s=G.State.newGame({name:'지역 원화 검사',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state=s;s.settings.res=.35;s.flags.prologue=true;s.player.items=assets.map(a=>({id:a.id}));s.player.hp=40;s.date.y=1600;
   await G.Game.ensureGeo();G.Game.go('sea',{depart:0});G.Info.open('items');return {loaded};
  },SPEC.assets);
  assert.equal(report.loaded.length,70);
  for(const id of ['regional_jewel_0_0','regional_jewel_6_2','regional_legend_1','regional_medicine_3']){
   const row=page.locator('.items-tbl tr').filter({has:page.locator('canvas[data-img="items/'+id+'"]')});await row.scrollIntoViewIfNeeded();
   await page.waitForFunction(id=>{const im=G.Img.get('items/'+id);return im&&im.naturalWidth===256;},id);
   await page.screenshot({path:path.join(OUT,id+'-inventory.png')});
  }
  // 실제 시장 선택 목록이 전용 그림을 사용하는지 확인한다.
  const market=await page.evaluate(async()=>{
   const s=G.Game.state,M=G.Scenes.city.B.market;let target;
   for(let w=0;w<30&&!target;w++){s.day=w*7;for(const c of G.CITY_DATA){if(c&&M.stock(c).some(x=>x.kind==='medicine')){target=c;break;}}}
   const old={choose:G.UI.choose,say:G.Scenes.city.say};let entries;
   G.UI.choose=async(title,rows)=>{entries=rows;return null;};G.Scenes.city.say=async()=>{};
   try{await M.buy(target);}finally{G.UI.choose=old.choose;G.Scenes.city.say=old.say;}
   const rows=entries.filter(x=>/^regional_/.test(x.value));
   if(!rows.length||rows.some(x=>!x.thumb||!x.thumb.includes('items/regional_')))throw Error('시장 원화 표시');
   return rows.map(x=>({id:x.value,thumb:x.thumb}));
  });report.market=market;
  const catalog=await browser.newPage({viewport:{width:1280,height:960}});watch(catalog);await offline(catalog);
  await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#items');
  for(const id of ['regional_legend_4','regional_medicine_1','regional_medicine_3']){
   const a=SPEC.assets.find(x=>x.id===id);await catalog.locator('#q').fill(a.name);
   const card=catalog.locator('#grid .card').filter({hasText:a.name});await card.locator('.thumb canvas').waitFor();await card.click();
   assert((await catalog.locator('#detail').innerText()).includes('items/'+id+'.webp'));
   await catalog.screenshot({path:path.join(OUT,id+'-catalog.png')});await catalog.locator('#detail').evaluate(x=>x.close());
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(OUT,'browser-check.json'),JSON.stringify({...report,errors},null,2));
  console.log('통과: 70종 전용 원화·256px·투명 배경·시장·소지품·도감·콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
