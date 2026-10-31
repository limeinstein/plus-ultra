/* 거북선 사진 보강: 용두 형태·돛 지붕 간섭·횡방향 활대·양쪽 바람·확대 화면 검사. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU!=='0',OUT=path.join(ROOT,'artifacts/turtle3d-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[];try{
  const page=await browser.newPage({viewport:{width:1320,height:1120}});await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'test_ships_3d.html')).href);
  const result=await page.evaluate(()=>{
   const T=G.Three,before=JSON.stringify(G.SHIP_TYPES),ship=G.ShipModels.create(T,'geobukseon'),hull=ship.buildHull(),rig=G.ShipModels.makeRig(ship,T,g=>g,G.FX.ship3d),all=new T.Group();all.add(hull,rig.root);
   const roles={};all.traverse(o=>{if(o.userData.turtleRole)(roles[o.userData.turtleRole]||(roles[o.userData.turtleRole]=[])).push(o);if(o.geometry&&!Array.from(o.geometry.attributes.position.array).every(Number.isFinite))throw new Error('유한하지 않은 좌표');});
   if(!roles['dragon-head']||!roles['upper-jaw']||!roles['lower-jaw']||roles.eye.length!==2||roles.horn.length!==2||roles.tooth.length<12)throw new Error('용머리 필수 형태 누락');
   const roof=new T.Box3().setFromObject(roles.roof[0]),report={masts:ship.s.masts,roofTop:roof.max.y,sailCount:rig.sails.length,sailChecks:[],roles:Object.fromEntries(Object.entries(roles).map(([k,v])=>[k,v.length]))};
   all.updateMatrixWorld(true);report.mouthRays=[];
   for(const y of [.7,1.2])for(const z of [-.7,0,.7]){
    const head=roles['dragon-head'][0],from=head.localToWorld(new T.Vector3(20,y,z)),direction=new T.Vector3(-1,0,0).transformDirection(head.matrixWorld),hit=new T.Raycaster(from,direction).intersectObject(roles.dragon[0],true)[0];
    const local=hit&&head.worldToLocal(hit.point.clone());
    if(!hit||local.x>1.0)throw new Error('입 안을 가리는 부품: '+JSON.stringify({role:hit&&hit.object.userData.turtleRole,local}));report.mouthRays.push({y,z,firstHit:hit.object.userData.turtleRole,depth:7.2-local.x});
   }
   for(const furl of [0,.5,1])for(const brace of [-.7,0,.7])for(const lee of [-1,1]){
    rig.update({furl,rig:{brace,lee,fill:1}},1.25);all.updateMatrixWorld(true);
    for(const sail of rig.sails){const p=sail.mesh.geometry.attributes.position,b=new T.Box3();for(let i=0;i<p.count;i++)b.expandByPoint(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(sail.mesh.matrixWorld));
     const clearance=b.min.y-roof.max.y;if(clearance<3)throw new Error('돛이 지붕과 겹침: '+clearance);
     if(brace===0&&furl===0&&b.max.z-b.min.z<(b.max.x-b.min.x)*2)throw new Error('활대 방향 오류');
     report.sailChecks.push({furl,brace,lee,clearance});
    }
   }
   if(ship.s.masts.some(x=>Math.abs(x)>ship.s.L*.3))throw new Error('돛대가 선수/선미 끝에 치우침');
   const second=G.ShipModels.create(T,'geobukseon');if(JSON.stringify(second.s.masts)!==JSON.stringify(ship.s.masts)||JSON.stringify(G.SHIP_TYPES)!==before)throw new Error('공유 자료 변경');
   const cv=document.createElement('canvas');cv.width=1800;cv.height=1400;const ctx=cv.getContext('2d');
   const views=[{a:-.65,f:0},{a:-Math.PI/2,f:0},{a:0,f:0},{a:-.65,f:.5},{a:-.65,f:1},{a:2.4,f:0}];
   views.forEach((v,i)=>{ctx.save();ctx.translate(i%3*600,Math.floor(i/3)*700);ctx.fillStyle='#193747';ctx.fillRect(0,0,600,700);ctx.fillStyle='#ead9b8';ctx.font='22px sans-serif';ctx.fillText('거북선 · '+['선수','정면','측면','반 접기','접기','선미'][i],24,38);
    if(!G.Ship3D.draw(ctx,300,550,v.a,390,{type:'geobukseon',furl:v.f,rig:{fill:.95,brace:0,lee:1},flag:'#343e45'},1.25))throw new Error(JSON.stringify(G.Ship3D.stats()));ctx.restore();});
   const images=[{name:'turtle-views',data:cv.toDataURL()}];
   ctx.clearRect(0,0,1800,1400);cv.width=1200;cv.height=1000;ctx.fillStyle='#193747';ctx.fillRect(0,0,1200,1000);
   G.Ship3D.draw(ctx,600,800,-.65,620,{type:'geobukseon',furl:0,rig:{fill:.95,brace:.1,lee:1},flag:'#343e45'},1.25);images.push({name:'turtle-hero',data:cv.toDataURL()});
   // 게임에 사용하는 실제 용두를 근접 카메라로 촬영한다.
   const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(900,900);renderer.setClearColor('#193747');renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
   const scene=new T.Scene();scene.add(all);scene.add(new T.HemisphereLight(0xe9f1f7,0x524333,.95));const light=new T.DirectionalLight(0xffe4be,1.8);light.position.set(120,150,100);scene.add(light);
   const target=new T.Box3().setFromObject(roles.dragon[0]).getCenter(new T.Vector3()),cam=new T.OrthographicCamera(-15,15,15,-15,.1,1000);
   for(const v of [{name:'dragon-side',x:10,z:70},{name:'dragon-front',x:70,z:15}]){cam.position.copy(target).add(new T.Vector3(v.x,12,v.z));cam.lookAt(target);renderer.render(scene,cam);images.push({name:v.name,data:renderer.domElement.toDataURL()});}
   // 같은 실제 용두를 분리 촬영해 뿔·볼 조각·턱의 연결을 비스듬한 시점에서도 확인한다.
   const isolated=roles.dragon[0].clone(true);roles.dragon[0].matrixWorld.decompose(isolated.position,isolated.quaternion,isolated.scale);scene.add(isolated);all.visible=false;
   cam.position.copy(target).add(new T.Vector3(48,12,65));cam.lookAt(target);renderer.render(scene,cam);images.push({name:'dragon-quarter',data:renderer.domElement.toDataURL()});
   renderer.dispose();renderer.forceContextLoss();report.stats=G.Ship3D.stats();return{report,images};
  });
  for(const im of result.images)fs.writeFileSync(path.join(OUT,im.name+'.png'),Buffer.from(im.data.split(',')[1],'base64'));
  await page.evaluate(async()=>{await G.ShipPreview.select('geobukseon');document.getElementById('heading').value=320;document.getElementById('size').value=360;G.ShipPreview.render(1.25,1);});await page.waitForTimeout(200);await page.evaluate(()=>G.ShipPreview.render(1.25,1));await page.screenshot({path:path.join(OUT,'preview.png')});
  assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({...result.report,errors},null,2));console.log(JSON.stringify({sails:result.report.sailCount,minClearance:Math.min(...result.report.sailChecks.map(x=>x.clearance)),stats:result.report.stats}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
