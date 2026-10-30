/* 전체 발견물 장면 연결과 새 도시·탐험 외관, 신기루 소멸을 file://에서 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
const SPEC=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/art/discovery-exteriors-20261031-prompts.json'),'utf8'));
const rows=SPEC.assets.filter(r=>!process.argv.includes('--ready')||fs.existsSync(path.join(ROOT,r.target)));
const OUT=path.join(ROOT,'artifacts/discovery-completion-20261031');
const executablePath=process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async()=>{
 const browser=await chromium.launch({executablePath,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 try{
  fs.mkdirSync(OUT,{recursive:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  const report=await page.evaluate(async ({rows,complete})=>{
   function ok(v,m){if(!v)throw Error(m);}
   const sceneMissing=G.DISCOVERIES.filter(d=>!['discoveries/','discovery-ends/','discovery-sheets/'].every(k=>G.Img.has(k+d.id))||!G.Reel.key(d)).map(d=>d.id);
   ok(!sceneMissing.length,'전체 발견물 장면 누락: '+sceneMissing.join(','));
   const exteriorMissing=G.DISCOVERIES.filter(d=>{if(d.cat==='ruin'&&d.how==='city')return !G.Img.has('landmarks/'+d.id);if((d.cat==='ruin'||d.cat==='nature'||d.natural)&&d.how!=='city'){const key=G.DiscoveryIcon.key(d);return !G.DiscoveryIcon.isMapLandmark(d)||!key||!G.Img.has(key);}return false;}).map(d=>d.id);
   if(complete)ok(!exteriorMissing.length,'전체 도시·야외 외관 누락: '+exteriorMissing.join(','));
   G.State.newGame({name:'발견물 외관 검수',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   const s=G.Game.state;s.settings.res=.35;s.prologueDone=true;G.Game.scene.update=function(){};
   const load=[];
   for(const row of rows){
    const im=await G.Img.load(row.key);ok(im,row.id+': 그림 해독');
    const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
    const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);ok(ctx.getImageData(0,0,1,1).data[3]===0,row.id+': 투명 배경');load.push(row.id);
   }
   const city=[],field=[],schools=[];
   const oldChance=G.BALANCE.mirage.cityChance;G.BALANCE.mirage.cityChance=1;
   try{
    for(const row of rows.filter(r=>r.kind==='city')){
     const d=G.DISC[row.id];ok(G.Town.available(G.CITY_DATA[d.city]),d.id+': 실제 거리 화면 사용');s.date.y=d.goneY?1480:Math.max(d.built||0,1800);s.mirageVisit=null;
     await G.Town.open(G.CITY_DATA[d.city],G.Scenes.city.buildings(G.CITY_DATA[d.city]));
     const mark=G.Town.runtime().marks.find(m=>m.id===d.id);ok(mark,d.id+': 실제 도시 거리 배치');
     ok(G.Mirage.exteriorKey(d)===row.key,d.id+': 신기루도 거리 외관 사용');
     ok(mark.cv.width>100&&mark.cv.height>200,d.id+': 거리 외관 크기');city.push(d.id);G.Town.close();
    }
   }finally{G.BALANCE.mirage.cityChance=oldChance;}
   s.date.y=2000;
   for(const row of rows.filter(r=>r.kind==='field')){
    const d=G.DISC[row.id];ok(G.DiscoveryIcon.key(d)===row.key&&G.DiscoveryIcon.isMapLandmark(d),d.id+': 지도 전용 외관 연결');
    s.disc[d.id]={me:true,found:1};
    if(!d.alwaysMirage)ok(G.DiscoveryIcon.visible().some(x=>x.id===d.id),d.id+': 발견 뒤 지도 표시');
    const cv=document.createElement('canvas');cv.width=cv.height=100;const ctx=cv.getContext('2d');
    if(!d.alwaysMirage){
     G.DiscoveryIcon.draw(ctx,d,50,50,{scale:1.6});const p=ctx.getImageData(0,0,100,100).data;
     let ink=0;for(let i=3;i<p.length;i+=4)if(p[i])ink++;ok(ink>5,d.id+': 실제 지도 그리기');
    }
    field.push(d.id);
   }
   const oldVanish=G.BALANCE.mirage.vanish;G.BALANCE.mirage.vanish=.15;
   try{
    for(const row of rows.filter(r=>r.kind==='field'&&G.DISC[r.id].alwaysMirage)){
     const d=G.DISC[row.id];ok(G.Mirage.exteriorKey(d)===row.key,d.id+': 신기루 전용 외관');
     ok(!G.DiscoveryIcon.visible().some(x=>x.id===d.id),d.id+': 사라진 신기루는 지도에 없음');
     const job=G.Mirage.vanish(d);ok(G.DiscoveryIcon.visible().some(x=>x.id===d.id),d.id+': 소멸 중 지도 표시');
     ok(document.querySelector('.mirage.vanish .mirage-exterior img'),d.id+': 투명 신기루 화면');await job;
     ok(!G.DiscoveryIcon.visible().some(x=>x.id===d.id),d.id+': 지도 소멸');schools.push(d.id);
    }
   }finally{G.BALANCE.mirage.vanish=oldVanish;}
   return {discoveries:G.DISCOVERIES.length,sceneMissing,exteriorMissing,loaded:load.length,city,field,schools};
  },{rows,complete:!process.argv.includes('--ready')});
  // 실제 거리 화면: 사라지기 전 로마 유적과 미래 대학을 각각 확인한다.
  for(const id of ['septizodium','constbaths','harvard']){
   if(!rows.some(r=>r.id===id))continue;
   await page.evaluate(async id=>{
    const d=G.DISC[id],s=G.Game.state;s.date.y=d.goneY?1480:2000;s.disc={};s.mirageVisit={v:s.portVisit||0,c:{[d.city]:1}};
    G.Game.showLayers(false,false,true);G.UI.clearScreen();
    await G.Town.open(G.CITY_DATA[d.city],G.Scenes.city.buildings(G.CITY_DATA[d.city]));
    G.Town.focusMark(id);const t=G.Town.runtime();t.cam=t.camTo;G.Town.update(0);
    const pixels=G.Game.sceneCtx().getImageData(0,0,1600,900).data;let lo=255,hi=0;for(let i=0;i<pixels.length;i+=64){lo=Math.min(lo,pixels[i]);hi=Math.max(hi,pixels[i]);}if(hi-lo<40)throw Error(id+': 거리 화면이 비어 있습니다.');
   },id);
   await page.screenshot({path:path.join(OUT,id+'-street.png')});
   await page.evaluate(()=>G.Town.close());
  }
  if(rows.some(r=>r.id==='manwoldae')){
   await page.evaluate(async()=>{
    const d=G.DISC.manwoldae,s=G.Game.state;s.date.y=2000;s.disc[d.id]={me:true,found:1};
    await G.Game.ensureGeo();
    s.loc={mode:'land',lon:d.lon-.3,lat:d.lat-.3,heading:0,base:{type:'city',city:0,lon:d.lon,lat:d.lat},party:s.fleet.crew,days:0,party0:s.fleet.crew,found0:0,marks0:0,mount:{id:'walk',n:0}};
    G.Game.go('land',{});
   });
   await page.waitForFunction(()=>G.Game.sceneName==='land'&&G.Scenes.land.runtime()&&G.Scenes.land.runtime().alive);
   await page.evaluate(()=>{G.Scenes.land.runtime().paused=true;G.Scenes.land.update(0);});
   await page.screenshot({path:path.join(OUT,'manwoldae-exploration.png')});
  }
  // 완성된 외관들을 같은 크기로 그려 그림과 실제 지도 그리기 결과를 함께 남긴다.
  await page.evaluate(rows=>{
   G.Game.scene.update=function(){};if(G.Game.sceneName==='land')G.Scenes.land.exit();
   document.body.innerHTML='<main style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:16px;background:#e9e1d2"></main>';
   for(const row of rows){
    const card=document.createElement('article');card.style.cssText='height:190px;text-align:center';
    const im=new Image();im.src=G.Img.src(row.key);im.style.cssText='width:100%;height:155px;object-fit:contain';
    const name=document.createElement('p');name.textContent=row.name;name.style.cssText='font:14px sans-serif;margin:8px';card.append(im,name);document.querySelector('main').appendChild(card);
   }
   return Promise.all([...document.images].map(im=>im.decode()));
  },rows);
  await page.screenshot({path:path.join(OUT,'all-exteriors-runtime.png'),fullPage:true});
  assert.deepStrictEqual(errors,[],'브라우저 콘솔 오류');
  fs.writeFileSync(path.join(OUT,'runtime-report.json'),JSON.stringify({...report,errors},null,2));
  console.log('PASS: 전체 '+report.discoveries+'종 발견 장면, 신규 외관 '+report.loaded+'종·도시 '+report.city.length+'·지도 '+report.field.length+'·대학 신기루 '+report.schools.length+', 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
