/* 버전 고정 그림을 불러온 뒤 캔버스 읽기·내보내기와 WebGL 올리기를 실제로 검사한다. */
'use strict';
const assert=require('assert'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--allow-file-access-from-files','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);});
  const base=process.env.WEB_BASE;
  await page.goto(base?new URL('index.html',base).href:pathToFileURL(path.resolve(__dirname,'../index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&!G.Scenes.title.bootPending,null,{timeout:120000});
  const result=await page.evaluate(async()=>{
   const keys=['items/flag_calico','portraits/legendary/bat_hood_half','discovery-sheets/folk_tibet',G.Img.list('wanted/')[0]];
   const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
   if(!gl)throw Error('WebGL 준비 실패');const rows=[];
   for(const key of keys){
    const im=await G.Img.load(key);if(!im)throw Error('그림 불러오기 실패: '+key);
    const c=document.createElement('canvas');c.width=64;c.height=64;const ctx=c.getContext('2d');ctx.drawImage(im,0,0,64,64);
    const pixels=ctx.getImageData(0,0,64,64).data,url=c.toDataURL('image/png');
    const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
    rows.push({key,cors:im.crossOrigin,read:pixels.length,exported:url.startsWith('data:image/png'),gl:gl.getError()});gl.deleteTexture(t);
   }
   return {base:G.Img.base(),rows};
  });
  const remote=process.env.EXPECT_REMOTE_IMAGES==='1';
  if(remote)assert(/^https:\/\/raw\.githubusercontent\.com\/limeinstein\/plus-ultra\/[a-f0-9]{40}\/images\/$/.test(result.base),result.base);
  else assert.equal(result.base,'images/');
  for(const r of result.rows){assert.equal(r.read,64*64*4);assert(r.exported);assert.equal(r.gl,0);if(remote)assert.equal(r.cors,'anonymous');}
  assert.deepStrictEqual(errors,[]);console.log(JSON.stringify({...result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
