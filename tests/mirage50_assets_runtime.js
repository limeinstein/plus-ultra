/* file:// 게임에서 50곳의 전용 그림과 실제 장면 재생을 확인한다. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {pathToFileURL}=require('url');
const {chromium}=require('../tools/procedural_art/node_modules/playwright-core');
const ROOT=path.resolve(__dirname,'..');
const ready=process.argv.includes('--ready');
const only=process.argv.includes('--only')?new Set(process.argv[process.argv.indexOf('--only')+1].split(',')):null;
const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/mirage_gifs/items.json'),'utf8')).filter(r=>(!only||only.has(r.id))&&(!ready||fs.existsSync(path.join(ROOT,'images/discoveries',r.id+'.gif'))));
assert(rows.length>0&& (ready||only||rows.length===50));
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>p&&fs.existsSync(p));
(async()=>{
  const browser=await chromium.launch({executablePath,headless:true,args:['--use-gl=swiftshader','--no-sandbox','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
  try{
    const page=await browser.newPage({viewport:{width:1152,height:940}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.G&&G.DISC&&G.Reel&&G.Scenes.discoveryPicture);
    const result=await page.evaluate(async rows=>{
      const missing=[],loaded=[],samples=[];
      for(const row of rows){
        const id=row.id,d=G.DISC[id];
        if(!d||!G.Scenes.hasReveal(d))missing.push(id+':발견 장면');
        for(const prefix of ['discoveries/','discovery-ends/','discovery-sheets/']){
          if(!G.Img.has(prefix+id))missing.push(prefix+id);
        }
        const reel=await G.Reel.load(G.Reel.key(d));
        const end=await G.Img.load('discovery-ends/'+id);
        const gif=await G.Img.load('discoveries/'+id);
        loaded.push({id,frames:reel&&reel.n,end:!!end,gif:!!gif});
      }
      document.body.innerHTML='<main style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px;background:#233034;color:#f5ecdc"></main>';
      const selected=rows.length<50?rows.map(r=>r.id):['parkguell','towerbridge','lotustemple','goryokaku','wtc','nasajsc'];
      for(const id of selected){
        const d=G.DISC[id],reel=await G.Reel.load(G.Reel.key(d));
        const card=document.createElement('section'),title=document.createElement('h3');
        title.textContent=d.realName||d.name;card.appendChild(title);
        const cv=G.Scenes.discoveryPicture(d);cv.style.width='100%';cv.style.height='auto';card.appendChild(cv);
        document.querySelector('main').appendChild(card);
        const off=document.createElement('canvas');off.width=576;off.height=256;off.style.display='none';document.body.appendChild(off);
        const player=G.Reel.play(off,reel,{ms:250});
        const first=off.toDataURL();await player.done;const last=off.toDataURL();off.remove();
        samples.push({id,changed:first!==last,tag:cv.tagName});
      }
      return {missing,loaded,samples};
    },rows);
    assert.deepEqual(result.missing,[]);
    assert.equal(result.loaded.length,rows.length);
    assert(result.loaded.every(r=>r.frames===18&&r.end&&r.gif),JSON.stringify(result.loaded));
    assert(result.samples.every(r=>r.changed&&r.tag==='CANVAS'),JSON.stringify(result.samples));
    await page.screenshot({path:path.join(ROOT,'docs/art/mirage50-runtime'+(only?'-fixes':'')+'.png'),fullPage:true});
    await page.goto(pathToFileURL(path.join(ROOT,'catalog.html')).href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>!!document.querySelector('[data-tab="discoveries"]'));
    const catalogMissing=await page.evaluate(ids=>ids.filter(id=>!G.DISC[id]||!G.Reel.key(G.DISC[id])),rows.map(r=>r.id));
    assert.deepEqual(catalogMissing,[],'도감에서 신기루 발견물 또는 재생 판 누락');
    await page.locator('[data-tab="discoveries"]').click();
    await page.locator('#q').fill('empirestate');
    await page.waitForFunction(()=>document.querySelectorAll('#grid .card').length===1&&document.querySelector('#grid canvas.reel'));
    await page.screenshot({path:path.join(ROOT,'docs/art/mirage50-catalog'+(only?'-fixes':'')+'.png'),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({count:rows.length,samples:result.samples,catalogMissing,errors}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
