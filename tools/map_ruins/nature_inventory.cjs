/* 자연 명소에 이미 연결된 지도 그림과 새로 필요한 그림을 확인한다. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('../procedural_art/node_modules/playwright-core');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'artifacts/nature-landmarks-20261127');

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files']});
  try {
    const page=await browser.newPage();
    await page.addInitScript(()=>requestAnimationFrame=()=>0);
    await page.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded',timeout:180000});
    if(process.argv.includes('--ground')){
      const data=await page.evaluate(async(reuse)=>{
        await G.Game.ensureGeo();
        const out={}, errors=[];
        Object.entries(G.NATURE_LANDMARKS).forEach(([id,r])=>{
          const d=G.DISC[id];
          if(d.how==='sea'||d.how==='special')return;
          if(reuse&&G.NatureLandmark.bakedPoint(d,r)){out[id]=G.NATURE_FOOTINGS[id];return;}
          const fit=G.NatureLandmark.scan(d,r);
          if(!fit.dry)errors.push(id);
          else out[id]=[d.lon,d.lat,...fit.point,fit.width,...r.slice(3,7)];
        });
        return {out,errors};
      },process.argv.includes('--reuse'));
      if(data.errors.length)throw new Error(`뭍에 닿는 발치 없음 ${data.errors.join(', ')}`);
      const body=Object.entries(data.out).map(([id,entry])=>`  ${JSON.stringify(id)}: ${JSON.stringify(entry)}`).join(',\n');
      fs.writeFileSync(path.join(root,'js/data/nature_footings.js'),
        '/* tools/map_ruins/nature_inventory.cjs --ground가 검사한 뭍 위치와 그림 폭. */\n'+
        "(function (G) { 'use strict';\nG.NATURE_FOOTINGS = {\n"+body+"\n};\n})(window.G = window.G || {});\n",'utf8');
      console.log(`육지 접지 ${Object.keys(data.out).length}곳을 기록했습니다.`);
      return;
    }
    const rows=await page.evaluate(()=>G.DISCOVERIES.filter(d=>d.cat==='nature'||d.natural).map(d=>({
      id:d.id,name:d.name,cat:d.cat,natural:!!d.natural,how:d.how,lon:d.lon,lat:d.lat,region:d.reg,desc:d.desc,
      source:G.DiscoveryIcon.source(d),terrain:!!G.TerrainArt.has(d.id),formation:!!G.Terrain.formationFor(d.id),
      future:!!(G.Disc.isFuture(d)||d.mirage50||d.alwaysMirage||d.mirageFrom)
    })));
    fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(rows,null,2));
    console.log(`자연 발견물 ${rows.length}, 지도 원화 ${rows.filter(d=>d.source).length}`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
