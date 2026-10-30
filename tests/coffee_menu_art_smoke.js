/* 식당 음식 120종·커피 20종 해독과 문화권별 실제 커피 차림표를 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require('../tools/procedural_art/node_modules/playwright-core'));}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/menu-art-20261031/screenshots');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const errors=[];
 try{
  fs.mkdirSync(OUT,{recursive:true});const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&G.Coffee&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const checked=await page.evaluate(async()=>{
   function check(v,m){if(!v)throw Error(m);}
   const s=G.Game.state=G.State.newGame({name:'메뉴 그림 확인',nation:'PT',job:'merchant',age:30,birth:{m:1,d:1},st:{str:50,int:50,mar:50,cha:50},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   s.player.gold=100000;s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.coffee={open:{},tasted:{},last:{},lastPv:{}};
   const foods=[],coffees=[];
   for(const d of G.CUISINES){const key='foods/'+d.id,im=await G.Img.load(key);check(im&&im.naturalWidth>0,key+' 실제 해독');foods.push(key);}
   for(const d of G.COFFEE){const key='drinks/'+d.id,im=await G.Img.load(key);check(im&&im.naturalWidth===512&&im.naturalHeight===512,key+' 해독·규격');
    const cv=document.createElement('canvas');cv.width=512;cv.height=512;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);const px=ctx.getImageData(0,0,512,512).data;let clear=0,solid=0;
    for(let i=3;i<px.length;i+=4){if(px[i]<8)clear++;if(px[i]>240)solid++;}check(clear>512*512*.08&&solid>512*512*.1,key+' 배경 투명도·내용');s.coffee.open[d.id]={c:0,d:s.day};coffees.push(key);
   }
   const zones=[...new Set(G.COFFEE.map(x=>x.zone))].map(zone=>{
    const c=G.CITY_DATA.find(c=>c&&G.CUISINE.zone(c)===zone&&G.CUISINE.hasRestaurant(c))||G.CITY_DATA.find(c=>c&&G.CUISINE.zone(c)===zone);
    check(c,zone+' 도시 자료');return {zone,city:c.id,ids:G.COFFEE.filter(x=>x.zone===zone).map(x=>x.id)};
   });
   return {foods,coffees,zones};
  });
  assert.strictEqual(checked.foods.length,120);assert.strictEqual(checked.coffees.length,20);
  for(const z of checked.zones){
   await page.evaluate(id=>{window.__coffeeArtMenu=G.Scenes.city.B.restaurant.coffee(G.CITY_DATA[id]);},z.city);
   await page.waitForSelector('.choice-thumb');
   const actual=await page.locator('.choice-thumb').evaluateAll(async imgs=>{await Promise.all(imgs.map(im=>im.decode()));return imgs.map(im=>({src:im.src,width:im.naturalWidth,height:im.naturalHeight}));});
   assert.strictEqual(actual.length,z.ids.length,z.zone+' 전 메뉴 그림 표시');for(let i=0;i<actual.length;i++){assert(actual[i].src.endsWith('/drinks/'+z.ids[i]+'.webp'));assert.strictEqual(actual[i].width,512);}
   await page.screenshot({path:path.join(OUT,'coffee_'+z.zone+'.png')});await page.keyboard.press('Escape');await page.evaluate(()=>window.__coffeeArtMenu);
  }
  for(const id of [38,190,145,192]){
   await page.evaluate(id=>{window.__foodArtMenu=G.Scenes.city.B.restaurant.choose(G.CITY_DATA[id]);},id);await page.waitForSelector('.choice-thumb');
   const count=await page.locator('.choice-thumb').evaluateAll(async imgs=>{await Promise.all(imgs.map(im=>im.decode()));return imgs.length;});assert.strictEqual(count,6,'음식 메뉴 그림 6종');
   await page.screenshot({path:path.join(OUT,'food_'+id+'.png')});await page.keyboard.press('Escape');await page.evaluate(()=>window.__foodArtMenu);
  }
  assert.deepStrictEqual(errors,[],'콘솔 오류 0');fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({checked,errors},null,2));console.log('음식 120종·커피 20종 해독, 커피 투명도·규격, 문화권 '+checked.zones.length+'곳 커피 메뉴와 음식 4곳 실제 화면 통과. 콘솔 오류 0.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
