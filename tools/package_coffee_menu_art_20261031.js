/* 내장 ImageGen 커피 원화를 메뉴용 투명 WebP와 비교판으로 저장한다. sharp 필요. */
'use strict';
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..'),ART=path.join(ROOT,'artifacts/menu-art-20261031');
const plan=JSON.parse(fs.readFileSync(path.join(ART,'plan.json'),'utf8'));
const relative=p=>path.relative(ROOT,p).replace(/\\/g,'/');
(async()=>{
 const keys={},assets=[],tiles=[];
 for(const [i,a]of plan.assets.entries()){
  const row=JSON.parse(fs.readFileSync(path.join(ART,'generation',a.id+'.json'),'utf8'));
  const source=path.join(ART,'sources',a.id+'.png');fs.mkdirSync(path.dirname(source),{recursive:true});if(row.source!==source)fs.copyFileSync(row.source,source);
  row.source=relative(source);row.file='images/'+a.key+'.webp';const file=path.join(ROOT,row.file);fs.mkdirSync(path.dirname(file),{recursive:true});
  if(fs.existsSync(file)){const old=path.join(ART,'before',a.id+'.webp');if(!fs.existsSync(old)){fs.mkdirSync(path.dirname(old),{recursive:true});fs.copyFileSync(file,old);}}
  await sharp(source).resize(512,512,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:95,alphaQuality:100,effort:4}).toFile(file);
  const m=await sharp(file).metadata();if(m.width!==512||m.height!==512||!m.hasAlpha)throw Error(a.id+' 규격·투명도');keys[a.key]=row.file.slice(7);assets.push(row);
  const x=i%4*320,y=Math.floor(i/4)*320;tiles.push({input:await sharp(file).resize(268,268).png().toBuffer(),left:x+26,top:y+3});
  const font=Math.min(21,Math.floor(300/a.name.length));tiles.push({input:Buffer.from('<svg width="320" height="42"><text x="160" y="28" text-anchor="middle" fill="#f2e4c6" font-family="Malgun Gothic" font-size="'+font+'">'+a.name+'</text></svg>'),left:x,top:y+276});
 }
 const mf=path.join(ROOT,'images/manifest.js'),text=fs.readFileSync(mf,'utf8').replace(/\r\n/g,'\n'),match=/G\.IMAGE_FILES = (\{[\s\S]*?\});/.exec(text);if(!match)throw Error('그림 목록 형식');
 const files=Object.assign(JSON.parse(match[1]),keys);fs.writeFileSync(mf,text.replace(match[0],'G.IMAGE_FILES = '+JSON.stringify(Object.fromEntries(Object.keys(files).sort().map(k=>[k,files[k]])),null,2)+';'));
 fs.writeFileSync(path.join(ROOT,'tools/coffee_menu_art_20261031_prompts.json'),JSON.stringify({date:plan.date,mode:plan.mode,assets},null,2)+'\n');
 fs.mkdirSync(path.join(ROOT,'docs/art'),{recursive:true});await sharp({create:{width:1280,height:Math.ceil(assets.length/4)*320,channels:3,background:'#282923'}}).composite(tiles).jpeg({quality:93}).toFile(path.join(ROOT,'docs/art/coffee-menu-20261031-preview.jpg'));
 console.log('커피 '+assets.length+'종 원화 보존·투명 메뉴 그림 저장·등록·미리보기 완료');
})().catch(e=>{console.error(e);process.exitCode=1;});
