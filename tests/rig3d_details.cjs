/* 범장 교정: 36종의 실제 천-선루 간섭, 망루 구조, 부착점, 확대 결과 검사. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU!=='0',OUT=path.join(ROOT,'artifacts/rig3d-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const errors=[];try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}});await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.join(ROOT,'test_ships_3d.html')).href);
  const result=await page.evaluate(()=>{
   const T=G.Three,report=[],images=[],before=JSON.stringify(G.SHIP_TYPES),models=G.ShipModels.ids;
   if(models.length!==36||Object.keys(G.FX.shipRig.profiles).length!==36)throw new Error('36종 범장 누락');
   function release(root){const geos=new Set(),mats=new Set(),tex=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});for(const m of mats){for(const k of ['map','bumpMap'])if(m[k])tex.add(m[k]);m.dispose();}geos.forEach(g=>g.dispose());tex.forEach(t=>t.dispose());}
   for(const id of models){
    const ship=G.ShipModels.create(T,id),all=new T.Group();all.add(ship.buildHull());const rig=G.ShipModels.makeRig(ship,T,g=>g,G.FX.ship3d);all.add(rig.root);
    let tops=0,posts=0,min=Infinity,checks=0,yardError=0;const spars=[];
    all.traverse(o=>{if(o.userData.rigTop)tops++;if(o.userData.topRailPost)posts++;if(o.userData.rigYardSpar)spars.push(o);});
    if((id==='galleon'&&tops!==2)||(id==='lgalleon'&&tops!==4))throw new Error('갤리온 망루 누락 '+id);
    if(tops&&posts<tops*12)throw new Error('망루 난간 누락 '+id);
    for(const furl of [0,.5,1])for(const brace of [-.65,0,.65]){
     rig.update({furl,rig:{brace,fill:1,lee:brace<0?-1:1}},1.25);all.updateMatrixWorld(true);
     for(const a of rig.sails){const p=a.mesh.geometry.attributes.position;
      if(a.kind==='square'){
       const uv=a.mesh.geometry.attributes.uv;
       for(let k=0;k<p.count;k++)if((uv.getX(k)===0||uv.getX(k)===1)&&(uv.getY(k)===0||(a.mesh.userData.squareBoom&&uv.getY(k)===1))){
        const v=new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(a.mesh.matrixWorld);let nearest=Infinity;
        for(const spar of spars){const ht=spar.geometry.parameters.height,line=new T.Line3(new T.Vector3(0,-ht/2,0).applyMatrix4(spar.matrixWorld),new T.Vector3(0,ht/2,0).applyMatrix4(spar.matrixWorld));nearest=Math.min(nearest,line.closestPointToPoint(v,true,new T.Vector3()).distanceTo(v));}
        yardError=Math.max(yardError,nearest);if(nearest>.8)throw new Error('돛과 활대 분리 '+id+' '+nearest);
       }
      }
      for(let k=0;k<p.count;k+=3){const v=new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(a.mesh.matrixWorld);
       if(!Number.isFinite(v.x+v.y+v.z))throw new Error('비정상 좌표 '+id);
       if(ship.rigDeckTop&&Math.abs(v.x)<ship.s.L*.46){const u=ship.h.U(v.x,ship.h.H),width=ship.h.half(u,ship.h.H);
        if(Math.abs(v.z)<width*.82){const d=v.y-ship.rigDeckTop(v.x,0);min=Math.min(min,d);checks++;if(d<-.4)throw new Error('돛/선루 간섭 '+id+' '+JSON.stringify({furl,brace,v,d}));}
       }
      }
     }
    }
    report.push({id,masts:ship.s.masts.length,sails:rig.sails.length,tops,posts,checks,yardError,minClearance:Number.isFinite(min)?min:null});
    if(id==='galleon'||id==='lgalleon'){
     rig.update({furl:0,rig:{brace:0,fill:1}},1.25);all.updateMatrixWorld(true);
     const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,900);renderer.setClearColor('#17323f');renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
     const scene=new T.Scene();scene.add(all,new T.HemisphereLight(0xe9f1f7,0x524333,.95));const light=new T.DirectionalLight(0xffe4be,1.8);light.position.set(-80,160,100);scene.add(light);
     const nests=[];all.traverse(o=>{if(o.userData.rigTop)nests.push(o);});const nest=nests[id==='galleon'?1:2],box=new T.Box3().setFromObject(nest),target=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()),span=Math.max(size.x,size.y,size.z)*1.2;
     const cam=new T.OrthographicCamera(-span*1.22,span*1.22,span,-span,.1,1000);cam.position.copy(target).add(new T.Vector3(-28,18,35));cam.lookAt(target);renderer.render(scene,cam);images.push({name:id+'-top',data:renderer.domElement.toDataURL()});renderer.dispose();renderer.forceContextLoss();
     const cv=document.createElement('canvas');cv.width=1400;cv.height=1100;const ctx=cv.getContext('2d');ctx.fillStyle='#193747';ctx.fillRect(0,0,1400,1100);
     if(!G.Ship3D.draw(ctx,700,870,-.55,630,{type:id,furl:0,rig:{fill:1,brace:.08},flag:'#8d3033'},1.25))throw new Error('확대 표시 실패 '+id);
     images.push({name:id+'-hero',data:cv.toDataURL()});
    }
    release(all);
   }
   if(before!==JSON.stringify(G.SHIP_TYPES))throw new Error('배 성능 자료 변경');
   return{report,images};
  });
  for(const im of result.images)fs.writeFileSync(path.join(OUT,im.name+'.png'),Buffer.from(im.data.split(',')[1],'base64'));
  assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(OUT,'details.json'),JSON.stringify({ships:result.report,errors},null,2));
  console.log('OK · 36종 천-선루 간섭 · 갤리온 망루 · 게임 자료 불변 · 콘솔 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
