/* 얼굴상 중심 보정: 실제 초상·좌우 치우침·그림 지연·불투명 배경·기존 중앙 구도. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(process.env.OUT||path.join(ROOT,'../output/portrait_centering'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files','--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}});
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|fonts\.|net::/.test(m.text()))errors.push(m.text());});
  await p.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await p.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>f.name==='loop'?0:raf(f);});
  await p.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'load',timeout:120000});await p.waitForFunction(()=>window.G&&G.Game&&G.Game.sceneName==='title'&&!G.Loader.shown(),null,{timeout:120000});
  const report=await p.evaluate(async()=>{
   const A=G.Art,I=G.Img,K=G.FX.portraitFace;
   const keys=['portraits/legendary/halina','portraits/legendary/verberk','portraits/legendary/joan_of_arc','portraits/legendary/cinderella','portraits/history/sky_inq','portraits/history/nw_montesinos','portraits/history/kifunji','portraits/history/jcsousa','portraits/legendary/im_scout','portraits/history/potosi_oidor','portraits/history/sky_micanzio','portraits/history/liuzongmin','portraits/legendary/hong_gildong','portraits/mates/rocco','portraits/mates/h_lizhi','portraits/mates/h_kunjali','portraits/mates/h_takatoshi'];
   const out=[],original=CanvasRenderingContext2D.prototype.drawImage;
   let draws=[];CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(this.canvas.width>4)draws.push({im,args,w:this.canvas.width,h:this.canvas.height});return original.call(this,im,...args);};
   const oldZone=K.deadZone;
   const rows=[];
   try{
    for(const key of keys){
     const im=await I.load(key);if(!im)throw new Error('초상 읽기 실패: '+key);
     const spec={img:[key],noFallback:true,noRole:true};
     K.deadZone=1;const before=A.portraitCanvas(spec,160);K.deadZone=oldZone;
     draws=[];const after=A.portraitCanvas(spec,160),d=draws.filter(d=>d.im===im).at(-1),f=G.PORTRAIT_FACES[key];
     const cx=(f.eyes[0]+f.eyes[2]+2*f.mouth[0])/4,iw=im.naturalWidth;
     let rendered=cx;
     if(d.args.length===4)rendered=(d.args[0]+cx*d.args[2])/d.w;
     else if(d.args.length===8)rendered=(cx*iw-d.args[0])/d.args[2];
     const changed=before.toDataURL()!==after.toDataURL();
     out.push({key,before:cx,after:rendered,changed,draw:d.args});rows.push({key,before,after});
    }
    // 아직 읽지 않은 그림도 도착한 뒤 같은 보정을 적용한다.
    {
     const key='portraits/mates/h_maxianglan',preloaded=I.status(key)==='ok',spec={img:[key],noFallback:true,noRole:true};
     draws=[];const after=A.portraitCanvas(spec,160),im=await I.load(key);await new Promise(r=>setTimeout(r,30));
     const d=draws.filter(d=>d.im===im).at(-1),f=G.PORTRAIT_FACES[key],cx=(f.eyes[0]+f.eyes[2]+2*f.mouth[0])/4;
     const rendered=d.args.length===4?(d.args[0]+cx*d.args[2])/d.w:(cx*im.naturalWidth-d.args[0])/d.args[2];
     K.deadZone=1;const before=A.portraitCanvas(spec,160);K.deadZone=oldZone;
     out.push({key,before:cx,after:rendered,changed:before.toDataURL()!==after.toDataURL(),preloaded,draw:d.args});rows.push({key,before,after});
    }
    // 배경이 불투명한 초상도 왼쪽·오른쪽 어느 방향이든 빈 띠가 생기지 않는다.
    for(const cx of [.38,.62,.5]){
     const key='portraits/test-centering-'+cx,im=new Image();const src=document.createElement('canvas');src.width=src.height=128;const c=src.getContext('2d');c.fillStyle='#765432';c.fillRect(0,0,128,128);c.fillStyle='#ffccaa';c.fillRect((cx-.1)*128,25,26,60);im.src=src.toDataURL();await im.decode();
     const get=I.get,pick=I.pick;I.get=k=>k===key?im:get(k);I.pick=chain=>chain.includes(key)?key:pick(chain);
     G.PORTRAIT_FACES[key]={box:[cx-.1,.2,.2,.45],eyes:[cx-.03,.35,cx+.03,.35],mouth:[cx,.55]};
     try{draws=[];const cv=A.portraitCanvas({img:[key],noFallback:true,noRole:true},64),draw=draws.filter(d=>d.im===im).at(-1),pixels=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
      const x=draw.args.length===8?(cx*128-draw.args[0])/draw.args[2]:cx;
      out.push({synthetic:cx,after:x,opaqueCorners:[0,cv.width-1,(cv.height-1)*cv.width,cv.width*cv.height-1].every(n=>pixels[n*4]===0x76&&pixels[n*4+1]===0x54)});
     }finally{I.get=get;I.pick=pick;delete G.PORTRAIT_FACES[key];}
    }
   }finally{CanvasRenderingContext2D.prototype.drawImage=original;K.deadZone=oldZone;}
   const root=document.createElement('div');root.id='centering-preview';root.style.cssText='position:fixed;inset:0;z-index:99999;background:#21190f;color:#eee0c0;overflow:auto;padding:24px;font:18px Malgun Gothic';
   root.innerHTML='<h2>얼굴상 표시 중심 수정 · 왼쪽 수정 전 / 오른쪽 수정 후</h2><div class="rows" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px"></div>';
   for(const row of rows){const cell=document.createElement('div');cell.innerHTML='<div style="font-size:15px;margin-bottom:8px">'+row.key.split('/').at(-1)+'</div>';cell.append(row.before,row.after);root.querySelector('.rows').appendChild(cell);}
   document.body.appendChild(root);return out;
  });
  for(const r of report){
   if(r.synthetic!=null){assert(Math.abs(r.after-.5)<.001,'불투명 초상 중앙');assert(r.opaqueCorners,'불투명 초상 가장자리');continue;}
   if(Math.abs(r.before-.5)>.055){assert(r.changed,r.key+' 표시 변경');assert(Math.abs(r.after-.5)<.012,r.key+' 눈·입 중앙');}
   else assert(!r.changed,r.key+' 원래 중앙 구도 유지');
  }
  await p.screenshot({path:path.join(OUT,'before-after.png'),animations:'disabled'});
  await p.locator('#centering-preview .rows > div').first().screenshot({path:path.join(OUT,'halina-before-after.png'),animations:'disabled'});
  await p.locator('#centering-preview').evaluate(e=>{e.style.height='auto';e.style.position='absolute';e.style.bottom='auto';e.style.overflow='visible';});await p.screenshot({path:path.join(OUT,'before-after-full.png'),fullPage:true,animations:'disabled'});
  await p.locator('#centering-preview').evaluate(e=>{e.style.display='none';});
  await p.evaluate(async()=>{
   G.State.newGame({name:'디오구 페헤이라',nation:'PT',job:'explorer',age:30,birth:{m:1,d:1},st:{str:65,int:65,mar:65,cha:65},sk:{},lg:G.LANGS.map(()=>3),diff:'normal'});
   const s=G.Game.state;s.settings.music=0;s.settings.sound=0;s.settings.autosave=false;G.State.save=()=>{};s.loc={mode:'city',city:24,lon:G.CITY_DATA[24].lon,lat:G.CITY_DATA[24].lat};
   s.mates.push({id:'halina',role:'none',loyal:90});G.UI.clearScreen();G.Game.showLayers(false,false,true);G.Game.setScene(G.Scenes.city.interior('tavern',G.CITY_DATA[24]));
   const key=Object.keys(G.IMAGE_FILES).find(k=>/^legend-events\/dutch_/.test(k));window.__centerPic=G.FamEv.showPic({img:key,title:'할리나 · 얼굴상 중심 수정 확인'});
   const pending=G.FamEv.pendingPic();if(pending)await pending;
   window.__centerSay=G.UI.say('왔군요! 서둘러요. 자루를 저 배로, 하나도 흘리지 말고.',{name:G.MATE.halina.name,portrait:G.Scenes.mateSpec('halina'),half:G.Img.chain.mateHalf('halina'),lang:3});
  });
  await p.locator('.dlg canvas[data-img="portraits/legendary/halina"]').waitFor();await p.screenshot({path:path.join(OUT,'halina-dialog.png'),animations:'disabled'});
  await p.locator('.modal-back.catch').last().evaluate(e=>e.click());await p.evaluate(async()=>{await window.__centerSay;if(window.__centerPic)await window.__centerPic.stop();});
  await p.evaluate(()=>{G.Info.open('mates');});await p.locator('.shipcard').filter({hasText:'할리나'}).scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,'halina-notebook.png'),animations:'disabled'});
  assert.deepStrictEqual(errors,[],'콘솔 오류');fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify({report,errors},null,2));
  console.log(JSON.stringify({portraits:report.filter(r=>r.key).length,synthetic:report.filter(r=>r.synthetic!=null).length,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
