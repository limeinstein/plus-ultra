/* 실제 상세 감상 화면: 36종 부품·망루 승강구·자원 해제·확대·회전·장치 복구. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU!=='0',OUT=path.join(ROOT,'artifacts/craft3d-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[],report={ships:[]};try{
  const page=await browser.newPage({viewport:{width:1380,height:980}});await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__contexts=0;const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(type==='webgl2'&&gl){window.__contexts++;window.__gl=gl;}return gl;};});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'test_ship_details.html')).href);assert.deepStrictEqual(errors,[]);
  const ids=await page.evaluate(()=>G.ShipModels.ids),before=await page.evaluate(()=>JSON.stringify(G.SHIP_TYPES));assert.equal(ids.length,36);
  for(const id of ids){
   const result=await page.evaluate(id=>{
    const T=G.Three,ship=G.ShipModels.create(T,id),hull=ship.buildHull(),rig=G.ShipModels.makeRig(ship,T,g=>g,G.FX.ship3d),root=new T.Group();root.add(hull,rig.root);root.updateMatrixWorld(true);
    const roles={},tops=[];let deadeyes=0;
    root.traverse(o=>{const role=o.userData.craftRole||o.userData.turtleRole;if(role)roles[role]=(roles[role]||0)+1;if(o.userData.rigTop)tops.push(o);if(o.userData.rigDeadeye)deadeyes++;if(o.geometry&&!Array.from(o.geometry.attributes.position.array).every(Number.isFinite))throw Error(id+' 좌표 오류');});
    if(!Object.keys(roles).length)throw Error(id+' 세부 부품 누락');
    const f=G.FX.shipArt.profiles[id].family;if(f==='west'&&!deadeyes)throw Error(id+' 도르래 누락');if(f==='junk'&&deadeyes)throw Error(id+' 서양식 버팀줄 잘못 추가');
    if(id==='panokseon'&&(!roles['pavilion-canopy']||!roles['pavilion-post']))throw Error('판옥선 열린 장대 누락');
    for(const top of tops){let floor;top.traverse(o=>{if(o.userData.topHatch)floor=o;});if(!floor)throw Error(id+' 실제 승강구 누락');const h=floor.userData.topHatch,origin=top.localToWorld(new T.Vector3((h.x0+h.x1)/2,3,0)),dir=new T.Vector3(0,-1,0).transformDirection(top.matrixWorld),hit=new T.Raycaster(origin,dir).intersectObject(top,true)[0];
      if(hit&&top.worldToLocal(hit.point.clone()).y>.02)throw Error(id+' 승강구를 덮은 판재');
    }
    const geos=new Set(),mats=new Set(),tex=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});mats.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)tex.add(v);});m.dispose();});geos.forEach(g=>g.dispose());tex.forEach(t=>t.dispose());
    G.ShipInspection.select(id);G.ShipInspection.focus('whole');
    // 첫 노출 때 지연 업로드되는 자원까지 준비한 다음 반복 동작을 비교한다.
    for(const furl of [0,50,100]){document.getElementById('fold').value=furl;G.ShipInspection.render(1.25);}
    G.ShipInspection.focus('feature');G.ShipInspection.render(1.25);const initial=G.ShipInspection.stats();
    for(const furl of [0,50,100]){document.getElementById('fold').value=furl;document.getElementById('brace').value=furl===50?-60:60;G.ShipInspection.render(1.25);}
    document.getElementById('fold').value=0;document.getElementById('brace').value=0;G.ShipInspection.render(1.25);const after=G.ShipInspection.stats();if(initial.geometries!==after.geometries||initial.textures!==after.textures)throw Error(id+' 동작 중 자원 증가');
    return{row:{id,roles,deadeyes,tops:tops.length,stats:after},image:document.querySelector('canvas').toDataURL()};
   },id);
   report.ships.push(result.row);fs.writeFileSync(path.join(OUT,id+'-detail.png'),Buffer.from(result.image.split(',')[1],'base64'));
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(G.SHIP_TYPES)),before);assert.equal(await page.evaluate(()=>window.__contexts),1);
  await page.selectOption('#ship','galleon');await page.click('[data-view=mast]');await page.screenshot({path:path.join(OUT,'inspection-mast.png')});
  await page.selectOption('#ship','geobukseon');await page.click('[data-view=feature]');await page.screenshot({path:path.join(OUT,'inspection-dragon.png')});
  const prior=await page.evaluate(()=>document.querySelector('canvas').toDataURL());const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.55);await page.mouse.up();await page.mouse.wheel(0,-180);assert.notEqual(await page.evaluate(()=>document.querySelector('canvas').toDataURL()),prior);
  await page.evaluate(()=>{window.__loss=window.__gl.getExtension('WEBGL_lose_context');window.__loss.loseContext();});await page.waitForFunction(()=>G.ShipInspection.stats().lost,null,{polling:50});await page.evaluate(()=>window.__loss.restoreContext());await page.waitForFunction(()=>!G.ShipInspection.stats().lost,null,{polling:50});
  await page.selectOption('#ship','panokseon');await page.click('[data-view=feature]');await page.screenshot({path:path.join(OUT,'inspection-panokseon.png')});
  // 반복 선종 전환 뒤 같은 배가 유지하는 GPU 자원 수가 같은지 확인한다.
  report.stable=await page.evaluate(()=>{G.ShipInspection.select('galleon');const a=G.ShipInspection.stats();for(let i=0;i<3;i++)for(const id of ['geobukseon','baochuan','balsa','galleon'])G.ShipInspection.select(id);const b=G.ShipInspection.stats();return{before:a,after:b};});
  assert.equal(report.stable.before.geometries,report.stable.after.geometries);assert.equal(report.stable.before.textures,report.stable.after.textures);
  await page.evaluate(()=>G.ShipInspection.dispose());assert.deepStrictEqual(errors,[]);report.errors=errors;fs.writeFileSync(path.join(OUT,'inspection.json'),JSON.stringify(report,null,2));console.log('OK · 36종 상세 보기 · 실제 승강구 · 자원 안정 · 회전/확대 · 장치 복구 · 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
