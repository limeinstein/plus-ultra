/* 누락 사건 인물화와 장면 원화를 게임 파일로 저장한다. sharp 필요. */
'use strict';
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..'),ART=path.join(ROOT,'artifacts/event-art-20261031');
const abs=p=>path.isAbsolute(p)?p:path.join(ROOT,p);
const rel=p=>path.relative(ROOT,p).replace(/\\/g,'/');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function preserve(src,file){const dest=path.join(ART,file);fs.mkdirSync(path.dirname(dest),{recursive:true});if(abs(src)!==dest)fs.copyFileSync(abs(src),dest);return rel(dest);}
function backup(file){const src=abs(file),dest=path.join(ART,'before',file);if(fs.existsSync(src)&&!fs.existsSync(dest)){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);}}
function label(text,width){return Buffer.from('<svg width="'+width+'" height="38"><text x="10" y="27" fill="#eee1bd" font-family="Malgun Gothic" font-size="21">'+text+'</text></svg>');}
async function convert(src,file,w,h){backup(file);fs.mkdirSync(path.dirname(abs(file)),{recursive:true});await sharp(abs(src)).resize(w,h,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:95,alphaQuality:100,effort:4}).toFile(abs(file));}
(async()=>{
 const plan=read(path.join(ART,'plan.json')),extra=read(path.join(ART,'additional-corrections.json'));
 const spec={date:'2026-10-31',mode:'내장 ImageGen',user_references:[{id:'newton',source:'artifacts/event-art-20261031/references/newton_user_reference.png'},{id:'anne_hathaway',source:'artifacts/event-art-20261031/references/anne_user_reference.png'}],portraits:[],scenes:[]},keys={},tiles=[];
 for(const [i,a] of plan.portraits.concat(extra).entries()){
  const half=read(path.join(ART,'generation',a.id+'_half.json')),face=read(path.join(ART,'generation',a.id+'_face.json'));
  const row={...a,prompt:half.prompt,face_prompt:face.prompt};delete row.sourceKey;
  if(a.id==='newton')row.initial_prompt=read(path.join(ART,'generation/newton_original_design.json')).prompt;
  row.half_source=preserve(half.half_source,'sources/'+a.id+'_half.png');row.face_source=preserve(face.source,'sources/'+a.id+'_face.png');
  for(const kind of ['half','face']){const key=a.key+(kind==='half'?'_half':'');row[kind+'_file']='images/'+key+'.webp';await convert(row[kind+'_source'],row[kind+'_file'],1024,kind==='half'?1536:1024);keys[key]=row[kind+'_file'].slice(7);}
  const x=i%4*320,y=Math.floor(i/4)*520;
  tiles.push({input:await sharp(abs(row.half_file)).resize(280,420,{fit:'contain',background:'#25292b'}).png().toBuffer(),left:x+20,top:y});
  tiles.push({input:await sharp(abs(row.face_file)).resize(112,112).png().toBuffer(),left:x+200,top:y+378});tiles.push({input:label(a.name,320),left:x,top:y+475});spec.portraits.push(row);
 }
 const sceneTiles=[];
 for(const id of plan.scenes){const file=path.join(ART,'generation',id+'_scene.json');if(!fs.existsSync(file))continue;const row=read(file);row.source=preserve(row.source,'sources/'+id+'.png');
  row.references=(row.references||[]).map(r=>({...r,source:preserve(r.source,'references/'+r.id+'.png')}));row.file='images/legend-events/'+id+'.webp';backup(row.file);fs.mkdirSync(path.dirname(abs(row.file)),{recursive:true});
  await sharp(abs(row.source)).resize(1881,836,{fit:'cover'}).removeAlpha().webp({quality:95,effort:4}).toFile(abs(row.file));keys['legend-events/'+id]=row.file.slice(7);
  const i=spec.scenes.length,x=i%2*800,y=Math.floor(i/2)*395;sceneTiles.push({input:await sharp(abs(row.file)).resize(788,350).png().toBuffer(),left:x+6,top:y});sceneTiles.push({input:label(row.name,800),left:x,top:y+353});spec.scenes.push(row);
 }
 const mf=path.join(ROOT,'images/manifest.js'),text=fs.readFileSync(mf,'utf8').replace(/\r\n/g,'\n'),m=/G\.IMAGE_FILES = (\{[\s\S]*?\});/.exec(text);if(!m)throw Error('그림 목록 형식');
 const merged=Object.assign(JSON.parse(m[1]),keys);fs.writeFileSync(mf,text.replace(m[0],'G.IMAGE_FILES = '+JSON.stringify(Object.fromEntries(Object.keys(merged).sort().map(k=>[k,merged[k]])),null,2)+';'));
 fs.mkdirSync(path.join(ROOT,'docs/art'),{recursive:true});await sharp({create:{width:1280,height:Math.ceil(spec.portraits.length/4)*520,channels:3,background:'#25292b'}}).composite(tiles).jpeg({quality:92}).toFile(path.join(ROOT,'docs/art/event-portraits-20261031-preview.jpg'));
 if(sceneTiles.length)await sharp({create:{width:1600,height:Math.ceil(spec.scenes.length/2)*395,channels:3,background:'#25292b'}}).composite(sceneTiles).jpeg({quality:92}).toFile(path.join(ROOT,'docs/art/event-shots-20261031-preview.jpg'));
 fs.writeFileSync(path.join(ROOT,'tools/event_art_20261031_prompts.json'),JSON.stringify(spec,null,2)+'\n');
 console.log('인물 '+spec.portraits.length+'명 초상 '+spec.portraits.length*2+'장, 사건 그림 '+spec.scenes.length+'장 저장·등록 완료');
})().catch(e=>{console.error(e);process.exitCode=1;});
