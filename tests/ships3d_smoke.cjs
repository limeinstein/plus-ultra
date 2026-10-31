/* 36종 미술·동작·자원·실제 항해를 file://에서 검사하고 전체 검토 그림을 남긴다. */
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),GPU=process.env.SHIP3D_GPU==='1',FAST=process.env.SHIP3D_SKIP_SEA==='1';
const OUT=path.join(ROOT,process.env.SHIP3D_ARTIFACTS||'artifacts/fleet3d-polish2-20261031',GPU?'gpu':'software');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:GPU?['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--enable-unsafe-swiftshader']});
  const errors=[],report={mode:GPU?'GPU':'SwiftShader',seaSkipped:FAST,ships:[]};
  try{
    const page=await browser.newPage({viewport:{width:1320,height:1120}});
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.__shipContexts=0;const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){const result=original.call(this,type,...args);if(type==='webgl2'&&result){window.__shipGL=result;window.__shipContexts++;}return result;};});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(ROOT,'test_ships_3d.html')).href);assert.deepStrictEqual(errors,[]);
    await page.waitForFunction(()=>G.Ship3D&&(G.Ship3D.stats().ready||G.Ship3D.stats().failure),null,{polling:100,timeout:60000});
    const ids=await page.evaluate(()=>G.SHIP_TYPES.map(s=>s.id));
    assert.strictEqual(ids.length,36);assert.deepStrictEqual(await page.evaluate(()=>G.ShipModels.ids.slice().sort()),ids.slice().sort());
    assert.deepStrictEqual(await page.evaluate(()=>Object.keys(G.FX.shipArt.profiles).sort()),ids.slice().sort());
    report.renderer=await page.evaluate(()=>{const gl=window.__shipGL,e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});
    report.sailAttachment=await page.evaluate(()=>{
      const T=G.Three,out=[];
      for(const id of ['galleon','caravel','junk','jong']){
        const ship=G.ShipModels.create(T,id),hull=ship.buildHull(),rig=G.ShipModels.makeRig(ship,T,g=>g,G.FX.ship3d);
        const rope=rig.root.children.find(o=>o.userData.sailRopes),sail=rig.sails[0].mesh,m=new T.Matrix4();let error=0;
        for(const furl of [0,.5,1])for(const lee of [-1,1]){
          rig.update({furl,rig:{fill:.85,brace:lee*.65,lee}},2.5);rig.root.updateMatrixWorld(true);rope.getMatrixAt(0,m);
          if(!Array.from(rope.instanceMatrix.array).every(Number.isFinite))throw new Error(id+' 밧줄 좌표 오류');
          // 첫 줄 양 끝이 실제 천 꼭짓점에 닿는지 검증한다. 접기·회전 공식을 다시 구현하지 않는다.
          for(const y of [-.5,.5]){
            const end=new T.Vector3(0,y,0).applyMatrix4(m).applyMatrix4(rope.matrixWorld),p=sail.geometry.attributes.position;let nearest=Infinity;
            for(let i=0;i<p.count;i++)nearest=Math.min(nearest,end.distanceTo(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(sail.matrixWorld)));
            error=Math.max(error,nearest);
          }
        }
        out.push({id,kind:rig.sails[0].kind,segments:rope.count,maxDistance:error});
        const geos=new Set(),mats=new Set(),maps=new Set();[hull,rig.root].forEach(root=>root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);}));
        mats.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)maps.add(v);});m.dispose();});maps.forEach(t=>t.dispose());geos.forEach(g=>g.dispose());
      }return out;
    });
    report.sailAttachment.forEach(x=>assert(x.maxDistance<.001,JSON.stringify(x)));
    const before=await page.evaluate(()=>JSON.stringify(G.SHIP_TYPES));
    for(const id of ids){
      const row=await page.evaluate(id=>{
        const cv=document.createElement('canvas');cv.width=900;cv.height=700;const ctx=cv.getContext('2d');
        const spec={type:id,furl:0,rig:{fill:.95,brace:.18,lee:1},flag:'#315c99',oarPower:.7};
        function hash(){const d=ctx.getImageData(0,0,900,700).data;let h=0,count=0;for(let i=0;i<d.length;i+=4){if(d[i+3])count++;h=(Math.imul(h,31)+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])|0;}return{hash:h,count};}
        function draw(a,t=1.25){ctx.clearRect(0,0,900,700);if(!G.Ship3D.draw(ctx,450,470,a,240,spec,t))throw new Error(id+': '+JSON.stringify(G.Ship3D.stats()));return hash();}
        const dirs=[];for(const a of [0,.02,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI*1.75])dirs.push(draw(a));
        const folds=[];for(const f of [0,.5,1]){spec.furl=f;folds.push(draw(.6).hash);}spec.furl=0;
        const b=G.Ship3D.stats();for(let i=0;i<12;i++)draw(i*.1,i/10);const after=G.Ship3D.stats();
        let oarChange=true;if(after.oars){spec.oarPower=0;const a=draw(.1).hash;spec.oarPower=1;oarChange=a!==draw(.1).hash;}
        // 투명 렌더 타깃의 테두리를 읽어 잘림을 검출한다.
        const gl=window.__shipGL,w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        let edge=0;for(let x=0;x<w;x++)edge+=pixels[x*4+3]>30||pixels[((h-1)*w+x)*4+3]>30?1:0;
        for(let y=0;y<h;y++)edge+=pixels[y*w*4+3]>30||pixels[(y*w+w-1)*4+3]>30?1:0;
        return{id,name:G.SHIP[id].name,dirs,folds,oarChange,edge,before:b,after};
      },id);
      assert.strictEqual(new Set(row.dirs.map(x=>x.hash)).size,7,id+' 방향 변화');assert(row.dirs.every(x=>x.count>700),id+' 빈 선박');
      assert.strictEqual(new Set(row.folds).size,3,id+' 돛 전개/접기');assert(row.oarChange,id+' 노 동작');assert.strictEqual(row.edge,0,id+' 렌더 타깃 잘림');
      assert.strictEqual(row.before.geometries,row.after.geometries,id+' 모형 증가');assert.strictEqual(row.before.textures,row.after.textures,id+' 재질 증가');
      report.ships.push(row);if(report.ships.length%6===0)console.log(`${report.ships.length}/36종 방향·돛·노·자원 확인`);
    }
    assert.strictEqual(await page.evaluate(()=>JSON.stringify(G.SHIP_TYPES)),before);
    report.contexts=await page.evaluate(()=>window.__shipContexts);assert.strictEqual(report.contexts,1,'선종 변경 때 장치 증가');
    // 아홉 척씩 크게 그려 종별 구조와 디테일을 육안으로 확인한다.
    for(let section=0;section<4;section++){
      const data=await page.evaluate(({ids,section})=>{
        const cv=document.createElement('canvas');cv.width=1800;cv.height=1350;const ctx=cv.getContext('2d');
        ids.slice(section*9,section*9+9).forEach((id,i)=>{
          ctx.save();ctx.translate(i%3*600,Math.floor(i/3)*450);const bg=ctx.createLinearGradient(0,0,0,450);bg.addColorStop(0,'#24495b');bg.addColorStop(1,'#0d2735');ctx.fillStyle=bg;ctx.fillRect(0,0,600,450);
          ctx.fillStyle='#e6d8ba';ctx.font='22px sans-serif';ctx.fillText(G.SHIP[id].name,24,35);ctx.fillStyle='#9db8c6';ctx.font='12px monospace';ctx.fillText(id,24,55);
          G.Ship3D.draw(ctx,300,350,.58,260,{type:id,furl:0,rig:{fill:.9,brace:.1,lee:1},oarPower:.6,flag:'#315c99'},1.25);
          ctx.strokeStyle='#486573';ctx.strokeRect(.5,.5,599,449);ctx.restore();
        });return cv.toDataURL('image/png');
      },{ids,section});fs.writeFileSync(path.join(OUT,`fleet-${section+1}.png`),Buffer.from(data.split(',')[1],'base64'));
    }
    const folds=await page.evaluate(()=>{
      const cv=document.createElement('canvas');cv.width=1800;cv.height=1920;const ctx=cv.getContext('2d');
      ['galleon','caravel','junk','jong'].forEach((id,row)=>[0,.5,1].forEach((f,col)=>{
        ctx.save();ctx.translate(col*600,row*480);ctx.fillStyle='#193746';ctx.fillRect(0,0,600,480);ctx.fillStyle='#ead8b2';ctx.font='22px sans-serif';ctx.fillText(G.SHIP[id].name+' · 돛 접기 '+Math.round(f*100)+'%',24,36);
        G.Ship3D.draw(ctx,300,390,.58,300,{type:id,furl:f,rig:{fill:.9,brace:-.35,lee:-1}},2.5);ctx.strokeStyle='#486573';ctx.strokeRect(.5,.5,599,479);ctx.restore();
      }));return cv.toDataURL('image/png');
    });fs.writeFileSync(path.join(OUT,'sail-folds.png'),Buffer.from(folds.split(',')[1],'base64'));
    report.benchmarks=await page.evaluate(()=>{
      const out={};for(const id of ['galleon','galleass','baochuan','geobukseon','balsa']){
        const cv=document.createElement('canvas');cv.width=900;cv.height=700;const ctx=cv.getContext('2d'),times=[];
        for(let i=0;i<18;i++){ctx.clearRect(0,0,900,700);const t=performance.now();G.Ship3D.draw(ctx,450,470,.6,66,{type:id,rig:{fill:.9,brace:.1}},i/30);ctx.getImageData(450,470,1,1);if(i>3)times.push(performance.now()-t);}
        times.sort((a,b)=>a-b);out[id]={p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)]};
      }return out;
    });
    report.fallback=await page.evaluate(()=>{const cv=document.createElement('canvas'),ctx=cv.getContext('2d');G.FX.ship3d.enabled=false;const disabled=G.Ship3D.draw(ctx,0,0,0,66,{type:'junk'},0);G.FX.ship3d.enabled=true;
      return{disabled,unknown:G.Ship3D.draw(ctx,0,0,0,66,{type:'missing-ship'},0),globals:[typeof window.THREE,typeof window.Ship3D,typeof window.FleetDetail]};});
    assert.deepStrictEqual(report.fallback,{disabled:false,unknown:false,globals:['undefined','undefined','undefined']});
    await page.evaluate(()=>{window.__shipLose=window.__shipGL.getExtension('WEBGL_lose_context');window.__shipLose.loseContext();});
    await page.waitForFunction(()=>G.Ship3D.stats().lost,null,{polling:50});
    assert.strictEqual(await page.evaluate(()=>G.Ship3D.draw(document.getElementById('live').getContext('2d'),300,330,0,66,{type:'junk'},0)),false);
    await page.evaluate(()=>window.__shipLose.restoreContext());await page.waitForFunction(()=>!G.Ship3D.stats().lost,null,{polling:50});
    assert(await page.evaluate(()=>G.Ship3D.draw(document.getElementById('live').getContext('2d'),300,330,0,66,{type:'junk'},0)));
    report.recreated=await page.evaluate(()=>{G.Ship3D.dispose();return G.Ship3D.draw(document.getElementById('live').getContext('2d'),300,330,0,66,{type:'panokseon'},0);});assert(report.recreated);
    await page.waitForTimeout(100);assert.strictEqual(await page.evaluate(()=>G.Ship3D.stats().lost),false);
    await page.evaluate(async()=>{document.getElementById('size').value=360;await G.ShipPreview.select('panokseon');G.ShipPreview.render(1.25,1);});await page.waitForTimeout(200);await page.evaluate(()=>G.ShipPreview.render(1.25,1));
    await page.screenshot({path:path.join(OUT,'preview.png')});
    if(!FAST){
      // 전체 그림의 load 완료 대신 게임 코드 준비 후 아래의 필수 자료를 기다린다.
      await page.setViewportSize({width:960,height:540});await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});
      await page.waitForFunction(()=>G.Game&&G.State&&G.Img.count()>0,null,{timeout:90000,polling:100});await page.evaluate(()=>G.Game.ensureGeo());
      await page.evaluate(()=>{
        const sk={};G.SKILLS.forEach(x=>sk[x.id]=0);sk.nav=2;const s=G.State.newGame({name:'선박 미술 검사',nation:'PT',job:'explorer',age:22,birth:{m:4,d:12},st:{str:50,int:50,mar:50,cha:50},sk,lg:G.LANGS.map(()=>0),diff:'normal'});
        s.settings.res=.35;s.fleet.ships[0].type='junk';G.Game.state=s;G.Game.go('sea',{depart:0,fresh:true});const st=G.Scenes.sea.runtime();st.paused=true;st.manual=true;st.npcs=[];st.furl=0;
        s.loc.lon=-13;s.loc.lat=36;s.loc.heading=Math.PI/4;st.cam.lon=-13;st.cam.lat=36;
      });
      report.integration=await page.evaluate(()=>{const types=['barca','galleon','galleass','dhow','jong','korakora','baochuan','panokseon','geobukseon','atakebune','balsa'],out=[];
        // 정지/대화 중에는 2~3프레임에 한 번 그리므로 실제 그리기 기회를 준다.
        for(const id of types){G.Game.state.fleet.ships[0].type=id;for(let i=0;i<6;i++)G.Scenes.sea.update(0);out.push({id,actual:G.Ship3D.stats().type,ready:G.Ship3D.stats().ready,failures:G.Ship3D.stats().failures});}return out;});
      report.integration.forEach(x=>{assert(x.ready,JSON.stringify(x));assert.strictEqual(x.id,x.actual,JSON.stringify(x));});await page.screenshot({path:path.join(OUT,'sea-balsa.png')});
      report.stateUnchanged=await page.evaluate(()=>{const before=JSON.stringify(G.Game.state),cv=document.createElement('canvas');G.Ship3D.draw(cv.getContext('2d'),0,0,0,66,{type:'junk',furl:.5},2);return before===JSON.stringify(G.Game.state);});assert(report.stateUnchanged);
      assert(await page.evaluate(()=>{G.Scenes.sea.exit('city');return!G.Ship3D.stats().ready;}));
    }
    report.errors=errors;assert.deepStrictEqual(errors,[]);fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report.benchmarks));console.log(`OK · 36종 검사 · 콘솔 오류 0${FAST?' · 항해 검사는 생략':''}`);
  }catch(e){fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({...report,errors,error:e.stack||String(e)},null,2));throw e;}
  finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
