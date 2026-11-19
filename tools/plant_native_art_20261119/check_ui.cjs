'use strict';
// 실제 file:// 게임에서 식물 증거와 도시별 외부·내부 그림을 해독한다.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/plant-native-art-20261119');
const {chromium}=require(path.join(root,'tools/procedural_art/node_modules/playwright-core'));
const records=JSON.parse(fs.readFileSync(path.join(out,'checks.json'),'utf8')).records;
const mapping=JSON.parse(fs.readFileSync(path.join(__dirname,'asset-overrides.json'),'utf8'));
let browser;const errors=[];
(async()=>{try{
 const executablePath=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
 browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:540}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
 await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>f.name==='loop'?0:raf(f);});
 await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.G?.Img?.chain&&G.RELIC&&G.CITY_DATA&&G.State,null,{timeout:60000});
 const loaded=await page.evaluate(async({records,mapping})=>{
  const result=[];
  for(const job of records){
   const c=job.city!=null?G.CITY_DATA.find(c=>c.id===job.city):null;
   const relic=job.type==='plant'?G.RELIC[job.id]:null;
   if(job.type==='plant'&&!relic)throw Error('식물 아이템 자료 없음: '+job.id);
   if(job.city!=null&&!c)throw Error('마을 자료 없음: '+job.city);
   const chain=job.type==='plant'?G.Img.chain.relic(relic):job.type==='village'?G.Img.chain.bg(c):G.Img.chain[job.type](job.kind,c);
   const resolved=await G.Img.resolve(chain);
   if(!resolved||!job.keys.includes(resolved.key))throw Error('전용 그림 선택 실패: '+job.id+' '+resolved?.key);
   if(G.IMAGE_FILES[resolved.key]!==mapping[resolved.key])throw Error('그림 파일 연결 불일치: '+job.id);
   if(resolved.img.naturalWidth!==job.displaySize[0]||resolved.img.naturalHeight!==job.displaySize[1])throw Error('그림 크기 불일치: '+job.id);
   if(relic){const item=await G.Img.resolve(G.Img.chain.item(G.ITEM[job.id]));if(!item||!job.keys.includes(item.key))throw Error('소지품 그림 누락: '+job.id);}
   result.push({id:job.id,key:resolved.key,size:[resolved.img.naturalWidth,resolved.img.naturalHeight]});
  }
  return result;
 },{records,mapping});
 const rendered=[];
 await page.evaluate(()=>{
  const sk={};G.SKILLS.forEach(k=>sk[k.id]=2);
  const s=G.Game.state=G.State.newGame({name:'원화 확인',nation:'PT',job:'explorer',age:35,birth:{m:4,d:12},st:{str:70,int:75,mar:72,cha:75},sk,lg:G.LANGS.map(()=>3),diff:'normal'});
  Object.assign(s.settings,{res:.35,music:0,sound:0,sfx:0,autosave:false});s.flags.prologue=true;
  G.State.save=()=>false;G.State.saveAsync=async()=>({ok:false});G.Tutorial.active=()=>false;
  G.Game.scene?.exit?.();G.Game.scene=null;G.Game.sceneName='capture';G.UI.clearScreen();G.Game.showLayers(false,false,true);
 });
 for(const city of [316,319,323])for(const kind of ['village','tavern']){
  if(!records.some(r=>r.city===city&&(kind==='village'?r.type==='village':r.type==='interior'&&r.kind===kind)))continue;
  await page.evaluate(async({city,kind})=>{
   const c=G.CITY_DATA.find(c=>c.id===city),s=G.Game.state;s.loc={mode:'city',city,lon:c.lon,lat:c.lat};
   const chain=kind==='village'?G.Scenes.city.viewKeys(c):G.Scenes.city.interiorKeys(kind,c);
   await G.Img.resolve(chain);G.Game.setScene(kind==='village'?G.Scenes.city.view(c):G.Scenes.city.interior(kind,c));
  },{city,kind});
  await page.screenshot({path:path.join(out,'game-'+city+'-'+kind+'.png')});rendered.push({city,kind});
 }
 await page.goto(pathToFileURL(path.join(out,'index.html')).href,{waitUntil:'load'});
 await page.evaluate(()=>document.querySelectorAll('img').forEach(im=>im.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(im=>im.complete&&im.naturalWidth>0),null,{timeout:60000});
 const gallery=await page.locator('figure').count();
 if(gallery!==records.length)throw Error('갤러리 누락');
 for(const type of ['plant','village','exterior','interior']){
  await page.evaluate(type=>show(type),type);
  await page.screenshot({path:path.join(out,'preview-'+type+'.png')});
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(out,'ui-checks.json'),JSON.stringify({loaded:loaded.length,expected:records.length,gallery,rendered,errors,records:loaded},null,2));
 console.log(JSON.stringify({loaded:loaded.length,gallery,rendered,errors}));
}finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
