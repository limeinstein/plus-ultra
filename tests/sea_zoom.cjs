/* 실제 항해의 확대 입력·선박 픽셀 크기·36종 근접 보기·기본 크기 보존 검사. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU==='1',OUT=path.join(ROOT,'artifacts/sea-zoom-20261031',GPU?'gpu':'software');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[],report={mode:GPU?'GPU':'SwiftShader',levels:[],ships:[]};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;window.__gls=[];const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(type==='webgl2'&&gl&&!window.__gls.includes(gl))window.__gls.push(gl);return gl;};});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>G.Game&&G.State&&G.Img.count()>0,null,{timeout:90000});await page.evaluate(()=>G.Game.ensureGeo());
  await page.evaluate(()=>{
   const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);sk.nav=2;
   const s=G.State.newGame({name:'선박 확대 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:50,int:50,mar:50,cha:50},sk,lg:G.LANGS.map(()=>0),diff:'normal'});
   s.settings.res=.35;G.Game.state=s;G.Game.go('sea',{depart:0,fresh:true});
   const st=G.Scenes.sea.runtime();st.paused=true;st.manual=true;st.npcs=[];st.furl=0;st.t=1.25;st.rig={fill:.9,brace:0,lee:1};
   s.fleet.ships=[G.R.newShip('galleon')];s.loc.lon=-13;s.loc.lat=36;s.loc.heading=-.5;st.cam.lon=-13;st.cam.lat=36;st.cam.zoom=110;
   window.__draws=[];window.__captures=[];window.__capture=false;
   const draw=G.Ship3D.draw;
   G.Ship3D.draw=function(ctx,x,y,a,len,spec,t){
    const image=ctx.drawImage;
    if(window.__capture&&spec.sid==='f0')ctx.drawImage=function(cv,dx,dy,dw,dh){
     const copy=document.createElement('canvas');copy.width=cv.width;copy.height=cv.height;const c=copy.getContext('2d',{willReadFrequently:true});c.drawImage(cv,0,0);
     const data=c.getImageData(0,0,copy.width,copy.height).data;let left=copy.width,right=-1,top=copy.height,bottom=-1,count=0;
     for(let py=0;py<copy.height;py++)for(let px=0;px<copy.width;px++){if(data[(py*copy.width+px)*4+3]>60){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);count++;}}
     window.__captures.push({id:spec.type,len,zoom:st.cam.zoom,x:dx+left/copy.width*dw,y:dy+top/copy.height*dh,width:(right-left+1)/copy.width*dw,height:(bottom-top+1)/copy.height*dh,source:copy.width,count,canvas:copy,crop:[left,top,right-left+1,bottom-top+1]});
     return image.apply(this,arguments);
    };
    const saved=JSON.stringify(G.Game.state);let ok;try{ok=draw.apply(this,arguments);}finally{ctx.drawImage=image;}
    window.__draws.push({id:spec.type,sid:spec.sid,x,y,len,ok,unchanged:saved===JSON.stringify(G.Game.state)});return ok;
   };
   window.__frame=function(capture){window.__draws=[];window.__captures=[];window.__capture=!!capture;for(let i=0;i<3;i++)G.Scenes.sea.update(0);window.__capture=false;return {draws:window.__draws.slice(),stats:G.Ship3D.stats(),capture:window.__captures.length?Object.assign({},window.__captures.at(-1),{canvas:undefined}):null};};
   window.__thumbs=[];
  });
  console.log('항해 준비 완료');
  // 과거 기본 렌더 설정과 크기가 같은지 실제 픽셀을 비교한다.
  report.before=await page.evaluate(()=>{const c=G.FX.ship3d,save={minBuffer:c.minBuffer,maxBuffer:c.maxBuffer,supersample:c.supersample,shadowMinLen:c.shadowMinLen};Object.assign(c,{minBuffer:192,maxBuffer:768,supersample:1.5,shadowMinLen:100});const r=window.__frame(true);Object.assign(c,save);return r;});
  await page.screenshot({path:path.join(OUT,'default-before.png')});
  for(const zoom of [26,110,420,1200,2400]){
   const r=await page.evaluate(zoom=>{const st=G.Scenes.sea.runtime();st.cam.zoom=zoom;st.cam.zoomT=0;const r=window.__frame(true);return {...r,zoom};},zoom);
   assert(r.draws.every(d=>d.ok));assert(r.capture.count>0);report.levels.push(r);
   await page.screenshot({path:path.join(OUT,`zoom-${zoom}.png`)});console.log(`지도 ${zoom}: 선체 입력 ${r.capture.len.toFixed(1)}, 실제 그림 ${r.capture.width.toFixed(1)}×${r.capture.height.toFixed(1)}`);
  }
  const sizes=report.levels.map(r=>r.capture.width);for(let i=1;i<sizes.length;i++)assert(sizes[i]>sizes[i-1]*1.3,'확대할 때 선박이 커져야 함');
  assert.equal(report.levels[1].capture.len,66,'기본 기함 크기 유지');assert(Math.abs(report.levels[1].capture.width-report.before.capture.width)<3,'기본 실루엣 유지');
  // 36종을 본편의 실제 기함 자리에서 최대 확대. 이미지 경계 잘림과 저장 변경을 함께 확인한다.
  const ids=await page.evaluate(()=>G.ShipModels.ids);
  for(const id of ids){
   const row=await page.evaluate(id=>{const s=G.Game.state,st=G.Scenes.sea.runtime();s.fleet.ships=[G.R.newShip(id)];s.loc.heading=-.5;st.furl=0;st.pose={};st.cam.zoom=2400;st.cam.zoomT=0;const r=window.__frame(true),cap=window.__captures.at(-1);window.__thumbs.push(cap);return r;},id);
   assert(row.draws.every(d=>d.ok&&d.unchanged),id);const b=row.capture;assert(b.x>0&&b.y>0&&b.x+b.width<1600&&b.y+b.height<900,`${id} 화면 경계 잘림: ${JSON.stringify(b)}`);report.ships.push(row);
   if(['galleon','lgalleon','geobukseon'].includes(id))await page.screenshot({path:path.join(OUT,`${id}-close.png`)});
   console.log(`근접 ${report.ships.length}/36 ${id}`);
  }
  const grid=await page.evaluate(()=>{const cv=document.createElement('canvas');cv.width=1800;cv.height=1800;const ctx=cv.getContext('2d');ctx.fillStyle='#193b48';ctx.fillRect(0,0,1800,1800);window.__thumbs.forEach((b,i)=>{const x=i%6*300,y=Math.floor(i/6)*300,k=Math.min(276/b.crop[2],255/b.crop[3]);ctx.drawImage(b.canvas,...b.crop,x+(300-b.crop[2]*k)/2,y+15,b.crop[2]*k,b.crop[3]*k);ctx.fillStyle='#eee5cc';ctx.font='18px sans-serif';ctx.fillText(G.SHIP[b.id].name,x+12,y+288);});return cv.toDataURL().split(',')[1];});fs.writeFileSync(path.join(OUT,'all36-close.png'),Buffer.from(grid,'base64'));
  // 실제 DOM 입력을 거쳐 목표 배율과 표시 길이가 함께 증가/감소한다.
  await page.evaluate(()=>{G.Game.state.fleet.ships=[G.R.newShip('galleon')];const st=G.Scenes.sea.runtime();st.cam.zoom=110;st.cam.zoomT=0;st.busy=0;});
  await page.mouse.move(1000,420);await page.mouse.wheel(0,-120);await page.waitForFunction(()=>G.Scenes.sea.runtime().cam.zoomT>110);
  report.wheel=await page.evaluate(()=>{const st=G.Scenes.sea.runtime();const target=st.cam.zoomT;G.Scenes.sea.update(.1);return {target,zoom:st.cam.zoom,len:window.__frame().draws.at(-1).len};});assert(report.wheel.zoom>110&&report.wheel.len>66);
  await page.keyboard.press('Equal');report.key=await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT);assert(report.key>report.wheel.target);
  await page.getByRole('button',{name:'선박을 가까이 보기',exact:true}).click();assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),2400);
  await page.getByRole('button',{name:'지도 확대',exact:true}).click();assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),2400);
  await page.getByRole('button',{name:'기본 배율로 돌아가기',exact:true}).click();assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),110);
  report.pinch=await page.evaluate(()=>{const el=document.querySelector('.mapcatch'),st=G.Scenes.sea.runtime();function touch(type,d){const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'touches',{value:type==='touchend'?[]:[{clientX:600,clientY:400},{clientX:600+d,clientY:400}]});el.dispatchEvent(e);}touch('touchstart',100);touch('touchmove',150);touch('touchend',0);return st.cam.zoomT;});assert.equal(report.pinch,165);
  await page.evaluate(()=>{const st=G.Scenes.sea.runtime();st.cam.zoom=26;st.cam.zoomT=0;});await page.keyboard.press('Minus');assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().cam.zoomT),26);
  // 기함·동행선·NPC가 같은 비율로 커지고, 확대 첫 프레임부터 대열 간격도 따라간다.
  report.fleet=await page.evaluate(()=>{const s=G.Game.state,st=G.Scenes.sea.runtime();s.fleet.ships=['galleon','geobukseon','lgalleon'].map(id=>G.R.newShip(id));st.npcs=[{id:'zoom-npc',kind:'merchant',ships:['cog'],n:1,lon:-12.85,lat:36.1,heading:.5,spd:0,nation:'PT'}];st.slotPos=[];const rows=[];for(const z of [110,420,2400,110]){st.cam.zoom=z;st.cam.zoomT=0;rows.push(window.__frame());}return rows;});
  for(let i=1;i<3;i++)for(const sid of ['f0','f1','f2','zoom-npc:0'])assert(report.fleet[i].draws.find(d=>d.sid===sid).len>report.fleet[i-1].draws.find(d=>d.sid===sid).len);
  for(const sid of ['f0','f1','f2','zoom-npc:0'])assert.equal(report.fleet[0].draws.find(d=>d.sid===sid).len,report.fleet[3].draws.find(d=>d.sid===sid).len);
  await page.evaluate(()=>{G.Scenes.sea.runtime().cam.zoom=2400;G.Scenes.sea.runtime().furl=0;window.__frame();});await page.screenshot({path:path.join(OUT,'fleet-close.png')});
  report.resources=await page.evaluate(()=>{const first=window.__frame().stats;for(let i=0;i<4;i++)window.__frame();return{first,last:G.Ship3D.stats(),contexts:window.__gls.length};});for(const k of ['geometries','textures','builds'])assert.equal(report.resources.first[k],report.resources.last[k]);
  report.exit=await page.evaluate(()=>{G.Scenes.sea.exit('city');return !G.Ship3D.stats().ready;});assert(report.exit);assert.deepStrictEqual(errors,[]);report.errors=errors;
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log('OK: 기본 크기 유지 · 확대 시 크기 증가 · 36종 · 휠/키/버튼/두 손가락 · 자원 안정 · 오류 0');
 }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
