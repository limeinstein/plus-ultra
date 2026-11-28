/* 돛 작업실: 실제 모양/도안, 캐시 격리·자원, 유료 개조·취소·저장·장면 연결. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let pw;try{pw=require('playwright');}catch(_){pw=require('../tools/procedural_art/node_modules/playwright-core');}
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.OUT||path.join(ROOT,'artifacts/sail-workshop-20261123');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await pw.chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],report={};
 try{
  const page=await browser.newPage({viewport:{width:1200,height:860}});await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  if(!process.argv.includes('--integration-only')){
   await page.goto(pathToFileURL(path.join(ROOT,'test_ships_3d.html')).href,{waitUntil:'domcontentloaded'});
   report.visual=await page.evaluate(()=>{
    const cv=document.createElement('canvas');cv.width=720;cv.height=560;const ctx=cv.getContext('2d'),out={shapes:[],patterns:[],fallback:[]};
    function hash(){const d=ctx.getImageData(0,0,720,560).data;let h=0,n=0;for(let i=0;i<d.length;i+=4){h=(Math.imul(h,31)+d[i]*3+d[i+1]*5+d[i+2]*7+d[i+3])|0;if(d[i+3])n++;}return{hash:h,n};}
    function draw(id,opt={},len=230){ctx.clearRect(0,0,720,560);const spec=G.Art.shipLook(id,Object.assign({rig:{fill:.9,brace:.14,lee:1},flag:'#315c99'},opt));if(!G.Ship3D.draw(ctx,360,450,.55,len,spec,1.25))throw Error(JSON.stringify(G.Ship3D.stats()));return hash();}
    // 실제로 그린 돛마다 위쪽은 주황, 아래쪽은 파랑인지 확인한다.
    const renderedSails=new Set(),meshProto=G.Three.Mesh.prototype,originalRender=meshProto.onBeforeRender;
    meshProto.onBeforeRender=function(...args){if(this.userData.sailKind)renderedSails.add(this);return originalRender.apply(this,args);};
    try{
     for(const shape of G.SAIL_SHAPES){
      renderedSails.clear();draw('galleon',{sailShape:shape.id,sailDesign:'nation_dutch'});
      if(!renderedSails.size)throw Error('삼색 돛 누락 '+shape.id);
      for(const mesh of renderedSails){
       const {position,uv}=mesh.geometry.attributes,map=mesh.material.map,canvas=map.image;
       const bands=[.15,.85].map(v=>{
        let idx=0,best=Infinity;
        for(let i=0;i<uv.count;i++){
         const dist=Math.abs(uv.getX(i)-.5)+Math.abs(uv.getY(i)-v);
         if(dist<best){best=dist;idx=i;}
        }
        const point=map.transformUv(new G.Three.Vector2().fromBufferAttribute(uv,idx));
        const [r,,b]=canvas.getContext('2d').getImageData(Math.floor(point.x*canvas.width),Math.floor(point.y*canvas.height),1,1).data;
        return {height:position.getY(idx),redMinusBlue:r-b};
       }).sort((a,b)=>b.height-a.height);
       if(bands[0].redMinusBlue<=0||bands[1].redMinusBlue>=0)throw Error('거꾸로 된 문양 '+shape.id+' '+mesh.userData.sailKind);
      }
     }
    }finally{meshProto.onBeforeRender=originalRender;}
    let original=draw('galleon').hash;
    for(const shape of G.SAIL_SHAPES){const h=draw('galleon',{sailShape:shape.id}).hash,ship=G.ShipModels.create(G.Three,'galleon',{sailShape:shape.id}),hull=ship.buildHull(),rig=G.ShipModels.makeRig(ship,G.Three,g=>g,G.FX.ship3d);
     for(const furl of [0,.5,1])for(const lee of [-1,1]){rig.update({furl,rig:{brace:lee*.6,fill:.9,lee}},2);for(const a of rig.sails)if(!Array.from(a.mesh.geometry.attributes.position.array).every(Number.isFinite))throw Error('돛 좌표 '+shape.id);}
     out.shapes.push({id:shape.id,hash:h,kinds:rig.sails.map(a=>a.kind)});
     const geos=new Set(),mats=new Set(),maps=new Set();[hull,rig.root].forEach(g=>g.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);}));mats.forEach(m=>{Object.values(m).forEach(t=>{if(t&&t.isTexture)maps.add(t);});m.dispose();});maps.forEach(t=>t.dispose());geos.forEach(g=>g.dispose());
    }
    // 모형 재생성과 첫 그림자 그리기를 마친 뒤 같은 모형에서 원래 천 복원을 비교한다.
    draw('galleon');original=draw('galleon').hash;
    for(const id of ['stripes','nation_portugal','nation_france','royal_habsburg','noble_medici','pirate_skull'])out.patterns.push({id,...draw('galleon',{sailDesign:id})});
    out.restored=draw('galleon').hash;out.original=original;
    draw('galleon',{sailDesign:'pirate_skull'});out.memoryBefore=G.Ship3D.stats();for(let i=0;i<20;i++)draw('galleon',{sailDesign:i%2?'noble_medici':'stripes',sailColor:i%3?'#435d87':null});out.memoryAfter=G.Ship3D.stats();
    // 같은 선종을 한 프레임에서 번갈아 그려도 다른 배의 문양이 남지 않는다.
    G.Ship3D.beginFrame();const a=draw('galleon',{sailDesign:'royal_habsburg'}).hash,b=draw('galleon',{sailDesign:'pirate_skull'}).hash,c=draw('galleon',{sailDesign:'royal_habsburg'}).hash;G.Ship3D.endFrame();out.isolation={a,b,c};
    const reuseMs=G.FX.ship3d.reuseMs;G.FX.ship3d.reuseMs=100000;
    const cachePlain=draw('galleon',{sid:'workshop-cache'}).hash,cacheRoyal=draw('galleon',{sid:'workshop-cache',sailDesign:'royal_habsburg'}).hash,cacheBlue=draw('galleon',{sid:'workshop-cache',sailDesign:'royal_habsburg',sailColor:'#435d87'}).hash,cacheInk=draw('galleon',{sid:'workshop-cache',sailDesign:'royal_habsburg',sailColor:'#435d87',sailInk:'#b12b32'}).hash;
    G.FX.ship3d.reuseMs=reuseMs;out.cacheInvalidation=[cachePlain,cacheRoyal,cacheBlue,cacheInk];
    for(const id of ['galleon','caravel','junk','jounseon','bezaisen','ghurab']){function fallback(design){ctx.clearRect(0,0,720,560);G.Art.shipSide(ctx,360,450,1.6,G.Art.shipLook(id,{sailDesign:design}),G.U.makeRng(1),1);return hash().hash;}out.fallback.push({id,plain:fallback('plain'),pattern:fallback('nation_portugal')});}
    const atlas=document.createElement('canvas');atlas.width=1800;atlas.height=1440;const ax=atlas.getContext('2d');
    const samples=[['galleon','nation_portugal','native'],['shipline','royal_habsburg','native'],['eastindiaman','nation_france','native'],['sloop','stripes','gaff'],['bezaisen','noble_takeda','native'],['jounseon','royal_joseon','native'],['ghurab','pirate_red','sq'],['padewakang','noble_mori','tanja'],['junk','royal_qing','native']];
    samples.forEach(([id,design,shape],i)=>{const x=i%3*600,y=Math.floor(i/3)*480;draw(id,{sailDesign:design,sailShape:shape},320);ax.fillStyle='#193b4b';ax.fillRect(x,y,600,480);ax.drawImage(cv,0,0,720,560,x,y,600,466);ax.fillStyle='#f2e5cb';ax.font='22px sans-serif';ax.fillText(G.SHIP[id].name+' · '+G.SailDesign.design(design).name,x+18,y+32,565);});out.image=atlas.toDataURL();return out;
   });
   const v=report.visual;fs.writeFileSync(path.join(OUT,'sail-designs.png'),Buffer.from(v.image.split(',')[1],'base64'));delete v.image;
   assert.equal(new Set(v.shapes.map(x=>x.hash)).size,6,'6가지 범장');assert.equal(v.original,v.restored,'원래 천·범장 복원');assert.equal(new Set(v.patterns.map(x=>x.hash)).size,6,'도안 구별');
   assert.equal(v.memoryBefore.geometries,v.memoryAfter.geometries);assert.equal(v.memoryBefore.textures,v.memoryAfter.textures,'문양 변경 때 텍스처 증가');assert.equal(v.isolation.a,v.isolation.c);assert.notEqual(v.isolation.a,v.isolation.b);
   assert.equal(new Set(v.cacheInvalidation).size,4,'항해 그림 캐시가 도안·바탕색·문양색을 구별');
   v.fallback.forEach(x=>assert.notEqual(x.plain,x.pattern,x.id+' 2D 문양'));
   console.log('6가지 범장 · 국가/왕실/가문/해적 · 같은 선종 격리 · 2D 대체 · 반복 문양 자원 검사 통과');
   if(process.argv.includes('--visual-only')){fs.writeFileSync(path.join(OUT,'visual-report.json'),JSON.stringify(report,null,2));return;}
  }
  await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href),{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>G.Scenes.city.B.shipyard.sailWorkshop,null,{timeout:90000});await page.evaluate(()=>G.Game.ensureGeo());
  report.setup=await page.evaluate(()=>{const s=G.State.newGame({name:'돛 작업실 검사',nation:'PT',job:'explorer',age:25,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});G.Game.state=s;s.settings.res=.35;s.settings.music=0;s.settings.sound=0;s.date.y=1670;s.player.gold=1000000;s.fleet.ships=[G.R.newShip('sloop','작업실'),G.R.newShip('geobukseon','거북선')];s.fleet.crew=80;G.Game.go('city',{cityId:0});return{designs:G.SAIL_DESIGNS.length,groups:Object.fromEntries(Object.keys(G.SAIL_DESIGN_GROUPS).map(k=>[k,G.SAIL_DESIGNS.filter(d=>d.group===k).length])),uncovered:Object.keys(G.NATION_COLORS).filter(n=>!G.SAIL_DESIGNS.some(d=>d.id==='nation:'+n)&&!['포르투갈','에스파냐','카스티야','아라곤','잉글랜드','영국','스코틀랜드','프랑스','네덜란드','덴마크','스웨덴','베네치아','제노바','교황령','러시아','모스크바 대공국','폴란드','조선','명','남명','청','후금','일본','오스만 제국'].includes(n))};});assert.equal(report.setup.uncovered.length,0);
  async function open(i=0){await page.evaluate(i=>{window.__work=G.Scenes.city.B.shipyard.sailWorkshop(G.CITY_DATA[0],G.Game.state.fleet.ships[i]);},i);await page.locator('.sail-work-preview').waitFor();}
  async function choose(group,id){await page.locator('[data-sail-group="'+group+'"]').click();await page.locator('.work-list').selectOption(id);}
  async function finish(name){await page.getByRole('button',{name,exact:true}).click();await page.evaluate(()=>window.__work);}
  const initial=await page.evaluate(()=>JSON.stringify(G.Game.state.fleet.ships[0],(k,v)=>k==='_row'?undefined:v));await open();await choose('royal','royal_habsburg');await page.locator('.work-shape').selectOption('sq');await finish('그만둔다');assert.equal(await page.evaluate(()=>JSON.stringify(G.Game.state.fleet.ships[0],(k,v)=>k==='_row'?undefined:v)),initial,'취소는 배 불변');
  await open();await choose('royal','royal_habsburg');await page.locator('.work-shape').selectOption('sq');await page.locator('.work-base').evaluate(el=>{el.value='#435d87';el.dispatchEvent(new Event('input',{bubbles:true}));});
  report.quote=await page.evaluate(()=>G.SailDesign.quote(G.CITY_DATA[0],G.Game.state.fleet.ships[0],{sailShape:'sq',sailDesign:'royal_habsburg',sailColor:'#435d87'}));assert(report.quote.total>30000);await page.screenshot({path:path.join(OUT,'workshop.png')});
  await page.setViewportSize({width:640,height:360});const box=await page.getByRole('button',{name:'개조한다',exact:true}).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=641&&box.y+box.height<=361,'작은 화면 적용 단추');await page.screenshot({path:path.join(OUT,'workshop-small.png')});await page.setViewportSize({width:1200,height:860});await finish('개조한다');
  const bought=await page.evaluate(()=>({sh:G.Game.state.fleet.ships[0],gold:G.Game.state.player.gold}));assert.equal(bought.sh.sailDesign,'royal_habsburg');assert.equal(bought.sh.sailShape,'sq');assert(bought.sh.sails.every(k=>k==='sq'));assert.equal(bought.gold,1000000-report.quote.total);
  await open();await finish('개조한다');assert.equal(await page.evaluate(()=>G.Game.state.player.gold),bought.gold,'동일 설정은 무료');
  await page.evaluate(()=>{window.__gold=G.Game.state.player.gold;G.Game.state.player.gold=0;});await open();await choose('noble','noble_medici');await page.getByRole('button',{name:'개조한다',exact:true}).click();assert.equal(await page.locator('.sail-work-preview').count(),1);assert.equal(await page.evaluate(()=>G.Game.state.fleet.ships[0].sailDesign),'royal_habsburg');await finish('그만둔다');await page.evaluate(()=>G.Game.state.player.gold=window.__gold);
  report.rules=await page.evaluate(()=>{const s=G.Game.state,D=G.SailDesign,c=G.CITY_DATA[0],sh=s.fleet.ships[0],turtle=s.fleet.ships[1],out={};
   const foreign=G.R.newShip('sloop','남의 배');out.foreign=D.apply(c,foreign,{sailDesign:'pirate_skull'}).ok;sh.loan='test';out.loan=D.apply(c,sh,{sailDesign:'pirate_skull'}).ok;delete sh.loan;
   out.turtleShape=D.apply(c,turtle,{sailShape:'gaff'}).ok;out.turtlePattern=D.apply(c,turtle,{sailDesign:'royal_joseon'}).ok;
   const moored=G.R.newShip('caravel','계류 배');G.Scenes.city.B.harbor.moored(c).push(moored);out.moored=D.apply(c,moored,{sailDesign:'noble_tokugawa'}).ok;
   // 옛 개별 범장은 문양만 바꿀 때 유지한다. 원래 범장 복원은 명시적으로 선택하고 비용을 낸다.
   const legacy=G.R.newShip('galleon','옛 개조');s.fleet.ships.push(legacy);legacy.sails=legacy.sails.map(()=> 'lat');const old=legacy.sails.join();out.legacyPattern=D.apply(c,legacy,{sailDesign:'nation_portugal'}).ok&&legacy.sails.join()===old;out.legacyRestore=D.apply(c,legacy,{sailDesign:'nation_portugal',sailShape:'native',sailReset:true}).cost>0&&legacy.sails.join()===G.SHIP.galleon.sails.join();s.fleet.ships.pop();
   out.shapeRestore=D.apply(c,sh,Object.assign({},sh,{sailShape:'native'})).ok&&sh.sails.join()===G.SHIP.sloop.sails.join();
   out.final=D.apply(c,sh,{sailShape:'gaff',sailDesign:'pirate_red',sailColor:'#eee3c8',sailInk:'#b12b32'});return out;});
  assert.equal(report.rules.foreign,false);assert.equal(report.rules.loan,false);assert.equal(report.rules.turtleShape,false);for(const k of ['turtlePattern','moored','legacyPattern','legacyRestore','shapeRestore'])assert(report.rules[k],k);assert(report.rules.final.ok);
  report.save=await page.evaluate(async()=>{await G.State.saveAsync(98);const saved=G.State.load(98);G.Game.state=saved;return G.SailDesign.clean(saved.fleet.ships[0]);});assert.deepStrictEqual(report.save,{shape:'gaff',design:'pirate_red',ink:'#b12b32',color:'#eee3c8'});
  report.scenes=await page.evaluate(()=>{const s=G.Game.state,old=G.Ship3D.draw,out=[];let phase='sea';G.Ship3D.draw=function(ctx,x,y,a,len,spec,t){out.push({phase,type:spec.type,...G.SailDesign.clean(spec)});return old.apply(this,arguments);};try{G.Game.go('sea',{depart:0,fresh:true});const st=G.Scenes.sea.runtime();st.paused=true;st.manual=true;st.npcs=[];s.loc.lon=-13;s.loc.lat=36;st.cam.lon=-13;st.cam.lat=36;for(let i=0;i<6;i++)G.Scenes.sea.update(0);phase='battle';G.Game.go('battle',{npc:{kind:'pirate',zone:'atl',n:1,ships:['sloop']}});G.Scenes.battle.runtime().paused=true;G.Scenes.battle.runtime().cameraMode='overview';G.Scenes.battle.update(0);const snap=G.Scenes.battle.snapshot();phase='restored';G.Game.go('battle',{battle:JSON.parse(JSON.stringify(snap))});G.Scenes.battle.runtime().cameraMode='overview';G.Scenes.battle.update(0);}finally{G.Ship3D.draw=old;G.Game.go('title');}return out;});
  for(const phase of ['sea','battle','restored'])assert(report.scenes.some(r=>r.phase===phase&&r.type==='sloop'&&r.shape==='gaff'&&r.design==='pirate_red'&&r.ink==='#b12b32'&&r.color==='#eee3c8'),phase+' 연결');
  assert.deepStrictEqual(errors,[]);report.errors=errors;if(fs.existsSync(path.join(OUT,'failure.json')))fs.unlinkSync(path.join(OUT,'failure.json'));fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('작업실 UI/미리보기/취소/고가 결제/동일 설정/잔액/소유권/계류/원래 범장 · 저장 · 항해/해전/복원 통과 · 콘솔 오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.stack,errors,report},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
