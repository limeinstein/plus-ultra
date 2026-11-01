/* 항해 선박 36종의 실시간 3D. 한 그래픽 장치에서 보이는 선종을 재사용한다. */
(function(G){
  'use strict';
  var P=G.Ship3D={},rt=null,failure=null,failedTypes={};
  function cfg(){return G.FX.ship3d;}
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function release(root,keptTextures){
    var gs=new Set(),ms=new Set(),ts=new Set();
    root.traverse(function(o){if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});
    ms.forEach(function(m){Object.keys(m).forEach(function(k){if(m[k]&&m[k].isTexture)ts.add(m[k]);});});
    gs.forEach(function(g){g.dispose();});ts.forEach(function(t){if(!keptTextures||!keptTextures.has(t))t.dispose();});ms.forEach(function(m){m.dispose();});
  }
  function batch(root,T){
    root.updateMatrixWorld(true);var bins={},result=new T.Group(),im=new T.Matrix4(),world=new T.Matrix4(),originals=new Set();
    root.traverse(function(o){if(!o.isMesh)return;originals.add(o.geometry);
      var n=o.isInstancedMesh?o.count:1;
      for(var i=0;i<n;i++){
        var g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
        if(o.isInstancedMesh){o.getMatrixAt(i,im);world.multiplyMatrices(o.matrixWorld,im);}else world.copy(o.matrixWorld);
        g.applyMatrix4(world);var key=o.material.uuid,b=bins[key]||(bins[key]={mat:o.material,parts:[],n:0});b.parts.push(g);b.n+=g.attributes.position.count;
      }
    });
    Object.keys(bins).forEach(function(key){var b=bins[key],g=new T.BufferGeometry();
      ['position','normal','uv'].forEach(function(name){var size=name==='uv'?2:3,arr=new Float32Array(b.n*size),off=0;
        b.parts.forEach(function(p){var a=p.attributes[name];if(a)arr.set(a.array,off);off+=p.attributes.position.count*size;});g.setAttribute(name,new T.BufferAttribute(arr,size));
      });g.computeBoundingSphere();var m=new T.Mesh(g,b.mat);m.castShadow=m.receiveShadow=true;result.add(m);b.parts.forEach(function(p){p.dispose();});
    });originals.forEach(function(g){g.dispose();});return result;
  }
  function setup(){
    if(rt)return rt;if(failure||!G.Three||!G.ShipModels)return null;
    var T=G.Three,c=cfg(),renderer;
    try{
      var canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true});
      if(!gl){failure='WebGL2를 사용할 수 없습니다';return null;}
      renderer=new T.WebGLRenderer({canvas:canvas,context:gl,alpha:true,antialias:true});renderer.setPixelRatio(1);renderer.setSize(c.minBuffer,c.minBuffer,false);
      renderer.setClearColor(0,0);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=c.exposure;
      renderer.shadowMap.enabled=c.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.localClippingEnabled=true;
      var scene=new T.Scene(),theta=Math.asin(c.elevation),camera=new T.OrthographicCamera(-128,128,164,-92,1,4000);
      camera.position.set(0,Math.sin(theta)*1000,Math.cos(theta)*1000);camera.lookAt(0,0,0);
      var hemi=new T.HemisphereLight(0xddeaff,0x594532,c.skyLight);scene.add(hemi);
      var sun=new T.DirectionalLight(0xffecd1,c.sunLight);sun.position.set(-180,300,220);sun.castShadow=c.shadows;
      sun.shadow.mapSize.set(c.shadowSize,c.shadowSize);Object.assign(sun.shadow.camera,{left:-220,right:220,top:220,bottom:-180,near:10,far:800});sun.shadow.bias=-.0005;sun.shadow.normalBias=.25;scene.add(sun);scene.add(sun.target);
      var rim=new T.DirectionalLight(0xb7d8ff,c.rimLight);rim.position.set(220,100,-180);scene.add(rim);
      var yaw=new T.Group(),body=new T.Group();yaw.scale.y=.92/Math.cos(theta);yaw.add(body);scene.add(yaw);
      var state=rt={renderer:renderer,scene:scene,camera:camera,yaw:yaw,body:body,sun:sun,hemi:hemi,rim:rim,type:null,
        lost:false,buffer:c.minBuffer,frames:0,switches:0,builds:0,models:{},frame:0,inFrame:false,drawn:0,tint:new T.Color(),stats:{},span:c.span,anchor:c.anchorY};
      canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();state.lost=true;});
      canvas.addEventListener('webglcontextrestored',function(){state.lost=false;});return rt;
    }catch(e){failure=e.message;if(renderer)renderer.dispose();return null;}
  }
  function dropModel(r,id){
    var m=r.models[id];if(!m)return;
    // 정크·일본선 등의 지붕 지도는 다른 선종도 쓴다. 남아 있는 모형의 지도를 해제하지 않는다.
    var kept=new Set();Object.keys(r.models).forEach(function(other){if(other===id)return;r.models[other].body.traverse(function(o){if(o.material)Object.keys(o.material).forEach(function(k){var t=o.material[k];if(t&&t.isTexture)kept.add(t);});});});
    r.yaw.remove(m.body);release(m.body,kept);m.body.clear();delete r.models[id];
    if(r.type===id){r.type=null;r.ship=r.rig=r.flag=null;}
  }
  function trimModels(r,keep){
    var idle=Object.keys(r.models).filter(function(id){return id!==r.type&&(!r.inFrame||r.models[id].seen!==r.frame);});
    idle.sort(function(a,b){return r.models[b].seen-r.models[a].seen;});
    if(idle.length>keep){idle.slice(keep).forEach(function(id){dropModel(r,id);});r.renderer.renderLists.dispose();}
  }
  function select(r,id){
    if(r.type===id){r.models[id].seen=r.frame;return true;}if(failedTypes[id])return false;
    var T=G.Three,c=cfg();
    r.yaw.remove(r.body);r.type=null;r.ship=r.rig=r.flag=null;
    var cached=r.models[id];
    if(cached){
      r.body=cached.body;r.yaw.add(r.body);r.ship=cached.ship;r.rig=cached.rig;r.flag=cached.flag;r.span=cached.span;r.anchor=cached.anchor;r.buildMs=cached.buildMs;r.type=id;r.switches++;cached.seen=r.frame;
      Object.assign(r.camera,{left:-r.span/2,right:r.span/2,top:r.anchor,bottom:r.anchor-r.span});r.camera.updateProjectionMatrix();
      if(!r.inFrame)trimModels(r,0);return true;
    }
    r.body=new T.Group();r.yaw.add(r.body);
    try{
      var started=performance.now(),ship=G.ShipModels.create(T,id),hull=ship.buildHull(),rig=G.ShipModels.makeRig(ship,T,batch,c);
      r.body.add(batch(hull,T));r.body.add(rig.root);
      var i=Math.min(1,ship.s.masts.length-1),flag=new T.Mesh(new T.PlaneGeometry(1,1,12,2),new T.MeshStandardMaterial({color:'#315c99',side:T.DoubleSide,roughness:.8}));
      flag.position.set(ship.s.masts[i],ship.s.H+ship.s.heights[i]+.4,0);flag.geometry.attributes.position.setUsage(T.DynamicDrawUsage);flag.frustumCulled=false;flag.castShadow=true;r.body.add(flag);
      var plane=new T.Plane(new T.Vector3(0,1,0),c.waterline);
      r.body.traverse(function(o){if(o.isMesh){o.material.clippingPlanes=[plane];o.material.clipShadows=true;}});
      // 선회 때 넓은 노·부판과 높은 돛이 잘리지 않도록 여백만 늘린다. 선체 크기는 유지한다.
      r.body.rotation.set(0,0,0);r.body.position.set(0,0,0);r.yaw.rotation.y=0;r.scene.updateMatrixWorld(true);
      var bb=new T.Box3().setFromObject(r.body),rad=Math.hypot(Math.max(Math.abs(bb.min.x),Math.abs(bb.max.x)),Math.max(Math.abs(bb.min.z),Math.abs(bb.max.z)));
      if(rig.oars)rad=Math.max(rad,Math.hypot(ship.s.L*.44,ship.s.W*1.6+ship.s.H*.7));
      var anchor=Math.max(c.anchorY,bb.max.y*Math.sqrt(1-c.elevation*c.elevation)+rad*c.elevation+c.boundsPadding);
      r.span=Math.max(c.span,rad*2+c.boundsPadding*2,anchor+rad*c.elevation+c.boundsPadding);r.anchor=anchor;
      Object.assign(r.camera,{left:-r.span/2,right:r.span/2,top:r.anchor,bottom:r.anchor-r.span});r.camera.updateProjectionMatrix();
      r.ship=ship;r.rig=rig;r.flag=flag;r.type=id;r.switches++;r.builds++;r.buildMs=performance.now()-started;
      r.models[id]={body:r.body,ship:ship,rig:rig,flag:flag,span:r.span,anchor:r.anchor,buildMs:r.buildMs,seen:r.frame};
      if(!r.inFrame)trimModels(r,0);return true;
    }catch(e){failedTypes[id]=e.message;release(r.body);r.body.clear();r.ship=r.rig=r.flag=null;return false;}
  }
  function animate(r,spec,t){
    var c=cfg(),rig=spec.rig||{};r.rig.update(spec,t);
    var fp=r.flag.geometry.attributes.position,uv=r.flag.geometry.attributes.uv,strength=clamp(rig.aws==null?.6:rig.aws,.05,2);
    var flagScale=clamp(r.ship.s.L/156,.65,1.15);r.flag.rotation.y=-(rig.wind||0);
    for(var i=0;i<fp.count;i++){var a=uv.getX(i),b=uv.getY(i);fp.setXYZ(i,a*c.flagLength*flagScale,((b-1)*c.flagHeight-a/(1+strength)*1.5)*flagScale,Math.sin(a*8-t*c.flagRate)*a*c.flagWave*strength);}
    fp.needsUpdate=true;r.flag.geometry.computeVertexNormals();r.flag.visible=spec.flag!==null;r.flag.material.color.set(spec.flag||'#315c99').convertSRGBToLinear();
    // 같은 선종의 해적선과 아군을 번갈아 그려도 돛 색이 서로 묻지 않는다.
    r.tint.set(spec.sailTint||'#ffffff').convertSRGBToLinear();
    r.rig.sails.forEach(function(a){var m=a.mesh.material;if(!m.userData.shipBaseColor)m.userData.shipBaseColor=m.color.clone();m.color.copy(m.userData.shipBaseColor).multiply(r.tint);});
    var pose=spec.pose||{};r.body.rotation.set(clamp(pose.roll||0,-.3,.3),0,clamp(pose.pitch||0,-.16,.16));r.body.position.y=clamp(pose.heave||0,-.1,.1)*c.heave;
    var light=spec.light||{},cloud=clamp(light.cloud||0,0,1),dusk=clamp(light.dusk||0,0,1);
    r.sun.intensity=c.sunLight*(1-cloud*.65)*(1-dusk*.7);r.hemi.intensity=c.skyLight*(1-dusk*.45);r.rim.intensity=c.rimLight*(1-cloud*.5);r.sun.color.set(dusk>.25?0xffb77b:0xffecd1);
    if(G.WaterLight){
      var wl=G.WaterLight(light),sun=wl.sun,warm=wl.warmth;
      // 수면의 북쪽(+y)은 선박 모형의 -z. 같은 방향에서 돛·갑판을 비춘다.
      r.sun.position.set(sun[0]*420,sun[2]*420,-sun[1]*420);
      r.sun.color.setRGB(1,.925-.20*warm,.82-.37*warm);
    }
  }
  P.supports=function(id){return !!(G.ShipModels&&G.ShipModels.has(id));};
  // 미리 읽을 대체 시트 판정용. 실제 생성·그리기 실패는 draw의 반환값으로 처리한다.
  P.canRender=function(id){var c=cfg();return !!(c&&c.enabled&&P.supports(id)&&!failure&&!failedTypes[id]&&(!rt||(!rt.lost&&!rt.renderer.getContext().isContextLost())));};
  P.beginFrame=function(){
    var c=cfg();if(!c||!c.enabled)return false;
    var r=setup();if(!r||r.lost)return false;r.frame++;r.inFrame=true;r.drawn=0;r.neededPixels=0;r.renders=0;return true;
  };
  P.endFrame=function(){
    if(!rt||!rt.inFrame)return;
    var c=cfg();
    // 확대를 줄인 뒤에는 화면 전체의 최대 크기가 안정됐을 때 한 번만 줄인다.
    rt.smallFrames=rt.neededPixels>0&&rt.neededPixels<rt.buffer*c.bufferShrinkRatio?(rt.smallFrames||0)+1:0;
    if(rt.smallFrames>=c.bufferShrinkFrames){rt.renderer.setSize(rt.neededPixels,rt.neededPixels,false);rt.buffer=rt.neededPixels;rt.smallFrames=0;}
    trimModels(rt,Math.max(0,c.idleModels||0));rt.inFrame=false;
  };
  // 상세 감상 화면도 항해와 같은 생성·묶음·자원 해제 경로를 사용한다.
  P.buildInspection=function(id){
    if(!P.supports(id))throw new Error('지원하지 않는 선박');
    var T=G.Three,ship=G.ShipModels.create(T,id),hull=ship.buildHull(),tops=[],features={};
    function record(group){group.updateMatrixWorld(true);group.traverse(function(o){
      if(o.userData.rigTop)tops.push(new T.Box3().setFromObject(o));
      var role=o.userData.turtleRole||o.userData.craftRole;
      if(role&&['dragon','command-platform','baghlah-gallery','stern-working-stage','yagura-balcony','mast-step','beam-lashing','steering-board'].indexOf(role)>=0){var b=new T.Box3().setFromObject(o);if(features[role])features[role].union(b);else features[role]=b;}
    });}
    record(hull);var hullBox=new T.Box3().setFromObject(hull),rig=G.ShipModels.makeRig(ship,T,function(o){record(o);return batch(o,T);},cfg()),body=new T.Group();
    body.add(batch(hull,T),rig.root);body.updateMatrixWorld(true);
    return{root:body,ship:ship,rig:rig,hullBox:hullBox,tops:tops,features:features,dispose:function(){release(body);body.clear();}};
  };
  /* 다시 쓰는 그림 (2026-11-01 항해 버벅임): 항해 화면은 배마다(spec.sid) 3D로 그린 그림을 잠깐(reuseMs) 담아 두고 그 사이 프레임에는 자리만 옮겨 다시 쓴다.
     144Hz 화면이면 배 한 척을 1초에 144번 3D로 그리던 것. 한 프레임에 새로 그리는 배는 기함 말고 reuseBudget척까지 — 나머지는 reuseMax ms까지 먼저 그린 그림으로,
     다음 프레임에 차례가 온다. 선종·크기·깃발·돛 빛깔이 바뀌거나 뱃머리가 돌면 바로 새로 그린다. sid가 없는 그림(해전·감상)은 예전처럼 매번 그린다. */
  var reuse={};
  function reusable(k,spec,angle,len,pixels,c,now,r){
    if(!k||k.type!==spec.type||k.pixels!==pixels||Math.abs(len-k.len)>len*.01||(spec.flag||null)!==k.flag||(spec.sailTint||null)!==k.tint)return false;
    var da=Math.abs(angle-k.angle)%PI2;if(da>Math.PI)da=PI2-da;
    var age=now-k.at,fu=Math.abs((spec.furl||0)-k.furl);
    if(age<c.reuseMs&&da<(c.reuseTurn||.02)&&fu<.04)return true;                       // 방금 그린 그림
    return r.inFrame&&r.renders>=(c.reuseBudget||2)&&spec.sid!=='f0'&&age<(c.reuseMax||120)&&da<.08&&fu<.1;   // 이 프레임 몫을 다 썼으면 조금 묵은 그림으로
  }
  P.draw=function(ctx,x,y,angle,len,spec,t){
    var c=cfg();if(!c||!c.enabled||!spec||!P.supports(spec.type))return false;
    var r=setup();if(!r||r.lost||r.renderer.getContext().isContextLost())return false;
    var start=performance.now(),tx=ctx.getTransform(),dev=Math.hypot(tx.a,tx.b),scale=len/c.baseLen;
    var naturalPixels=clamp(Math.ceil(r.span*scale*dev*c.supersample/32)*32,c.minBuffer,c.maxBuffer);
    var key=c.reuseMs>0&&spec.sid!=null?String(spec.sid):null,k=key?reuse[key]:null,pixels=naturalPixels;
    // 파도에 따른 길이 변화가 32px 경계를 오갈 때 캐시 캔버스를 매번 다시 만들지 않는다. 처음·실제 배율 변경 때 한 단계 여유를 두며 해상도는 낮추지 않는다.
    if(key){if(!k||naturalPixels>k.pixels||naturalPixels<k.pixels-64)pixels=clamp(naturalPixels+32,c.minBuffer,c.maxBuffer);else pixels=k.pixels;}
    if(key&&reusable(k,spec,angle,len,pixels,c,start,r)){
      r.neededPixels=Math.max(r.neededPixels||0,pixels);if(r.models[spec.type])r.models[spec.type].seen=r.frame;   // 버퍼 줄이기·모형 정리가 이 배를 빼먹지 않게
      ctx.save();ctx.translate(x,y);ctx.rotate(-Math.atan2(Math.sin(angle)*c.elevation,Math.cos(angle)));ctx.fillStyle='rgba(0,14,28,.24)';ctx.beginPath();
      ctx.ellipse(0,len*.035,len*(k.L/c.baseLen)*.47,len*(k.W/48)*.13,0,0,PI2);ctx.fill();ctx.restore();
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(k.cv,x-k.span*.5*scale,y-k.anchor*scale,k.span*scale,k.span*scale);ctx.restore();
      k.seen=start;r.reused=(r.reused||0)+1;r.drawn++;return true;
    }
    if(!select(r,spec.type))return false;
    // 큰 배에 맞춰 확보한 버퍼를 재사용한다. 배마다 캔버스를 줄였다 늘리면 GPU가 앞선 그림을 기다리며 멈칫한다.
    // 작은 배는 필요한 영역에 같은 해상도로 그려 잘라 옮긴다(돛·망루의 픽셀 밀도는 그대로).
    if(pixels>r.buffer||(!r.inFrame&&pixels!==r.buffer)){r.renderer.setSize(pixels,pixels,false);r.buffer=pixels;}
    r.neededPixels=Math.max(r.neededPixels||0,pixels);
    r.renderer.setViewport(0,0,pixels,pixels);r.renderer.setScissor(0,0,pixels,pixels);r.renderer.setScissorTest(true);
    r.sun.castShadow=c.shadows&&len>=c.shadowMinLen;animate(r,spec,t||0);r.yaw.rotation.y=angle;r.renderer.render(r.scene,r.camera);
    ctx.save();ctx.translate(x,y);ctx.rotate(-Math.atan2(Math.sin(angle)*c.elevation,Math.cos(angle)));ctx.fillStyle='rgba(0,14,28,.24)';ctx.beginPath();
    ctx.ellipse(0,len*.035,len*(r.ship.s.L/c.baseLen)*.47,len*(r.ship.s.W/48)*.13,0,0,PI2);ctx.fill();ctx.restore();
    if(key){
      if(!k){k=reuse[key]={cv:document.createElement('canvas')};
        if(Object.keys(reuse).length>24)Object.keys(reuse).forEach(function(id){if(start-(reuse[id].seen||0)>5000)delete reuse[id];});}   // 오래 안 보인 배의 그림은 버린다
      if(k.cv.width!==pixels){k.cv.width=pixels;k.cv.height=pixels;}
      var kc=k.cv.getContext('2d');kc.clearRect(0,0,pixels,pixels);kc.drawImage(r.renderer.domElement,0,r.buffer-pixels,pixels,pixels,0,0,pixels,pixels);
      k.type=spec.type;k.pixels=pixels;k.at=k.seen=start;k.angle=angle;k.len=len;k.furl=spec.furl||0;k.flag=spec.flag||null;k.tint=spec.sailTint||null;
      k.L=r.ship.s.L;k.W=r.ship.s.W;k.span=r.span;k.anchor=r.anchor;
      ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(k.cv,x-r.span*.5*scale,y-r.anchor*scale,r.span*scale,r.span*scale);ctx.restore();
    }else{ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(r.renderer.domElement,0,r.buffer-pixels,pixels,pixels,x-r.span*.5*scale,y-r.anchor*scale,r.span*scale,r.span*scale);ctx.restore();}
    r.renders=(r.renders||0)+1;r.frames++;r.drawn++;r.stats={type:r.type,frames:r.frames,switches:r.switches,calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles,
      geometries:r.renderer.info.memory.geometries,textures:r.renderer.info.memory.textures,programs:r.renderer.info.programs.length,buffer:r.buffer,renderPixels:pixels,span:r.span,
      cpuMs:performance.now()-start,buildMs:r.buildMs,heading:angle,furl:spec.furl||0,sails:r.rig.sails.length,oars:r.rig.oars};return true;
  };
  var PI2=Math.PI*2;
  P.stats=function(){return rt?Object.assign({},rt.stats,{ready:!!rt.type,lost:rt.lost,failures:Object.assign({},failedTypes),builds:rt.builds,cachedTypes:Object.keys(rt.models),drawn:rt.drawn,geometries:rt.renderer.info.memory.geometries,textures:rt.renderer.info.memory.textures}):{ready:false,failure:failure,failures:Object.assign({},failedTypes)};};
  P.dispose=function(){reuse={};if(rt){Object.keys(rt.models).forEach(function(id){dropModel(rt,id);});release(rt.scene);if(rt.sun.shadow.map)rt.sun.shadow.map.dispose();if(rt.sun.shadow.mapPass)rt.sun.shadow.mapPass.dispose();rt.renderer.dispose();rt.renderer.forceContextLoss();rt=null;}failure=null;failedTypes={};};
  window.addEventListener('pagehide',P.dispose);
  // 초기 갤리온 시제품의 공개 이름은 범위를 유지한 채 호환한다.
  G.Galleon3D={draw:function(ctx,x,y,a,len,spec,t){return spec&&spec.type==='galleon'?P.draw(ctx,x,y,a,len,spec,t):false;},stats:P.stats,dispose:P.dispose};
})(window.G=window.G||{});
