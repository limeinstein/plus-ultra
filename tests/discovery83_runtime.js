/* 신규 발견물의 등록·실제 재생·마지막 장면과 file:// 로딩을 Chromium에서 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/discovery83/prompts.json'),'utf8'));
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&fs.existsSync(p));
(async()=>{
 const browser=await chromium.launch({executablePath,headless:true,args:['--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 try {
  const page=await browser.newPage({viewport:{width:960,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  // 네트워크가 필요 없는 로컬 게임 시험: 선택 웹 글꼴은 빈 스타일로 응답한다.
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href);
  await page.waitForFunction(()=>window.G&&G.DISC&&G.Reel&&G.Scenes.discoveryPicture);
  const status=await page.evaluate(async(ids)=>{
   const missing=ids.filter(id=>!G.DISC[id]||!G.Scenes.hasReveal(G.DISC[id])||!G.Reel.key(G.DISC[id])||!['discoveries/','discovery-ends/','discovery-sheets/'].every(prefix=>G.Img.has(prefix+id)));
   document.body.innerHTML='<main style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px;background:#232b2d;color:#eee"></main>';
   const selected=['guilin','tiantan','folk_zulu','folk_ainu','folk_tuva','folk_hawaii'];
   const samples=[];
   for(const id of selected){
    const d=G.DISC[id],L=await G.Reel.load(G.Reel.key(d));
    if(!L){samples.push({id,error:'장면 판 로딩 실패'});continue;}
    const card=document.createElement('section'),title=document.createElement('h3');title.textContent=d.name;card.appendChild(title);
    const cv=G.Scenes.discoveryPicture(d);cv.style.width='100%';cv.style.height='auto';card.appendChild(cv);document.querySelector('main').appendChild(card);
    const off=document.createElement('canvas');off.width=576;off.height=256;document.body.appendChild(off);off.style.display='none';
    const player=G.Reel.play(off,L,{ms:220});const first=off.toDataURL();await player.done;const last=off.toDataURL();off.remove();
    samples.push({id,frames:L.n,changed:first!==last,tag:cv.tagName});
   }
   return {count:ids.length,missing,samples};
  },rows.map(r=>r.id));
  await page.screenshot({path:path.join(ROOT,'docs/art/discovery83-runtime.png')});
  assert.equal(status.count,83);assert.deepEqual(status.missing,[]);
  assert(status.samples.every(s=>s.changed&&s.frames>=16&&s.tag==='CANVAS'),JSON.stringify(status.samples));
  await page.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href);
  await page.waitForFunction(()=>!!document.querySelector('[data-tab="discoveries"]'));
  await page.locator('[data-tab="discoveries"]').click();
  await page.locator('[data-chip="people"]').click();
  // 도감은 보이는 카드만 그리므로 실제 스크롤로 모든 민족 카드를 불러온다.
  const cards=page.locator('#grid .card');
  for(let i=0;i<await cards.count();i++) await cards.nth(i).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelectorAll('#grid canvas.reel').length>=36);
  const animatedPeople=await page.locator('#grid canvas.reel').count();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status,animatedPeople,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
