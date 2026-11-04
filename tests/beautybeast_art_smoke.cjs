/* 실제 보르네오 장미 사건을 시작해 네 장면과 선택 초상 연결을 확인한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/beauty-beast-borneo-20261103/runtime');
(async()=>{
fs.mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/fonts\.(googleapis|gstatic)/.test(m.text()+(m.location().url||'')))errors.push(m.text());});
 await page.exposeFunction('__captureBeautyScene',async key=>{
  await page.waitForSelector('.famscene.on img');
  await page.waitForSelector('.dlg .pframe');
  await page.locator('.famscene img').evaluate(im=>im.decode());
  assert.strictEqual(await page.locator('.dlg-actor.active.tall').count(),0,'큰 초상이 사건 그림을 가리지 않음');
  await page.waitForTimeout(120);
  await page.screenshot({path:path.join(OUT,key+'.png')});
  await page.keyboard.press('Escape');
 });
 await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.G&&G.Beauty&&G.FamEv&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const portraits=[];
  for(const [id,pic] of [['landon','beast'],['amy','beauty']]){
   const sp=G.Legend.speaker(id),face=G.Img.pick(G.Art.portraitKeys(sp.portrait)),half=G.Img.pick(sp.half);
   if(face!=='portraits/legendary/'+pic||half!==face+'_half')throw Error('선택 초상 연결: '+id);
   for(const key of [face,half]){const im=await G.Img.load(key);if(!im)throw Error(key);}
   portraits.push({id,face,half});
  }
  const images=[];
  for(const id of ['bb_mask','bb_river','bb_rescue','bb_garden']){
   const key='legend-events/'+id,im=await G.Img.load(key);
   if(!im||im.naturalWidth!==1881||im.naturalHeight!==836)throw Error('그림 누락/규격: '+key);
   images.push(key);
  }
  G.Game.state=G.State.newGame({name:'보르네오 사건 확인',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
  const s=G.Game.state;s.date={y:1575,m:3,d:1};s.mates=[];s.settings.res=.35;s.settings.sound=0;s.settings.music=0;s.flags.prologue=true;
  await G.Game.ensureGeo();s.loc={mode:'land',lon:113,lat:1,party:30};s.fleet.cargo={};s.player.items=[];G.R.addItem('rose');
  if(!G.Beauty.borneo(113,1))throw Error('보르네오 육지');
  const say=G.UI.say,show=G.FamEv.showPic,shown=[],captured=[],speakers=[];
  let current=null,battle=false;
  G.FamEv.showPic=function(ev){const h=show(ev);current={key:ev.img.split('/').pop(),handle:h};shown.push(ev.img);return h;};
  G.UI.say=async function(text,sp){
   if(!current)return;
   await current.handle.ready;
   if(sp&&sp.portrait){
    const face=G.Img.pick(G.Art.portraitKeys(sp.portrait));
    speakers.push({name:sp.name,face});
    if((face==='portraits/legendary/beast'||face==='portraits/legendary/beauty')&&captured.indexOf(current.key)<0){
     const key=current.key,pending=say(text,sp);
     await window.__captureBeautyScene(key);await pending;captured.push(key);
    }
   }
  };
  G.UI.ask=async()=> 'help';G.UI.toast=()=>{};
  G.Scenes.land.landBattle=async()=>{if(document.querySelector('.famscene'))throw Error('전투 전 장면 제거');battle=true;return 'win';};
  G.BALANCE.beauty.chance=0;
  const days=[];
  for(let i=0;i<G.BALANCE.beauty.sure;i++)days.push(await G.Beauty.onLand(113,1));
  return {portraits,images,shown,captured,speakers,days,battle,how:s.beauty.how,mates:s.mates.map(m=>m.id),souvenir:s.player.items.some(it=>it.id==='beast_mask'),remaining:!!document.querySelector('.famscene')};
 });
 assert.deepStrictEqual(result.shown,result.images);
 assert.deepStrictEqual(result.captured,['bb_mask','bb_river','bb_rescue','bb_garden']);
 assert.deepStrictEqual(result.days,[false,false,true]);
 assert(result.battle&&result.how==='won'&&result.mates.includes('landon')&&result.mates.includes('amy')&&result.souvenir&&!result.remaining);
 assert(result.speakers.some(s=>s.face==='portraits/legendary/beauty')&&result.speakers.some(s=>s.face==='portraits/legendary/beast'));
 assert.deepStrictEqual(errors,[]);
 fs.writeFileSync(path.join(OUT,'validation.json'),JSON.stringify({...result,errors},null,2)+'\n');
 console.log('보르네오 장미 조건 → 실제 사건 4장 순서·대화 얼굴·그림 종료·두 동료 합류 통과, 콘솔 오류 0');
} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
