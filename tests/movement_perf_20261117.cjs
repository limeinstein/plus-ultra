'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=(process.env.OUT || path.join(ROOT,'artifacts/movement-perf-20261117'));
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=d3d11','--enable-gpu','--no-sandbox']});
 try{
 const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
 await p.addInitScript(()=>{requestAnimationFrame=()=>0;window.__bitmaps=[];const old=createImageBitmap;window.createImageBitmap=function(img,options){window.__bitmaps.push({w:img.naturalWidth||img.width,resize:options&&options.resizeWidth||0});return old.apply(this,arguments);};});
 await p.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href));await p.waitForFunction(()=>window.G&&G.ShipModels&&G.Game&&G.Img.count()>0);
 await p.evaluate(()=>{window.__newModels=G.ShipModels;});
 await p.addScriptTag({content:fs.readFileSync(path.join(__dirname,'fixtures/rig_before_20261117.js'),'utf8')});
 await p.evaluate(()=>{window.__oldModels=Object.assign({},G.ShipModels,{makeRig:function(ship,T,batch,cfg){return G.RigReference.make(ship,T,batch,cfg);}});G.ShipModels=window.__newModels;});
 const rig=await p.evaluate(()=>{
 const result=[];
 for(const id of ['galleon','caravel','galley','junk','panokseon'].filter(id=>G.ShipModels.has(id))){
  const models=[];for(const api of [window.__oldModels,window.__newModels]){G.ShipModels=api;models.push(G.Ship3D.buildInspection(id));}G.ShipModels=window.__newModels;
  let maxError=0;
  for(const furl of [0,.35,.9,1])for(const t of [0,.73,12.5]){
   const spec={furl,rig:{fill:.84,brace:.2,luff:.4,lee:-1},oarPower:.6};models.forEach(m=>m.rig.update(spec,t));
   const a=models[0].rig,b=models[1].rig;if(a.sails.length!==b.sails.length)throw Error('돛 수 변경');
   a.sails.forEach((s,i)=>{const x=s.mesh.geometry.attributes.position.array,y=b.sails[i].mesh.geometry.attributes.position.array;for(let j=0;j<x.length;j++)maxError=Math.max(maxError,Math.abs(x[j]-y[j]));});
   const arrays=m=>{const out=[];m.rig.root.traverse(o=>{if(o.instanceMatrix)out.push(o.instanceMatrix.array);});return out;};const x=arrays(models[0]),y=arrays(models[1]);x.forEach((v,i)=>{for(let j=0;j<v.length;j++)maxError=Math.max(maxError,Math.abs(v[j]-y[i][j]));});
  }
  const samples=[[],[]],spec={furl:.2,rig:{fill:.9,brace:.12,luff:.3}};
  for(let round=0;round<10;round++)for(const k of (round%2?[1,0]:[0,1])){const start=performance.now();for(let i=0;i<120;i++)models[k].rig.update(spec,(round*120+i)/60);if(round>1)samples[k].push((performance.now()-start)/120);}
  const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];result.push({id,maxError,beforeMs:median(samples[0]),afterMs:median(samples[1])});models.forEach(m=>m.dispose());
 }
 return result;
 });
 assert(rig.length>=3&&rig.every(x=>x.maxError<.0001),'돛과 밧줄 실제 좌표 유지');
 const sprite=await p.evaluate(async()=>{
 const type='caravel',meta=G.SHIP_ART[type];await G.Img.load(meta.key);window.__bitmaps=[];
 G.ShipSprite.want([type],false,true);
 const until=performance.now()+20000;while(G.ShipSprite.status(type)!=='ok'&&performance.now()<until)await new Promise(r=>setTimeout(r,30));
 if(G.ShipSprite.status(type)!=='ok')throw Error('축소본 준비 실패');
 const smallCalls=window.__bitmaps.slice();
 const cv=document.createElement('canvas');cv.width=cv.height=512;const ctx=cv.getContext('2d');let smallSource=null;const draw=ctx.drawImage;ctx.drawImage=function(img){smallSource={width:img.width,height:img.height,canvas:img instanceof HTMLCanvasElement};return draw.apply(this,arguments);};
 if(!G.ShipSprite.draw(ctx,256,256,0,50,{type},0))throw Error('작은 배 그리기 실패');
 const afterSmall=window.__bitmaps.slice(),source=smallSource;
 G.ShipSprite.draw(ctx,256,256,0,400,{type},0);
 const fullCalls=window.__bitmaps.slice();
 await new Promise(r=>setTimeout(r,500));
 if(!G.ShipSprite.draw(ctx,256,256,0,400,{type},1))throw Error('큰 배 원본 전환 실패');
 return{smallCalls,afterSmall,fullCalls,source};
 });
 assert(sprite.smallCalls.length===0&&sprite.source.canvas&&sprite.source.width===896,'작은 배는 재해독 없이 GPU 축소본 보관');
 assert(sprite.afterSmall.length===0,'작은 배 그리기에 원본 불필요');
 assert(sprite.fullCalls.some(c=>c.resize===0),'확대 시 원본 승격');
 assert.deepStrictEqual(errors,[]);const report={rig,sprite,errors};fs.writeFileSync(path.join(OUT,'targeted.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
