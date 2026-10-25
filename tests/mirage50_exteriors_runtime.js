/* 도시의 실제 거리 배치와 야외 신기루의 소멸·지도 표시를 file://에서 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
const ready=process.argv.includes('--ready');
const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/mirage_exteriors/prompts.json'),'utf8')).filter(r=>!ready||fs.existsSync(path.join(ROOT,r.target)));
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&fs.existsSync(p));
(async()=>{
 const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Town&&G.Mirage&&G.Game);
  const result=await page.evaluate(async rows=>{
   G.State.newGame({name:'외관 시험',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   const s=G.Game.state;s.settings.res=.35;s.prologueDone=true;
   const loaded=await Promise.all(rows.map(r=>G.Img.load(r.target.slice(7,-5))));
   if(loaded.some(x=>!x))throw Error('외관 그림을 읽지 못했습니다.');
   const city=rows.filter(r=>r.kind==='city'),field=rows.filter(r=>r.kind!=='city');
   await G.DiscoveryIcon.preload(field.map(r=>G.DISC[r.id]));
   s.date={y:1609,m:6,d:1};
   const tooEarly=rows.filter(r=>G.Disc.built(G.DISC[r.id])||G.Mirage.active(G.DISC[r.id])).map(r=>r.id);
   s.date={y:1610,m:6,d:1};
   const keysWrong=rows.filter(r=>G.Mirage.exteriorKey(G.DISC[r.id])!==r.target.slice(7,-5)).map(r=>r.id);
   const cityMissing=[],citySize=[];
   for(const row of city){
    const c=G.CITY_DATA[row.how];
    await G.Town.open(c,[]);
    const mark=G.Town.runtime().marks.find(m=>m.id===row.id);
    if(!mark||!mark.mirage)cityMissing.push(row.id);
    if(mark)citySize.push({id:row.id,w:mark.cv.width,h:mark.cv.height,foot:mark.foot});
    G.Town.close();
   }
   s.date.y=1609;
   await G.Town.open(G.CITY_DATA[city[0].how],[]);
   const earlyCity=G.Town.runtime().marks.some(m=>city.some(r=>r.id===m.id));G.Town.close();
   s.date.y=1610;s.disc[city[0].id]={found:1,me:true,mirage:1};
   await G.Town.open(G.CITY_DATA[city[0].how],[]);
   const cityGone=!G.Town.runtime().marks.some(m=>m.id===city[0].id);G.Town.close();
   const old=G.DISC.stonehenge;s.disc[old.id]={found:1,me:true};
   const legacyVisible=G.DiscoveryIcon.visible().some(d=>d.id===old.id);
   const keep=G.BALANCE.mirage.vanish;G.BALANCE.mirage.vanish=.15;
   const fieldChecks=[];
   for(const row of field){
    const d=G.DISC[row.id];s.disc[d.id]={found:1,me:true,mirage:1};
    const hiddenBefore=!G.DiscoveryIcon.visible().some(x=>x.id===d.id);
    const done=G.Mirage.vanish(d);
    const visibleDuring=G.DiscoveryIcon.visible().some(x=>x.id===d.id);
    const picture=document.querySelector('.mirage.vanish .mirage-exterior img');
    const srcCorrect=!!picture&&picture.getAttribute('src').endsWith(row.target);
    const cv=document.createElement('canvas');cv.width=96;cv.height=96;
    const ctx=cv.getContext('2d');G.DiscoveryIcon.draw(ctx,d,48,48,{scale:1.4});
    const pixels=ctx.getImageData(0,0,96,96).data;
    let ink=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])ink++;
    await done;
    const gone=!G.DiscoveryIcon.visible().some(x=>x.id===d.id)&&!G.Mirage.mapAlpha(d);
    fieldChecks.push({id:d.id,hiddenBefore,visibleDuring,srcCorrect,ink,gone});
   }
   G.BALANCE.mirage.vanish=keep;
   // 그림을 한 화면에서 확인한다. 시험이 끝나면 이 브라우저도 닫힌다.
   document.body.innerHTML='<main style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#e9e2d4;padding:20px"></main>';
   for(const id of ['parkguell','empirestate','towerbridge','namsantower','bernabeu','ponte25abril','goryokaku','wtc']){
    const row=rows.find(r=>r.id===id);if(!row)continue;
    const card=document.createElement('section');
    card.innerHTML='<h3 style="font-size:14px">'+row.name+'</h3><img style="width:100%;height:190px;object-fit:contain" src="'+row.target+'">';
    document.querySelector('main').appendChild(card);
   }
   await Promise.all([...document.images].map(im=>im.decode()));
   return {count:loaded.length,tooEarly,keysWrong,cityMissing,citySize,earlyCity,cityGone,legacyVisible,fieldChecks};
  },rows);
  assert.equal(result.count,rows.length);assert.deepEqual(result.tooEarly,[]);assert.deepEqual(result.keysWrong,[]);assert.deepEqual(result.cityMissing,[]);
  assert(!result.earlyCity&&result.cityGone&&result.legacyVisible,JSON.stringify({earlyCity:result.earlyCity,cityGone:result.cityGone,legacyVisible:result.legacyVisible,fieldChecks:result.fieldChecks}));
  assert.equal(result.citySize.length,rows.filter(r=>r.kind==='city').length);
  assert(result.fieldChecks.length===rows.filter(r=>r.kind!=='city').length&&result.fieldChecks.every(r=>r.hiddenBefore&&r.visibleDuring&&r.srcCorrect&&r.ink>5&&r.gone),JSON.stringify(result.fieldChecks));
  await page.screenshot({path:path.join(ROOT,'docs/art/mirage50-exteriors-runtime.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({count:rows.length,city:result.citySize.length,field:result.fieldChecks.length,gate1609:true,vanish:true,legacyVisible:result.legacyVisible,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
