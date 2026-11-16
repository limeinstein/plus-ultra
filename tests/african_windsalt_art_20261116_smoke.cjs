/* 아프리카 항해사 그림 60장과 얼굴 자리를 실제 파일 실행·도감에서 검사한다. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'..');
const out=(process.env.OUT || path.join(root,'artifacts/african-windsalt-20261116'));
const keys=JSON.parse(fs.readFileSync(path.join(root,'tools/african_windsalt_20261116_keys.json'),'utf8'));
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),
    args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const errors=[];
    const page=await browser.newPage({viewport:{width:960,height:720}});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'index.html')).href),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title',null,{timeout:120000});
    assert.deepEqual(errors,[]);
    const images=await page.evaluate(async keys=>{
      const rows=[];
      for(const key of keys){
        if(!G.IMAGE_FILES[key])throw Error('이미지 목록 누락 '+key);
        const im=await G.Img.load(key),half=key.endsWith('_half'),face=G.PORTRAIT_FACES[key];
        if(!im||im.naturalWidth!==(half?1024:512)||im.naturalHeight!==(half?1536:512))throw Error('규격·읽기 실패 '+key);
        if(!face||![...face.box,...face.eyes,...face.mouth].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('얼굴 자리 누락·범위 '+key);
        const c=document.createElement('canvas');c.width=64;c.height=64;
        const ctx=c.getContext('2d');ctx.drawImage(im,0,0,64,64);
        const pixels=ctx.getImageData(0,0,64,64).data;
        let clear=0,solid=0;
        for(let i=3;i<pixels.length;i+=4){if(pixels[i]<8)clear++;if(pixels[i]>239)solid++;}
        if(clear/4096<.025||solid/4096<.1)throw Error('투명도 실패 '+key);
        rows.push({key,width:im.naturalWidth,height:im.naturalHeight,clear:clear/4096,solid:solid/4096});
      }
      document.body.innerHTML='<main id="art-check"></main>';
      const board=document.getElementById('art-check');
      Object.assign(document.body.style,{margin:'0',background:'#d8e3db',color:'#26382f',fontFamily:'sans-serif'});
      Object.assign(board.style,{display:'flex',justifyContent:'space-around',height:'720px'});
      for(const id of ['af21','af24','af27','af30']){
        const col=document.createElement('div');col.style.cssText='width:23%;text-align:center;padding-top:12px';
        const title=document.createElement('b');title.textContent=id+' · 화려한 복식';col.appendChild(title);
        for(const suffix of ['','_half']){
          const im=await G.Img.load('portraits/mates/african-windsalt/'+id+suffix);
          const copy=im.cloneNode();copy.style.cssText=suffix?'width:100%;height:480px;object-fit:contain':'width:170px;height:170px;object-fit:contain';col.appendChild(copy);
        }
        board.appendChild(col);
      }
      return rows;
    },keys);
    assert.equal(images.length,60);
    await page.screenshot({path:path.join(out,'ornate-in-game.png')});
    await page.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root,'catalog.html')).href),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.G&&G.Img&&document.readyState==='complete',null,{timeout:90000});
    assert.equal(await page.evaluate(keys=>keys.filter(key=>G.IMAGE_FILES[key]&&G.PORTRAIT_FACES[key]).length,keys),60);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({images:images.length,faces:30,knees:30,ornate:4,errors,checks:images},null,2));
    console.log('통과 — 얼굴상 30장·무릎상 30장·리그 얼굴 자리 60개·투명도, 게임·도감 콘솔 오류 0건');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
