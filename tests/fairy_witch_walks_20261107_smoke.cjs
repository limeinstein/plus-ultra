/* 공주·이야기 인물·마녀 보행의 ID 연결, 실제 시트 해독과 양방향 그리기를 검사한다. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'artifacts/fairy-witch-walks-20261107/runtime');
const plan=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/fairy_witch_walks_20261107_prompts.json'),'utf8'));
const partial=process.argv.includes('--partial');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[];
 try{
  const context=await browser.newContext({viewport:{width:960,height:600}});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>{if(r.resourceType()==='image')failed.push(r.url());});
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game.sceneName==='title'&&G.MATE_WALKS&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const report=await page.evaluate(async({plan,partial})=>{
   const I=G.Img,rows=[],expected=['cinderella','snow_white','sleeping_beauty','little_mermaid','scheherazade','elizaveta'].concat(G.WITCHES.map(w=>w.id),[G.BALL_WITCH.id]);
   if(new Set(expected).size!==31||expected.some(id=>!plan.characters.some(r=>r.id===id)))throw Error('현재 공주·이야기 인물·마녀 명부와 제작 대상 불일치');
   if(!partial&&Object.keys(G.MATE_WALKS).length!==expected.length)throw Error('31명 보행 시트가 모두 필요합니다');
   for(const row of plan.characters){
    const spec=G.MATE_WALKS[row.id];if(!spec&&partial)continue;
    if(!spec||!G.MATE[row.id])throw Error('동료 ID 연결 '+row.id);
    const key=I.pick(I.chain.mateWalk(row.id));
    if(key!==row.key||I.pick(I.chain.mateWalk(G.MATE[row.id]))!==key)throw Error('동료 보행 선택 '+row.id);
    if(spec.columns!==4||spec.rows!==2||spec.frames!==8||spec.frameWidth!==380||spec.frameHeight!==444)throw Error('시트 자료 '+row.id);
    const im=await I.load(key);if(!im||im.naturalWidth!==1520||im.naturalHeight!==888)throw Error('실제 그림 해독 '+row.id);
    const cv=document.createElement('canvas');cv.width=1520;cv.height=888;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
    const bounds=[];
    for(let i=0;i<8;i++){
     const pixels=ctx.getImageData(i%4*380,Math.floor(i/4)*444,380,444).data;let solid=0,clear=0,last=-1;
     for(let p=3;p<pixels.length;p+=4){if(pixels[p]>24)last=Math.floor((p-3)/4/380);if(pixels[p]>220)solid++;if(pixels[p]<9)clear++;}
     if(solid<5000||clear<2000||last<435||last>440)throw Error('보행 실루엣·투명도·발끝 '+row.id+' '+i);
     bounds.push(last);
    }
    const face=I.pick(G.Art.portraitKeys(G.Art.mateSpec(row.id))),half=I.pick(I.chain.mateHalf(row.id));
    if(half!==row.portrait_key)throw Error('기존 인물화와 참고 원화 불일치 '+row.id+' '+half+' '+row.portrait_key);
    rows.push({id:row.id,name:row.name,key,face,half,feet:bounds});
   }
   if(I.chain.mateWalk('없는_동료').length)throw Error('없는 동료가 다른 사람의 보행을 빌립니다');
   window.__walkRows=rows;
   return rows;
  },{plan,partial});
  for(const phase of [0,3,7])for(const dir of [1,-1]){
   const png=await page.evaluate(async({phase,dir})=>{
    const rows=window.__walkRows,cv=document.createElement('canvas');cv.width=1440;cv.height=Math.ceil(rows.length/6)*308;const ctx=cv.getContext('2d');
    ctx.fillStyle='#26323a';ctx.fillRect(0,0,cv.width,cv.height);
    for(let i=0;i<rows.length;i++){
     const row=rows[i];await G.Img.load(row.key);
     const x=i%6*240,y=Math.floor(i/6)*308;
     const f={x:x+120,y:y+280,sc:1.6,dir,state:'walk',ph:(phase+.1)/8,spec:{h:158},frames:Array.from({length:8},(_,c)=>({k:row.key,c}))};
     G.StreetFolk.draw(ctx,f,0,false);
     const pixels=ctx.getImageData(x,y,240,280).data;
     if(!pixels.some((v,p)=>p%4!==3&&v>180))throw Error('실제 보행 그리기 '+row.id);
     ctx.fillStyle='#f5e6c8';ctx.font='18px sans-serif';ctx.fillText(row.name,x+8,y+300,224);
    }
    return cv.toDataURL('image/png').split(',')[1];
   },{phase,dir});
   fs.writeFileSync(path.join(OUT,'walk_'+phase+'_'+(dir>0?'right':'left')+'.png'),Buffer.from(png,'base64'));
  }
  const catalog=await context.newPage();
  catalog.on('pageerror',e=>errors.push('도감: '+e.message));
  catalog.on('console',m=>{if(m.type()==='error')errors.push('도감: '+m.text());});
  await catalog.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await catalog.waitForFunction(()=>window.G&&G.MATE_WALKS&&G.Img.chain.mateWalk);
  const catalogCount=await catalog.evaluate(()=>Object.keys(G.MATE_WALKS).length);
  assert.strictEqual(catalogCount,report.length);
  assert.deepStrictEqual(errors,[],'게임·도감 콘솔 오류');assert.deepStrictEqual(failed,[],'그림 요청 실패');
  fs.writeFileSync(path.join(OUT,'checks.json'),JSON.stringify({count:report.length,frames:report.length*8,rows:report,errors,failed},null,2));
  console.log('통과: '+report.length+'명 / '+report.length*8+'개 자세, 동료 ID·기존 인물화 일치·투명 시트·양방향 보행·게임·도감 오류 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
