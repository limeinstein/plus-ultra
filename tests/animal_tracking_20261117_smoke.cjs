/* 전체 종 연결, file:// 색면 렌더링, 근접 발견 경계와 실제 장면 오류 검사. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=(process.env.OUT || path.join(root,'artifacts/animal-tracking-20261117'));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:960}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.AnimalTracking&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
  const result=await page.evaluate(async()=>{
   const check=(v,msg)=>{if(!v)throw Error(msg);};
   G.Scenes.title.exit();await G.Loader.hide();G.UI.clearScreen();
   G.State.newGame({name:'동물 흔적 검사',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
   G.Game.state.settings.res=.35;
   const A=G.AnimalTracking,rows=Object.keys(G.ANIMAL_TRACKING).map(id=>G.DISC[id]);
   check(rows.length===261,'전체 종 수');
   G.DISCOVERIES.filter(d=>d.animal).forEach(d=>check(A.is(d),'동물 누락 '+d.id));
   ['rubber','sakura','mangrove','bullocho'].forEach(id=>check(!A.is(G.DISC[id]),'식물 제외 '+id));
   const keys=[...new Set(['animal-tracking/footprints',...rows.map(d=>{const p=A.profile(d);return p.slot!=null?'animal-tracking/animals-'+p.sheet:p.key;})])];
   for(let i=0;i<keys.length;i+=24)await G.Img.preload(keys.slice(i,i+24).map(k=>[k]));
   keys.forEach(k=>check(!!G.Img.get(k),'원화 로딩 '+k));
   rows.forEach(d=>{const p=A.profile(d);check(p.palette.length>=2&&p.palette.length<=4,'색 수 '+d.id);check(!!A.sprite(d,false),'종별 그림 '+d.id);check(A.alpha(0,d.id)!==A.alpha(.9,d.id),'점멸 '+d.id);check(Math.abs(A.alpha(0,d.id)-A.alpha(3.6,d.id))<1e-9,'점멸 주기 '+d.id);});
   check(A.radius(G.DISC.tiger,10)===.65,'뭍 근접');check(A.radius(G.DISC.dolphin,10)===.9,'바다 근접');check(A.radius(G.DISC.tiger,.1)===.1,'불리한 기존 조건 보존');check(A.radius(G.DISC.rubber,10)===10,'식물 규칙 보존');
   check(G.Disc.noClueChance(G.DISC.tiger,'land',.2,.65,false)===1,'동물 앞에서 확률로 놓치지 않음');
   // 실제 검사 함수에서 종별 근접 경계, 하루 중복 제한을 확인한다.
   const disc=G.Disc,old={needMet:disc.needMet,opened:disc.opened,built:disc.built,noClueRoll:disc.noClueRoll,findK:disc.findK};
   const tiger=G.DISC.tiger,dolphin=G.DISC.dolphin;
   disc.needMet=d=>d===tiger||d===dolphin;disc.opened=()=>true;disc.built=()=>true;disc.noClueRoll=()=>true;disc.findK=()=>1;
   const pos=A.position(tiger);
   check(!disc.checkLand(pos.lon+1,pos.lat).hits.some(d=>d===tiger),'발자국에서 즉시 발견 금지');
   check(disc.checkLand(pos.lon,pos.lat).hits.some(d=>d===tiger),'동물 앞에서 발견');
   check(!disc.checkSea(dolphin.lon+1.5,dolphin.lat).some(d=>d===dolphin),'물결에서 즉시 발견 금지');
   check(disc.checkSea(dolphin.lon,dolphin.lat).some(d=>d===dolphin),'수중 동물 앞에서 발견');
   Object.assign(disc,old);
   delete G.Game.state.discDay;
   await G.Game.ensureGeo();
   // 실제 뭍·바다 장면이 새 그리기 함수를 부르는지 확인한다.
   const draw=A.draw,calls=[];A.draw=function(){calls.push(arguments[2]);return draw.apply(A,arguments);};
   await G.Game.go('land',{from:0});for(let i=0;i<6;i++)G.Scenes.land.update(0);
   check(calls.includes('land'),'뭍 장면 연결');
   await G.Game.go('sea',{depart:0});for(let i=0;i<6;i++)G.Scenes.sea.update(0);
   check(calls.includes('sea'),'바다 장면 연결');A.draw=draw;
   await G.Game.go('title');
   // Canvas 색면 필터가 원본 색 대신 지정 팔레트만 출력하는지 검사한다.
   const sp=A.sprite(G.DISC.panda,false),pixels=sp.getContext('2d').getImageData(0,0,96,96).data,colors=new Set();
   for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>250)colors.add([pixels[i],pixels[i+1],pixels[i+2]].join(','));
   check(colors.size>=2&&colors.size<=4,'판다 2~4색 실제 출력: '+colors.size);
   document.body.innerHTML='';document.body.style.cssText='margin:0;background:#d8c9a5;color:#302b24;font:16px sans-serif';
   const cv=document.createElement('canvas');cv.width=1280;cv.height=960;document.body.appendChild(cv);const x=cv.getContext('2d');
   x.fillStyle='#d8c9a5';x.fillRect(0,0,1280,960);x.fillStyle='#312b21';x.font='bold 26px sans-serif';x.fillText('동물 발견 · 종별 2~4색과 이동 흔적',28,42);
   const examples=['tiger','panda','flamingo','ostrich','kangaroo','elephant','giraffe','zebra','lion','polarbear','dolphin','kingcobra','morpho','dartfrog','trex','amurleopard'];
   examples.forEach((id,i)=>{const d=G.DISC[id],p=A.profile(d),col=i%4,row=Math.floor(i/4),ox=col*320,oy=75+row*215;
    x.fillStyle='rgba(255,250,223,.28)';x.fillRect(ox+12,oy,296,200);
    x.font='bold 16px sans-serif';x.fillStyle='#362c22';x.fillText(d.realName||d.name,ox+26,oy+28);
    const im=A.sprite(d,false);x.globalAlpha=1;x.drawImage(im,ox+174,oy+40,106,106);
    const pts=Array.from({length:7},(_,n)=>({lon:n,lat:0,ground:true}));
    A.drawTrail(x,d,pts,(lon,lat)=>[ox+35+lon*26,oy+157-lat*26],1.4);
    x.fillStyle='#514936';x.font='13px sans-serif';x.fillText(p.kind+' · '+p.palette.length+'색',ox+26,oy+188);
   });
   return{count:rows.length,assets:keys.length,pandaColors:[...colors]};
  });
  await page.screenshot({path:path.join(out,'preview.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'smoke-result.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
