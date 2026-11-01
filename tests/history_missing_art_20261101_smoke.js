/* 2026-11-01 역사 사건 누락 초상·장면의 실제 로드와 화자·액자 연결 검사. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let chromium;try{({chromium}=require('playwright'));}catch(_){({chromium}=require('../tools/procedural_art/node_modules/playwright-core'));}
const ROOT=path.resolve(__dirname,'..'),WORK=path.join(ROOT,'artifacts/history-art-20261101');
const people=JSON.parse(fs.readFileSync(path.join(WORK,'portrait-plan.json'),'utf8')).portraits;
const scenes=JSON.parse(fs.readFileSync(path.join(WORK,'scene-plan.json'),'utf8')).scenes;
const OUT=path.join(WORK,'runtime');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||undefined,args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/fonts\.(googleapis|gstatic)/.test(m.text()+(m.location().url||'')))errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
  await page.waitForFunction(()=>window.G&&G.Game&&G.Hist&&G.FamEv&&G.Game.sceneName==='title',null,{timeout:90000});
  const result=await page.evaluate(async({people,scenes})=>{
   const keys=people.flatMap(p=>['portraits/history/'+p.id,'portraits/history/'+p.id+'_half']).concat(scenes.map(s=>'legend-events/'+s.id));
   const decoded=[];
   for(const key of keys){
    if(!G.Img.has(key))throw new Error('이미지 키 누락: '+key);
    const image=await G.Img.load(key);if(!image)throw new Error('실제 로드 실패: '+key);if(image.decode)await image.decode();
    decoded.push({key,width:image.naturalWidth||image.width,height:image.naturalHeight||image.height});
    if(key.startsWith('portraits/')&&!G.PORTRAIT_FACES[key])throw new Error('얼굴 좌표 누락: '+key);
   }
   const speakers=people.map(p=>{const sp=G.Hist.speaker(p.id);return{id:p.id,name:sp.name,face:G.Img.pick(G.Art.portraitKeys(sp.portrait)),half:G.Img.pick(sp.half)};});
   G.State.newGame({name:'역사 인물 그림 검사',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   const s=G.Game.state;s.date={y:1480,m:6,d:1};s.flags.prologue=true;s.settings.res=0.35;s.loc={mode:'city',city:0};
   await G.Game.ensureGeo();G.Town._toldKeys=true;G.Game.go('city',{cityId:0});
   return{decoded,speakers};
  },{people,scenes});
  assert.strictEqual(result.decoded.length,people.length*2+scenes.length);
  for(const im of result.decoded){const expected=im.key.startsWith('legend-events/')?[1881,836]:im.key.endsWith('_half')?[1024,1536]:[1024,1024];assert.deepStrictEqual([im.width,im.height],expected,im.key);}
  for(const sp of result.speakers){assert.strictEqual(sp.name,people.find(p=>p.id===sp.id).name);assert.strictEqual(sp.face,'portraits/history/'+sp.id);assert.strictEqual(sp.half,'portraits/history/'+sp.id+'_half');}
  const seen=new Set();await page.waitForTimeout(500);
  for(const p of people){
   await page.evaluate(id=>{const sp=G.Hist.speaker(id);G.UI.say('역사 사건 — '+sp.name,sp).catch(e=>console.error(e));},p.id);
   await page.waitForTimeout(160);assert((await page.locator('body').innerText()).includes(p.name),p.id);
   const group=p.id.startsWith('ot_')?'ottomaneurope':p.id.startsWith('nc_')?'nerchinsk':p.id.startsWith('tw_')?'taiwan':p.id.startsWith('hj_')?'houjin':p.id.startsWith('sk_')?'sekigahara':p.id.startsWith('od_')?'odawara':p.id.startsWith('mc_')?'macao':'horan';
   if(!seen.has(group)){seen.add(group);await page.waitForTimeout(450);await page.screenshot({path:path.join(OUT,'portrait-'+group+'.png')});}
   await page.keyboard.press('Escape');await page.waitForTimeout(100);
  }
  for(const s of scenes){
   await page.evaluate(async row=>{window.__historyPic=G.FamEv.showPic({img:'legend-events/'+row.id,title:row.title});if(!window.__historyPic.box)throw new Error('장면 액자 누락: '+row.id);await window.__historyPic.ready;},s);
   await page.waitForTimeout(350);assert.strictEqual(await page.locator('.famscene img').count(),1,s.id);
   await page.screenshot({path:path.join(OUT,s.id+'.png')});
   await page.evaluate(async()=>{await window.__historyPic.stop();});
  }
  assert.deepStrictEqual(errors,[],'콘솔 오류 0');
  fs.writeFileSync(path.join(OUT,'validation.json'),JSON.stringify({...result,portraitCount:people.length*2,sceneCount:scenes.length,consoleErrors:errors},null,2)+'\n');
  console.log('역사 사건: 인물 '+people.length+'명·초상 '+people.length*2+'장·장면 '+scenes.length+'장 실제 로드·화자·액자 표시, 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
