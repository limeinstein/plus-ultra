/* 실행 중인 인물의 전용 그림과 사건 그림의 누락을 조사한다. */
'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let chromium; try { ({chromium}=require('playwright')); } catch (_) { ({chromium}=require('./procedural_art/node_modules/playwright-core')); }
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage(); await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&G.Newton&&G.Globe&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const data=await page.evaluate(()=>{
   const hist=Object.entries(G.HIST_FIG).map(([id,f])=>{const keys=G.Hist.faceKeys(id);return {...f,id,keys,face:keys.find(k=>G.Img.has(k))||null,half:keys.map(k=>k+'_half').find(k=>G.Img.has(k))||null};});
   const mates=G.MATES.filter(m=>m.eventOnly||m.legend||m.tale).map(m=>{const sp=G.Legend.speaker(m.id),keys=G.Art.portraitKeys(sp.portrait)||[],halves=sp.half||[];const own=keys.filter(k=>/^portraits\/(?:history|legendary|mates|rivals|witches|player)\//.test(k));return {id:m.id,name:m.name,g:m.g,style:m.style,role:m.role,age:m.age,desc:m.desc,keys,halves,own,face:own.find(k=>G.Img.has(k))||null,half:halves.filter(k=>own.some(o=>k===o+'_half')).find(k=>G.Img.has(k))||null};});
   return {hist,mates,files:G.IMAGE_FILES};
  });
  const systems=fs.readdirSync(path.join(ROOT,'js/systems')).filter(f=>f.endsWith('.js'));
  const sceneUses=[];
  for(const f of systems){const source=fs.readFileSync(path.join(ROOT,'js/systems',f),'utf8');
   for(const m of source.matchAll(/['"`]legend-events\/([a-zA-Z0-9_/-]+)['"`](?!\s*\+)/g))sceneUses.push({file:f,key:m[1]});
   if(f==='littleprince.js') for(const m of source.matchAll(/shot\('([a-z_]+)'/g))sceneUses.push({file:f,key:'little_prince_'+m[1]});
   if(/legend-events\//.test(source))for(const m of source.matchAll(/(?:withPic|withScene|pic|scenePic)\(\s*['"]([a-z][a-z0-9_]+)['"]/g))sceneUses.push({file:f,key:m[1]});
  }
  data.scenes=[...new Map(sceneUses.map(a=>[a.key,a])).values()].map(a=>({...a,exists:!!data.files['legend-events/'+a.key]}));
  for(const list of [data.hist,data.mates]) for(const a of list){
   const keys=a.own||a.keys;
   const real=k=>!!data.files[k]&&fs.existsSync(path.join(ROOT,'images',data.files[k]));
   a.face=keys.find(real)||null;a.half=(a.halves||keys.map(k=>k+'_half')).filter(k=>keys.some(o=>k===o+'_half')||/^characters\//.test(k)).find(real)||null;
  }
  for(const a of data.scenes)a.exists=!!data.files['legend-events/'+a.key]&&fs.existsSync(path.join(ROOT,'images',data.files['legend-events/'+a.key]));
  const out=path.join(ROOT,'artifacts/event-art-20261031'); fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(data,null,2));
  console.log(JSON.stringify({histMissing:data.hist.filter(x=>!x.face||!x.half).map(x=>({id:x.id,name:x.name,face:x.face,half:x.half})),mateMissing:data.mates.filter(x=>!x.face||!x.half).map(x=>({id:x.id,name:x.name,face:x.face,half:x.half})),sceneMissing:data.scenes.filter(x=>!x.exists)},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
