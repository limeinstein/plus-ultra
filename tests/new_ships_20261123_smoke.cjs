/* 새 선종 9종: 실제 3D·지역/연도·구입·염색·저장·항해/해전 연결을 검사한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/ships-20261123');
const IDS=['shipline','sloop','eastindiaman','ketch','koch','jounseon','bezaisen','padewakang','ghurab'];
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await pw.chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={};
 try{
  const page=await browser.newPage({viewport:{width:1000,height:760}});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(!process.argv.includes('--integration-only')){
   await page.goto(pathToFileURL(path.join(ROOT,'test_ships_3d.html')).href,{waitUntil:'domcontentloaded'});
   report.models=await page.evaluate(ids=>{
    const cv=document.createElement('canvas');cv.width=720;cv.height=560;const ctx=cv.getContext('2d'),checks=[];
    const atlas=document.createElement('canvas');atlas.width=1800;atlas.height=1440;const ax=atlas.getContext('2d');
    const before=JSON.stringify(G.SHIP_TYPES);
    function hash(){const d=ctx.getImageData(0,0,720,560).data;let h=0,n=0;for(let i=0;i<d.length;i+=4){if(d[i+3])n++;h=(Math.imul(h,31)+d[i]+d[i+1]*3+d[i+2]*7)|0;}return[h,n];}
    ids.forEach((id,row)=>{
     let spec=G.Art.shipLook(id,{flag:'#315c99',rig:{fill:.9,brace:.15,lee:1},oarPower:.8});
     function draw(a=.55,f=0,color=null){ctx.clearRect(0,0,720,560);spec=G.Art.shipLook(id,{furl:f,sailColor:color});spec.rig={fill:.9,brace:.15,lee:1};
      if(!G.Ship3D.draw(ctx,360,460,a,240,spec,1.25))throw Error(id+': '+JSON.stringify(G.Ship3D.stats()));return hash();}
     const dirs=[0,.3,Math.PI/2,Math.PI,Math.PI*1.5].map(a=>draw(a));
     const folds=[0,.5,1].map(f=>draw(.55,f)[0]);
     const ordinary=draw()[0],blue=draw(.55,0,'#435d87')[0],wine=draw(.55,0,'#79364d')[0],restored=draw()[0];
     const first=G.Ship3D.stats();for(let i=0;i<8;i++)draw(.55,0,i%2?'#435d87':null);const last=G.Ship3D.stats();
     const ship=G.ShipModels.create(G.Three,id),hull=ship.buildHull();let roles={};hull.traverse(o=>{const r=o.userData.regionalRole;if(r)roles[r]=(roles[r]||0)+1;});
     const rig=G.ShipModels.makeRig(ship,G.Three,g=>g,G.FX.ship3d);
     for(const f of [0,.5,1])for(const brace of [-.6,.6]){rig.update({furl:f,rig:{brace,fill:1,lee:brace<0?-1:1}},2);rig.sails.forEach(a=>{if(!Array.from(a.mesh.geometry.attributes.position.array).every(Number.isFinite))throw Error(id+' 돛 좌표');});}
     checks.push({id,name:G.SHIP[id].name,dirs,folds,ordinary,blue,wine,restored,roles,sailKinds:rig.sails.map(a=>a.kind),oars:rig.oars,geometries:[first.geometries,last.geometries],textures:[first.textures,last.textures]});
     const geos=new Set(),mats=new Set(),maps=new Set();[hull,rig.root].forEach(g=>g.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);}));mats.forEach(m=>{['map','bumpMap'].forEach(k=>{if(m[k])maps.add(m[k]);});m.dispose();});maps.forEach(t=>t.dispose());geos.forEach(g=>g.dispose());
     draw(.55,0,row%3===1?'#435d87':null);const x=row%3*600,y=Math.floor(row/3)*480;
     ax.fillStyle='#193b4b';ax.fillRect(x,y,600,480);ax.drawImage(cv,0,0,720,560,x,y,600,466);ax.fillStyle='#f1e6cc';ax.font='24px sans-serif';ax.fillText(G.SHIP[id].name,x+20,y+34);
    });
    return{checks,image:atlas.toDataURL(),unchanged:before===JSON.stringify(G.SHIP_TYPES),total:G.SHIP_TYPES.length};
   },IDS);
   fs.writeFileSync(path.join(OUT,'new-ships.png'),Buffer.from(report.models.image.split(',')[1],'base64'));delete report.models.image;
   assert.equal(report.models.total,45);assert(report.models.unchanged);
   for(const r of report.models.checks){assert.equal(new Set(r.dirs.map(d=>d[0])).size,5,r.id+' 방향');assert(r.dirs.every(d=>d[1]>700),r.id+' 빈 그림');assert.equal(new Set(r.folds).size,3,r.id+' 접기');assert.equal(new Set([r.ordinary,r.blue,r.wine]).size,3,r.id+' 색');assert.equal(r.ordinary,r.restored,r.id+' 기본 복원');assert.equal(r.geometries[0],r.geometries[1]);assert.equal(r.textures[0],r.textures[1]);}
   assert(report.models.checks.find(r=>r.id==='shipline').roles['upper-gunport']===18);
   assert(report.models.checks.find(r=>r.id==='sloop').sailKinds.includes('gaff'));
   assert(report.models.checks.find(r=>r.id==='ketch').sailKinds.filter(k=>k==='gaff').length===2);
   assert.equal(report.models.checks.find(r=>r.id==='bezaisen').oars,0);
   fs.writeFileSync(path.join(OUT,'visual-report.json'),JSON.stringify(report.models,null,2));
   console.log('9종 3D·방향·돛 접기·염색·자원 검사 통과');
   if(process.argv.includes('--visual-only'))return;
  }
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>G.Game&&G.State&&G.Scenes.city.B.shipyard,null,{timeout:90000});
  await page.evaluate(()=>G.Game.ensureGeo());
  report.data=await page.evaluate(ids=>{
   const s=G.State.newGame({name:'새 선박 검사',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state=s;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.date.y=1670;s.player.gold=1000000;
   const Y=G.Scenes.city.B.shipyard,out=[];
   ids.forEach(id=>{const t=G.SHIP[id],cities=G.CITY_DATA.filter(c=>c&&c.port&&Y.types(c).includes(id));if(!cities.length)throw Error(id+' 판매 항구 없음');
    s.date.y=t.from-1;if(G.CITY_DATA.some(c=>c&&c.port&&Y.types(c).includes(id)))throw Error(id+' 조기 해금');s.date.y=1670;
    const ship=G.R.newShip(id,'검사 '+id);if(!Number.isFinite(G.R.shipSpeed(ship,0,{dir:0,spd:1})))throw Error(id+' 속력 오류');if(!G.SHIP_HIST[id])throw Error(id+' 역사 누락');
    out.push({id,from:t.from,cities:cities.map(c=>c.name),hp:ship.maxHp,cap:G.R.shipCargoCap(ship)});
   });s.fleet.ships=[G.R.newShip('sloop','염색 시험')];s.fleet.crew=60;G.Game.go('city',{cityId:0});return out;
  },IDS);
  // 실제 색상 창에서 취소·적용·동일색·직접색·잔액 부족·원래 색을 확인한다.
  async function openDye(){await page.evaluate(()=>{window.__dye=G.Scenes.city.B.shipyard.dyeSails(G.CITY_DATA[0],G.Game.state.fleet.ships[0]);});await page.locator('.sail-dye-preview').waitFor();}
  async function finishDye(label){await page.getByRole('button',{name:label,exact:true}).click();await page.evaluate(()=>window.__dye);}
  const initial=await page.evaluate(()=>JSON.stringify(G.Game.state.fleet.ships[0],(k,v)=>k==='_row'?undefined:v));
  await openDye();await page.locator('[data-dye="5"]').click();await finishDye('그만둔다');assert.equal(await page.evaluate(()=>JSON.stringify(G.Game.state.fleet.ships[0],(k,v)=>k==='_row'?undefined:v)),initial);
  await openDye();await page.locator('[data-dye="5"]').click();await page.screenshot({path:path.join(OUT,'sail-color-ui.png')});
  await page.setViewportSize({width:640,height:360});
  const small=await page.getByRole('button',{name:'이 색으로 적용',exact:true}).boundingBox();assert(small&&small.x>=0&&small.y>=0&&small.x+small.width<=641&&small.y+small.height<=361,'작은 화면 적용 단추');
  await page.screenshot({path:path.join(OUT,'sail-color-small.png')});await page.setViewportSize({width:1000,height:760});await finishDye('이 색으로 적용');
  const dyed=await page.evaluate(()=>({color:G.Game.state.fleet.ships[0].sailColor,gold:G.Game.state.player.gold}));assert.equal(dyed.color,'#435d87');assert.equal(dyed.gold,999880);
  await openDye();await finishDye('이 색으로 적용');assert.equal(await page.evaluate(()=>G.Game.state.player.gold),dyed.gold);
  await openDye();await page.locator('.sail-dye-custom').evaluate(el=>{el.value='#e04a8b';el.dispatchEvent(new Event('input',{bubbles:true}));});await finishDye('이 색으로 적용');
  await page.evaluate(()=>{window.__rich=G.Game.state.player.gold;G.Game.state.player.gold=0;});await openDye();await page.locator('[data-dye="2"]').click();await page.getByRole('button',{name:'이 색으로 적용',exact:true}).click();assert.equal(await page.locator('.sail-dye-preview').count(),1);await finishDye('그만둔다');assert.equal(await page.evaluate(()=>G.Game.state.fleet.ships[0].sailColor),'#e04a8b');await page.evaluate(()=>{G.Game.state.player.gold=window.__rich;});
  report.save=await page.evaluate(async()=>{await G.State.saveAsync(98);const r=G.State.load(98);return{color:r.fleet.ships[0].sailColor,type:r.fleet.ships[0].type};});assert.equal(report.save.color,'#e04a8b');
  report.scenes=await page.evaluate(()=>{
   const s=G.Game.state,old=G.Ship3D.draw,draws=[];let phase='sea';G.Ship3D.draw=function(ctx,x,y,a,len,spec,t){draws.push({phase,type:spec.type,color:spec.sailColor||null});return old.apply(this,arguments);};
   try{G.Game.go('sea',{depart:0,fresh:true});const st=G.Scenes.sea.runtime();st.paused=true;st.manual=true;st.npcs=[];s.loc.lon=-13;s.loc.lat=36;st.cam.lon=-13;st.cam.lat=36;for(let i=0;i<6;i++)G.Scenes.sea.update(0);
    phase='battle';G.Game.go('battle',{npc:{kind:'pirate',zone:'atl',n:1,ships:['sloop']}});G.Scenes.battle.runtime().paused=true;G.Scenes.battle.runtime().cameraMode='overview';G.Scenes.battle.update(0);
    const snap=G.Scenes.battle.snapshot();phase='restored';G.Game.go('battle',{battle:JSON.parse(JSON.stringify(snap))});G.Scenes.battle.runtime().cameraMode='overview';G.Scenes.battle.update(0);
   }finally{G.Ship3D.draw=old;G.Game.go('city',{cityId:0});}return draws;
  });
  for(const p of ['sea','battle','restored'])assert(report.scenes.some(d=>d.phase===p&&d.type==='sloop'&&d.color==='#e04a8b'),p+' 염색 연결');
  await openDye();await page.locator('[data-dye="0"]').click();await finishDye('이 색으로 적용');assert.equal(await page.evaluate(()=>G.Game.state.fleet.ships[0].sailColor),undefined);
  // 구입의 실제 처리 경로를 통과하되, 대화 입력만 자동으로 대답한다.
  report.buy=await page.evaluate(async ids=>{
   const s=G.Game.state,Y=G.Scenes.city.B.shipyard,UI=G.UI,C=G.Scenes.city,keep={window:UI.window,choose:UI.choose,confirm:UI.confirm,prompt:UI.prompt,help:Y.shipHelp,say:C.say},result=[];
   try{UI.choose=async()=>0;UI.confirm=async()=>true;UI.prompt=async()=> '새 배';C.say=async()=>{};
    for(const id of ids){const c=G.CITY_DATA.find(c=>c&&c.port&&Y.types(c).includes(id));s.fleet.ships=[G.R.newShip('caravel','검사 기함')];s.player.gold=10000000;
     Y.shipHelp=async()=> 'buy';UI.window=opts=>{const fake=document.createElement('div');fake.innerHTML=opts.html;opts.onBuild(fake,{close:()=>{}});fake.querySelector('[data-id="'+id+'"]').click();return{result:Promise.resolve('pick')};};
     await Y.buy(c);if(!s.fleet.ships.some(sh=>sh.type===id))throw Error(id+' 구입 실패');result.push(id);
    }
   }finally{UI.window=keep.window;UI.choose=keep.choose;UI.confirm=keep.confirm;UI.prompt=keep.prompt;Y.shipHelp=keep.help;C.say=keep.say;}return result;
  },IDS);
  assert.equal(report.buy.length,9);await page.evaluate(()=>G.Game.go('title'));assert.deepStrictEqual(errors,[]);
  report.errors=errors;if(fs.existsSync(path.join(OUT,'failure.json')))fs.unlinkSync(path.join(OUT,'failure.json'));fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('9종 판매/연도/구입 · 염색 UI/취소/직접색/잔액/복원 · 실제 저장 · 항해/해전/해전 복원 통과 · 콘솔 오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.stack,errors,report},null,2));throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
