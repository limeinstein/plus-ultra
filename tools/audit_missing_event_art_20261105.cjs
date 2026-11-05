'use strict';
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('./procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/missing-event-art-20261105');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.G&&G.Hist&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const inventory=await p.evaluate(()=>{
   const has=k=>G.Img.has(k), missing=[];
   const figures=Object.entries(G.HIST_FIG).map(([id,data])=>{
    const f={...data,id};
    const keys=G.Hist.faceKeys(f.id),face=keys.find(has),half=keys.map(k=>k+'_half').find(has);
    const row={...f,keys,face:face||null,half:half||null};if(!face||!half)missing.push(row);return row;
   });
   const mates=G.MATES.filter(m=>m.eventOnly||m.legend||m.tale).map(m=>{
    const keys=['portraits/mates/'+m.id,m.face,'portraits/legendary/'+m.id].filter(Boolean);
    return {id:m.id,name:m.name,g:m.g,age:m.age,desc:m.desc,eventOnly:m.eventOnly,keys,face:keys.find(has)||null,half:[m.halfKey,...keys.map(k=>k+'_half')].filter(Boolean).find(has)||null};
   });
   return {figures,missingFigures:missing,mates,missingMates:mates.filter(r=>!r.face||!r.half),imageFiles:G.IMAGE_FILES};
  });
  const scenes=new Map();
  function add(key,file){if(key.endsWith('_'))return;if(!scenes.has(key))scenes.set(key,{key,files:[]});const a=scenes.get(key).files;if(!a.includes(file))a.push(file);}
  for(const file of walk(path.join(ROOT,'js')).filter(f=>f.endsWith('.js'))){
   const s=fs.readFileSync(file,'utf8'),rel=path.relative(ROOT,file).replaceAll('\\','/');
   for(const m of s.matchAll(/['"]((?:legend-events|family-events|events\/ball)\/[a-zA-Z0-9_/-]+)['"]/g))if(!m[1].endsWith('/'))add(m[1],rel);
   if(s.includes("'legend-events/' + key"))for(const m of s.matchAll(/withPic\(\s*['"]([a-zA-Z0-9_-]+)['"]/g))add('legend-events/'+m[1],rel);
   for(const m of s.matchAll(/(?:H|G\.Hist)\.withScene\(\s*['"]([a-zA-Z0-9_-]+)['"]/g))add('legend-events/'+m[1],rel);
   if(s.includes('G.Hist.withScene'))for(const m of s.matchAll(/scene\(\s*['"]([a-zA-Z0-9_-]+)['"]/g))add('legend-events/'+m[1],rel);
  }
  const sceneRows=[...scenes.values()].map(r=>({...r,registered:!!inventory.imageFiles[r.key],exists:!!inventory.imageFiles[r.key]&&fs.existsSync(path.join(ROOT,'images',inventory.imageFiles[r.key]))}));
  const report={date:'2026-11-05',...inventory,scenes:sceneRows,missingScenes:sceneRows.filter(r=>!r.exists),errors};delete report.imageFiles;
  fs.writeFileSync(path.join(OUT,process.argv.includes('--after')?'audit-after.json':'audit-before.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({figures:report.figures.length,missingFigures:report.missingFigures.map(r=>({id:r.id,name:r.name,face:r.face,half:r.half})),eventMates:report.mates.length,missingMates:report.missingMates.map(r=>({id:r.id,name:r.name})),scenes:sceneRows.length,missingScenes:report.missingScenes,errors},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
