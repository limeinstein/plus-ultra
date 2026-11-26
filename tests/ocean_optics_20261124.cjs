/* 실제 GLSL로 수심별 물빛·광학 조정값·Ocean 반복 경계와 시간 변화를 검사한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/ocean-blender-20261124');
const src=fs.readFileSync(path.join(ROOT,'js/world/renderer.js'),'utf8');
function part(mark){const i=src.indexOf(mark)+mark.length;return src.slice(i,src.indexOf('`;',i));}
const shader=part('var HEAD = `')+part('var WATER = `')+`
uniform float uDepth;
void main(){vec2 p=vec2(170.0,125.0)+(gl_FragCoord.xy-uRes*.5)/uZoom;
outColor=vec4(waterCol(p-vec2(180,90),p,uDepth,vec2(1,0),100.0,vec4(.72,.5,.5,0),uZoom/TPD,uZoom,0.0),1);}`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=d3d11','--ignore-gpu-blocklist']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:640,height:360}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setContent('<body style="margin:0"><canvas width="640" height="360"></canvas></body>');
  await page.addScriptTag({path:path.join(ROOT,'js/data/seafx.js')});
  await page.addScriptTag({path:path.join(ROOT,'js/data/ocean_baked.js')});
  const report=await page.evaluate(fsrc=>{
   const cv=document.querySelector('canvas'),gl=cv.getContext('webgl2',{preserveDrawingBuffer:true});
   function compile(type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
   const pr=gl.createProgram();gl.attachShader(pr,compile(gl.VERTEX_SHADER,'#version 300 es\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0,1);}'));gl.attachShader(pr,compile(gl.FRAGMENT_SHADER,fsrc));gl.bindAttribLocation(pr,0,'aPos');gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));gl.useProgram(pr);
   const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   const w=G.FX.water,o=w.optics,b=G.OceanBaked,raw=atob(b.data),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D_ARRAY,tex);gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.RGBA8,b.size,b.size,b.frames,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
   gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_WRAP_T,gl.REPEAT);
   function u(n,...v){const loc=gl.getUniformLocation(pr,n);gl['uniform'+v.length+'f'](loc,...v);}
   gl.uniform1i(gl.getUniformLocation(pr,'uOcean'),3);
   // 본편 _uploadUniforms와 같은 잡음·이웃 반복 한도. 독립 GLSL 검사도 기본값 0으로 나누지 않는다.
   gl.uniform1i(gl.getUniformLocation(pr,'uNoiseOctaves'),6);gl.uniform1i(gl.getUniformLocation(pr,'uNeighborRadius'),1);
   u('uRes',640,360);u('uZoom',650);u('uTime',1.3);u('uWind',.65,.3);u('uCloud',.15);u('uStorm',0);
   u('uW0',w.shelf,w.wave,w.whitecap,w.glint);u('uW1',...w.shallow,w.foam);u('uW2',...w.deep,0);u('uW3',...w.lagoon,0);u('uW4',...w.abyss,w.rough);u('uW5',w.flow,w.ripple,w.crest,0);
   u('uOptics',o.ior,o.transmission,o.specular,o.roughness);u('uAbsorption',...o.absorption,o.depth);u('uOceanFlow',o.bump,o.tile,o.drift,o.foam);u('uOceanTime',b.frames,b.seconds);
   u('uSurface',.22,1.5,.3,.3);u('uSheen',.18,.16,0,.3);u('uCoastSurface',.35,.14,.70,24);u('uWaterSun',-.55,.50,.67);
   function frame(d,t=1.3){u('uDepth',d);u('uTime',t);gl.drawArrays(gl.TRIANGLES,0,3);const data=new Uint8Array(640*360*4);gl.readPixels(0,0,640,360,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;}
   function mean(a){const m=[0,0,0];for(let i=0;i<a.length;i+=4)for(let c=0;c<3;c++)m[c]+=a[i+c];return m.map(x=>x/(a.length/4));}
   function difference(a,b){let v=0;for(let i=0;i<a.length;i+=4)for(let c=0;c<3;c++)v+=Math.abs(a[i+c]-b[i+c]);return v/(a.length*.75);}
   const palette=[.12,1,5,20,80].map(d=>({depth:d,rgb:mean(frame(d))}));
   const base=frame(12),animation=difference(base,frame(12,1.8));
   const seam=difference(frame(12,b.seconds-.001),frame(12,b.seconds+.001));
   u('uOceanFlow',0,o.tile,o.drift,0);const bump=difference(base,frame(12));u('uOceanFlow',o.bump,o.tile,o.drift,o.foam);
   u('uOptics',1.0,o.transmission,o.specular,o.roughness);const ior=difference(base,frame(12));
   u('uOptics',o.ior,o.transmission,o.specular,.65);const roughness=difference(base,frame(12));
   u('uOptics',o.ior,o.transmission,0,o.roughness);const specular=difference(base,frame(12));
   u('uOptics',o.ior,o.transmission,o.specular,o.roughness);const shallow=frame(.7);u('uOptics',o.ior,0,o.specular,o.roughness);const transmission=difference(shallow,frame(.7));
   u('uOptics',o.ior,o.transmission,o.specular,o.roughness);u('uAbsorption',0,0,0,o.depth);const absorption=difference(base,frame(12));u('uAbsorption',...o.absorption,o.depth);
   const foam=new Set(),normal=new Set();for(let i=0;i<bytes.length;i+=4){normal.add(bytes[i]);foam.add(bytes[i+2]);}
   window.oceanProbe={frame};frame(.7);
   return {palette,animation,seam,bump,ior,roughness,specular,transmission,absorption,data:{bytes:bytes.length,expected:b.size*b.size*b.frames*4,normalLevels:normal.size,foamLevels:foam.size},glError:gl.getError()};
  },shader);
  await page.screenshot({path:path.join(OUT,'optics-shallow.png')});
  // 본편 업로드 경로와 누락 자료의 대체 텍스처를 직접 읽는다. 컨텍스트 복원 때도 다시 올라와야 한다.
  await page.addScriptTag({path:path.join(ROOT,'js/world/renderer.js')});
  report.resources=await page.evaluate(async()=>{
   const geo=new Uint8Array(8*4*4),clim=new Uint8Array(4*2*4);
   G.Geo={size:()=>({W:8,H:4,CW:4,CH:2}),geoTexture:()=>geo,climateTexture:()=>clim};
   const cv=document.createElement('canvas');document.body.append(cv);const r=new G.WorldRenderer(cv),gl=r.gl;
   function read(layer){const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTextureLayer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,r.texOcean,0,layer);const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER),px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteFramebuffer(fb);if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error('Ocean 텍스처 장수');return [...px];}
   const baked=read(G.OceanBaked.frames-1),ext=gl.getExtension('WEBGL_lose_context');
   let restored=false;
   if(ext){
    await new Promise(resolve=>{cv.addEventListener('webglcontextlost',resolve,{once:true});ext.loseContext();});
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('컨텍스트 복원 시간 초과')),60000);cv.addEventListener('webglcontextrestored',()=>{clearTimeout(timer);resolve();},{once:true});setTimeout(()=>ext.restoreContext(),100);});
    restored=!r.lost&&read(G.OceanBaked.frames-1).every((x,i)=>x===baked[i]);
   }
   const data=G.OceanBaked;delete G.OceanBaked;r._uploadTextures();const fallback=read(0);G.OceanBaked=data;
   return {baked,restored,fallback,glError:gl.getError()};
  });
  fs.writeFileSync(path.join(OUT,'optics-probe-latest.json'),JSON.stringify(report,null,2));
  assert.equal(report.data.bytes,report.data.expected);assert(report.data.normalLevels>30);assert(report.data.foamLevels>30);
  for(const key of ['animation','bump','ior','roughness','specular','transmission','absorption'])assert(report[key]>.001,key+' 결과가 바뀌지 않음');
  assert(report.seam<report.animation,'시간 반복 경계에서 수면이 튐');
  const first=report.palette[0].rgb,last=report.palette.at(-1).rgb;
  assert(first[1]>first[2]*.85&&first[1]>first[0]*1.3,'연안 에메랄드색');
  assert(last[2]>last[1]&&last[1]>last[0]&&last[1]<first[1]*.65,'짙은 남색 심해');
  assert.equal(report.glError,0);assert.deepStrictEqual(errors,[]);
  assert(report.resources.restored);assert.deepStrictEqual(report.resources.fallback,[128,128,0,255]);assert.equal(report.resources.glError,0);
  report.errors=errors;fs.writeFileSync(path.join(OUT,'optics-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
