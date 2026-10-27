/* 내장 ImageGen 원화를 칸 단위로 나누고, 보선 규격으로 재배치한다.
   창작·배경 제거 없이 투명도를 보존하는 분할/크기 정리만 수행한다.
   실행: NODE_PATH=<sharp가 있는 node_modules> node tools/prepare_sea_monsters.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art/sea-monster-prompts.json'), 'utf8'));
const context = {window: {G: {}}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/data/seamonsterart.js'), 'utf8'), context);
const layout = context.window.G.SEA_MONSTER_LAYOUT;
const meta = context.window.G.SEA_MONSTER_ART;
const cell = layout.cell;
const pngDir = path.join(ROOT, 'art_sources/sea-monsters/sheets');
const webpDir = path.join(ROOT, 'images/sea-monsters');
const rebuild=new Set(process.argv.slice(2).filter(a=>a.startsWith('--rebuild=')).map(a=>a.slice(10)));
/* 생성 원화의 행 간격은 정확히 같지 않다. 불투명한 본체를 연결 영역으로
   찾은 뒤 가까운 물보라까지 같은 영역에 묶어 이웃 장면이 섞이지 않게 한다. */
function findFrames(pixels,width,height) {
  const n=width*height, seen=new Uint8Array(n), labels=new Int16Array(n);
  const queue=new Int32Array(n), parts=[];
  for(let p=0;p<n;p++) {
    if(seen[p]||pixels[p*4+3]<48)continue;
    let head=0,tail=1;queue[0]=p;seen[p]=1;
    let x0=width,y0=height,x1=0,y1=0;
    while(head<tail) {
      const a=queue[head++],x=a%width,y=Math.floor(a/width);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(const b of [x?a-1:-1,x<width-1?a+1:-1,y?a-width:-1,y<height-1?a+width:-1])
        if(b>=0&&!seen[b]&&pixels[b*4+3]>=48){seen[b]=1;queue[tail++]=b;}
    }
    if(tail<2000)continue;
    const id=parts.length+1;
    for(let i=0;i<tail;i++)labels[queue[i]]=id;
    parts.push({id,x0,y0,x1,y1,col:Math.floor((x0+x1)/2/width*8),row:Math.floor((y0+y1)/2/height*6)});
  }
  if(parts.length!==48||new Set(parts.map(p=>p.row*8+p.col)).size!==48)
    throw new Error('원화에서 독립된 8×6 장면을 찾지 못했습니다');
  let head=0,tail=0;
  for(let i=0;i<n;i++)if(labels[i])queue[tail++]=i;
  while(head<tail) {
    const a=queue[head++],x=a%width,y=Math.floor(a/width);
    for(const b of [x?a-1:-1,x<width-1?a+1:-1,y?a-width:-1,y<height-1?a+width:-1])
      if(b>=0&&!labels[b]){labels[b]=labels[a];queue[tail++]=b;}
  }
  return {parts:parts.sort((a,b)=>a.row*8+a.col-b.row*8-b.col),labels};
}
async function run() {
  fs.mkdirSync(pngDir, {recursive:true});fs.mkdirSync(webpDir, {recursive:true});
  const atlas = {layout:'directions-by-state-v1',...layout,format:'RGBA',
    sourceTool:spec.tool,reference:'ships-nav/baochuan',monsters:[]};
  const atlasFile=path.join(ROOT,'images/sea-monsters/atlas.json');
  const previous=fs.existsSync(atlasFile)?JSON.parse(fs.readFileSync(atlasFile,'utf8')).monsters:[];
  const contacts = [];
  for (const asset of spec.assets) {
    const png = path.join(pngDir, asset.id+'.png'), webp = path.join(webpDir,asset.id+'.webp');
    const saved=previous.find(m=>m.id===asset.id);
    // 종을 추가할 때 이미 완성한 그림은 다시 만들거나 덮어쓰지 않는다.
    if(saved&&fs.existsSync(png)&&fs.existsSync(webp)&&!rebuild.has(asset.id)) {
      atlas.monsters.push(saved);
      console.log(asset.id+' · 기존 시트 유지');
    } else {
    const localSource = path.join(ROOT, asset.sourceCopy);
    fs.mkdirSync(path.dirname(localSource), {recursive:true});
    if (!fs.existsSync(localSource)) fs.copyFileSync(asset.source, localSource);
    const source = await sharp(localSource).metadata();
    if (!source.hasAlpha) throw new Error(asset.id+': 원화의 투명도가 없습니다');
    const pixels = await sharp(localSource).ensureAlpha().raw().toBuffer();
    const segmentation=findFrames(pixels,source.width,source.height);
    const sourceColumns=asset.sourceColumns||layout.directions.map((_,i)=>i);
    if(sourceColumns.length!==8||new Set(sourceColumns).size!==8||sourceColumns.some(c=>c<0||c>7))
      throw new Error(asset.id+': 원화 방위 열 대응이 잘못되었습니다');
    const scale=Math.min(174/Math.max(...segmentation.parts.map(p=>p.x1-p.x0+1)),
      140/Math.max(...segmentation.parts.map(p=>p.y1-p.y0+1)));
    const pieces = [];
    for(const part of segmentation.parts) {
      const left=Math.max(0,part.x0-18),top=Math.max(0,part.y0-18);
      const width=Math.min(source.width,part.x1+19)-left,height=Math.min(source.height,part.y1+19)-top;
      const crop=Buffer.alloc(width*height*4);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
        const p=(top+y)*source.width+left+x;
        if(segmentation.labels[p]!==part.id)continue;
        pixels.copy(crop,(y*width+x)*4,p*4,p*4+4);
      }
      const w=Math.round(width*scale),h=Math.round(height*scale);
      const input=await sharp(crop,{raw:{width,height,channels:4}}).resize(w,h).raw().toBuffer();
      pieces.push({input,raw:{width:w,height:h,channels:4},
        left:sourceColumns.indexOf(part.col)*cell+Math.round(112-((part.x0+part.x1)/2-left)*scale),
        top:part.row*cell+Math.round(168-(part.y1+1-top)*scale)});
    }
    await sharp({create:{width:cell*layout.cols,height:cell*layout.rows,channels:4,background:'#0000'}})
      .composite(pieces).png().toFile(png);
    await sharp(png).webp({lossless:true,effort:3}).toFile(webp);
    const frames = {};
    layout.states.forEach((state,row)=>{frames[state]=layout.directions.map((name,col)=>({
      direction:name,x:col*cell,y:row*cell,w:cell,h:cell,anchor:layout.anchor
    }));});
    atlas.monsters.push({id:asset.id,name:meta[asset.id].name,key:meta[asset.id].key,
      png:path.relative(ROOT,png).replace(/\\/g,'/'),webp:path.relative(ROOT,webp).replace(/\\/g,'/'),
      sourceBounds:segmentation.parts,sourceScale:scale,sourceColumns,frames});
    console.log(asset.id+' · '+cell*layout.cols+'×'+cell*layout.rows+' · 48칸 · 투명 PNG / WebP');
    }
    for (let row=0;row<layout.rows;row++) contacts.push({
      input:await sharp(webp).extract({left:0,top:row*cell,width:cell,height:cell}).png().toBuffer(),
      left:row*cell,top:atlas.monsters.length*cell-cell
    });
  }
  fs.writeFileSync(path.join(ROOT,'images/sea-monsters/atlas.json'),JSON.stringify(atlas,null,2)+'\n');
  await sharp({create:{width:cell*6,height:cell*atlas.monsters.length,channels:3,background:'#254a60'}})
    .composite(contacts).jpeg({quality:94}).toFile(path.join(ROOT,'docs/art/sea-monsters-states.jpg'));
  if(atlas.monsters.length>6) await sharp(path.join(ROOT,'docs/art/sea-monsters-states.jpg'))
    .extract({left:0,top:cell*6,width:cell*6,height:cell*(atlas.monsters.length-6)})
    .jpeg({quality:95}).toFile(path.join(ROOT,'docs/art/sea-monsters-additional-states.jpg'));
}
run().catch(err=>{console.error(err);process.exitCode=1;});
