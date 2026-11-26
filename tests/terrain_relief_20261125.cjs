/* 고도 투영의 클릭 역변환, 수면 고정, CPU/GPU 지면 좌표가 함께 맞는지 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/world-detail-20261125');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu']});
 const errors=[];try{
  const p=await b.newPage({viewport:{width:960,height:600}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.setContent('<canvas width="960" height="600"></canvas>');
  for(const f of ['js/core/inflate.js','js/data/base.js','js/data/seafx.js','js/data/world_data.js','js/data/terrain_detail.js','js/data/terrain_patches.js','js/data/waterway_geometry.js','js/data/waterways.js','js/data/landscapes.js','js/art/terrain_materials.js','js/world/geo.js','js/world/terrain.js','js/data/ocean_baked.js'])await p.addScriptTag({content:fs.readFileSync(path.join(root,f),'utf8')});
  await p.evaluate(()=>{G.Game={state:{date:{m:5,d:15}}};G.DISCOVERIES=[{id:'siwa',name:'시와 오아시스',lon:25.52,lat:29.2}];G.Geo.init();});
  const source=fs.readFileSync(path.join(root,'js/world/renderer.js'),'utf8').replace('outColor = vec4(col, smoothstep(-aa, aa, sn));',`float sy=uCenter.y+(frag.y-uRes.y*.5)/uZoom;
   float value=floor(clamp((sy-ll.y)*131070.0,0.0,65535.0)+.5);
   outColor=vec4(floor(value/256.0)/255.0,mod(value,256.0)/255.0,0.0,1.0);`);
  await p.addScriptTag({content:source});
  const report=await p.evaluate(()=>{
   const rows=[];window.r=new G.WorldRenderer(document.querySelector('canvas'));
   for(const [name,lon,lat] of [['alps',8.1,46.5],['himalaya',86.9,27.98],['kilimanjaro',37.355,-3.067],['river',-54.1,-2.28],['coast',-9.13,38.64],['oasis',25.60,29.175]]){
    r.invalidate();r.draw({lon,lat,zoom:450,time:24,wind:[.4,.2],quality:1,cloud:0,edge:0,mode:0});r.gl.finish();const c=r.caches[0],raw=new Uint8Array(c.w*c.h*4);r.gl.bindFramebuffer(r.gl.FRAMEBUFFER,c.fbo);r.gl.readPixels(0,0,c.w,c.h,r.gl.RGBA,r.gl.UNSIGNED_BYTE,raw);r.gl.bindFramebuffer(r.gl.FRAMEBUFFER,null);
    let n=0,max=0,sum=0,water=0,waterRise=0,roundtrip=0,roundtripMax=0,worst=null;
    for(let y=8;y<c.h-8;y+=17)for(let x=8;x<c.w-8;x+=17){
     const a=c.lon+(x+.5-c.w*.5)/c.zoom,z=c.lat+(y+.5-c.h*.5)/c.zoom,o=(y*c.w+x)*4;
     if(G.Geo.sdf(a,z)<=0){water++;waterRise=Math.max(waterRise,G.Terrain.lift(a,z));continue;}
     const cpu=G.Terrain.unproject(a,z),delta=(raw[o]*256+raw[o+1])/131070,err=Math.abs((z-cpu[1])-delta)*540;
     if(raw[o+3]){n++;if(err>max){max=err;worst={lon:a,lat:z,cpuLat:cpu[1],gpuLat:z-delta,hyd:G.Hydro.at(a,z)&&G.Hydro.at(a,z).signed};}sum+=err;}
     const raised=G.Terrain.project(a,z),back=G.Terrain.unproject(...raised),roundErr=Math.abs(z-back[1])*540;roundtrip++;roundtripMax=Math.max(roundtripMax,roundErr);
    }
    rows.push({name,samples:n,maxGpuCpuPixels:max,meanGpuCpuPixels:sum/Math.max(1,n),waterSamples:water,maxWaterRiseDegrees:waterRise,roundtripSamples:roundtrip,maxRoundtripPixels:roundtripMax,worst});
   }
   return rows;
  });
  console.log(JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'relief-projection.json'),JSON.stringify({rows:report,errors},null,2));assert.deepEqual(errors,[]);
  assert(report.every(x=>x.maxWaterRiseDegrees===0),'바다·강의 위치는 고도로 이동하지 않는다');
  assert(report.every(x=>x.maxGpuCpuPixels<2),'CPU/GPU 지면 좌표가 확대 시점 2px 안에서 일치');
  assert(report.every(x=>x.maxRoundtripPixels<3),'고도 투영의 클릭 역변환이 확대 시점 3px 안에서 일치');
  console.log('TERRAIN_RELIEF_PROJECTION_OK');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
