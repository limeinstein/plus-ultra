/* 내장 ImageGen의 투명 원화를 4×2 시트로 정리한다. 창작·배경 제거 없이 칸 분할과 크기 정리만 한다. */
'use strict';
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const ROOT=path.resolve(__dirname,'..'),spec=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/art/water-splash-prompts.json'),'utf8'));
async function run(){
  const out=path.join(ROOT,'images/effects/water'),sourceDir=path.join(ROOT,'art_sources/water-splashes/sources'),pngDir=path.join(ROOT,'art_sources/water-splashes/sheets');
  for(const p of [out,sourceDir,pngDir])fs.mkdirSync(p,{recursive:true});
  const atlas={tool:spec.tool,cell:256,cols:4,rows:2,frames:8,anchor:[128,176],assets:[]},contact=[];
  for(const asset of spec.assets){
    const source=asset.sourceCopy?path.join(ROOT,asset.sourceCopy):path.join(sourceDir,asset.id+'.png');
    fs.mkdirSync(path.dirname(source),{recursive:true});if(!fs.existsSync(source))fs.copyFileSync(asset.source,source);
    const meta=await sharp(source).metadata();if(!meta.hasAlpha)throw Error(asset.id+' 투명 원화가 아님');
    const pieces=[],bounds=[];
    const cw=meta.width/4,ch=meta.height/2,scale=Math.min(224/cw,164/(ch*.84),68/(ch*.16));
    // 모든 칸을 같은 배율·같은 수면점으로 옮긴다. 작은 거품도 확대하지 않는다.
    for(let i=0;i<8;i++){
      const left=Math.round(i%4*cw),top=Math.round(Math.floor(i/4)*ch),width=Math.round((i%4+1)*cw)-left,height=Math.round((Math.floor(i/4)+1)*ch)-top;
      const w=Math.round(width*scale),h=Math.round(height*scale);
      const input=await sharp(source).extract({left,top,width,height}).resize(w,h).png().toBuffer();
      pieces.push({input,left:i%4*256+Math.round(128-width*.5*scale),top:Math.floor(i/4)*256+Math.round(176-height*.84*scale)});
      bounds.push({left,top,width,height});
    }
    const png=path.join(pngDir,asset.id+'.png'),webp=path.join(out,asset.id+'.webp');
    await sharp({create:{width:1024,height:512,channels:4,background:'#0000'}}).composite(pieces).png().toFile(png);
    await sharp(png).webp({lossless:true,effort:3}).toFile(webp);
    atlas.assets.push({id:asset.id,name:asset.name,key:'effects/water/'+asset.id,sourceSize:[meta.width,meta.height],sourceScale:scale,sourceCells:bounds});
    for(let i=0;i<8;i++)contact.push({input:await sharp(webp).extract({left:i%4*256,top:Math.floor(i/4)*256,width:256,height:256}).resize(160,160).png().toBuffer(),left:i*160,top:(atlas.assets.length-1)*160});
    console.log(asset.id+' · 1024×512 · 8칸 · RGBA');
  }
  fs.writeFileSync(path.join(out,'atlas.json'),JSON.stringify(atlas,null,2)+'\n');
  await sharp({create:{width:1280,height:1120,channels:3,background:'#254d62'}}).composite(contact).jpeg({quality:94}).toFile(path.join(ROOT,'docs/art/water-splashes-contact.jpg'));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
