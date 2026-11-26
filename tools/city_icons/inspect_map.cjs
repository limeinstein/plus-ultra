/* 기존 게임의 카메라와 조작 영역을 그대로 두고 도시 그림만 교체해 촬영한다. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('../procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'artifacts/city-icons-large-20261126');
const PREVIOUS = path.join(ROOT, 'artifacts/city-icons-terrain-20261126');
const {cities, year} = JSON.parse(fs.readFileSync(path.join(OUT, 'cities.json'), 'utf8'));
const {rows,quays} = JSON.parse(fs.readFileSync(path.join(OUT, 'verified-stamps.json'), 'utf8'));
const previousRows = JSON.parse(fs.readFileSync(path.join(PREVIOUS, 'verified-stamps.json'), 'utf8')).rows;
const gameDir = path.join(OUT, 'game');
fs.mkdirSync(gameDir, {recursive:true});

(async () => {
  const browser = await chromium.launch({
    executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args:['--allow-file-access-from-files','--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist']
  });
  const errors = [], report = [];
  try {
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
    await page.addInitScript(() => { requestAnimationFrame=()=>0; });
    await page.goto(pathToFileURL(path.join(ROOT,'index.html')).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Game && G.State);
    await page.evaluate(() => G.Game.ensureGeo());
    await page.evaluate(() => G.TerrainArt.ready);
    await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'map_placement.js'),'utf8')});
    await page.evaluate(async ({cities, rows, previousRows, quays, year, assetRoot}) => {
      const sk={};
      G.SKILLS.forEach(x=>sk[x.id]=1);
      const s = G.Game.state = G.State.newGame({
        name:'도시 아이콘 비교',nation:'PT',job:'explorer',age:24,birth:{m:4,d:12},
        st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(()=>1),diff:'normal'
      });
      s.date={y:year,m:5,d:15}; s.known=cities.map(c=>c.id);
      s.settings.res=.66; s.flags.prologue=true; s.settings.sound=0; s.settings.music=0;
      s.fleet.ships=[G.R.newShip('caravel')]; s.fleet.crew=60; s.fleet.food=2000; s.fleet.water=2000;
      G.State.save=()=>{}; G.Rain.weather=()=>({cloud:0,storm:0}); G.UI.toast=()=>{};
      for (const city of cities) {
        const d=G.DISC[city.landmark], c=G.CITY_DATA[city.id], f=G.R.facilities(c);
        if (!d || d.city!==c.id || d.mirageFrom || G.Disc.isFuture(d) || d.built>year || !!f.harbor!==city.facilities.harbor) {
          throw Error('본편 자료와 시안이 다릅니다. '+city.name);
        }
      }
      async function image(root,id) {
        const img=new Image(); img.src=new URL(id+'.webp',root).href;
        await img.decode();
        return img;
      }
      const assets=Object.fromEntries(await Promise.all(cities.map(async city=>{
        const row=rows.find(r=>r.id===city.key+'-c');
        const previous=previousRows.find(r=>r.id===row.id);
        const parts=quays[city.key] || [];
        const [land,...docks]=await Promise.all([
          image(assetRoot,row.land.id),
          ...parts.map(part=>image(assetRoot,part.id))
        ]);
        return [city.id,{land,previous,row,parts,images:Object.fromEntries(parts.map((part,i)=>[part.id,docks[i]]))}];
      })));
      const originalAsset=G.CityIcon.asset, originalDraw=G.CityIcon.draw, metrics=G.CityIcon.metrics;
      const originalSprite=G.TerrainArt.sprite;
      const blank=document.createElement('canvas');blank.width=blank.height=1;
      window.__cityMode='previous'; window.__citySeen={}; window.__trees=[];
      G.TerrainArt.sprite=function(ctx,id,x,y,w,h) {
        const painted=originalSprite(ctx,id,x,y,w,h);
        if (painted && id.startsWith('tree-') && ctx.canvas.width>1600) {
          window.__trees.push([x+w/2,y+h*.93,h]);
        }
        return painted;
      };
      G.CityIcon.asset=function(c,o) {
        return window.__cityPlacement?.cityId===c.id ? {canvas:blank,width:1,height:1} : originalAsset(c,o);
      };
      function drawPart(ctx,img,x,y,width,anchor) {
        const left=x-width*anchor[0], top=y-width*anchor[1];
        const h=width*img.height/img.width;
        ctx.drawImage(img,left,top,width,h);
        return [left,top,left+width,top+h];
      }
      window.__cityPlan=function(c) {
        const asset=assets[c.id], scene=G.Scenes[G.Game.sceneName], st=scene.runtime();
        const [x,y]=scene.toScreen(c.lon,c.lat);
        const worldAt=(dx,dy)=>{
          const shift=st.qo || [0,0];
          const lon=st.cam.lon+(x+dx-800-shift[0])/st.cam.zoom;
          const lat=st.cam.lat-(y+dy-450-shift[1])/st.cam.zoom;
          return G.Terrain.unproject(lon,lat);
        };
        let direction=[0,1];
        if(c.dock) {
          const [a,b]=scene.toScreen(c.dock[1],c.dock[0]);
          const d=Math.hypot(a-x,b-y)||1;
          direction=[(a-x)/d,(b-y)/d];
        }
        const plan = row => {
          const width=window.__cityClose?row.zoomWidth:row.width;
          return {width,...G.CityTerrainPreview(row.land,asset.parts,width,worldAt,direction)};
        };
        window.__cityPlacement={cityId:c.id,previous:plan(asset.previous),proposal:plan(asset.row)};
      };
      G.CityIcon.metrics=function(c,scale) {
        const data=metrics(c,scale), seen=window.__citySeen[c.id];
        return seen ? {...data,radius:Math.max(data.radius,seen.right+1)} : data;
      };
      G.CityIcon.draw=function(ctx,c,x,y,opts) {
        const asset=assets[c.id], placement=window.__cityPlacement;
        if(asset && placement?.cityId===c.id) {
          const plan=placement[window.__cityMode],width=plan.width;
          const base=window.__cityMode==='previous'?asset.previous.land:asset.row.land;
          ctx.save();
          ctx.imageSmoothingEnabled=true;
          const bounds=drawPart(ctx,asset.land,x+plan.city.dx,y+plan.city.dy,width,base.origin);
          const q=plan.quay;
          const harbor=q?drawPart(ctx,asset.images[q.id],x+q.dx,y+q.dy,q.width,q.origin):null;
          ctx.restore();
          const height=base.feet.landmark[0][1]*width;
          const trees=window.__trees.filter(([tx,ty])=>Math.hypot(tx-x-plan.city.dx,ty-y-plan.city.dy)<=115);
          const treeHeight=Math.max(0,...trees.map(t=>t[2]));
          window.__citySeen[c.id]={width, right:Math.max(bounds[2],harbor?harbor[2]:0)-x, bounds, harbor,
            cityHeight:bounds[3]-bounds[1],
            landmarkHeight:height, treeHeight, nearbyTrees:trees.length, ...plan};
          const scale=opts?.scale || 1;
          const foot=Object.values(base.feet).flat().reduce((low,p)=>p[1]>low[1]?p:low,base.origin);
          const stripeX=bounds[0]+foot[0]*width;
          const stripeY=bounds[1]+foot[1]*width+3;
          return originalDraw(ctx,c,stripeX,stripeY-metrics(c,scale).base,opts);
        }
        return originalDraw(ctx,c,x,y,opts);
      };
      window.__cityTick=function(){
        const st=G.Scenes[G.Game.sceneName].runtime();
        st.rframe=2; st.busy=1; st.paused=true; st.dayAcc=-1e6;
        G.Game.scene.update(.016);
      };
    }, {cities,rows,previousRows,quays,year,assetRoot:pathToFileURL(path.join(OUT,'map-stamps')+path.sep).href});

    for (const city of cities) {
      for (const close of [false,true]) {
        const view=close?'close':'basic';
        const shot=await page.evaluate(async ({city,close})=>{
          const s=G.Game.state,c=G.CITY_DATA[city.id];
          const zone=city.facilities.harbor?'sea':'land';
          if (G.Game.sceneName!==zone) {
            if (zone==='land') await G.Game.go('land',{from:city.id});
            else {
              s.loc={mode:'sea',lon:c.dock[1],lat:c.dock[0],heading:0};
              await G.Game.go('sea',{fresh:true});
            }
          }
          const st=G.Scenes[zone].runtime();
          const zoom=zone==='land'?(close?540:180):(close?330:110);
          const origin=zone==='sea'?[c.dock[1],c.dock[0]]:[c.lon-.44,c.lat-.24];
          // 도시와 이동 주체를 같은 프레임에서 볼 수 있는 가까운 지점을 고른다.
          const gap=(close?142:125)/zoom;
          const goal=[c.lon-gap,c.lat+(zone==='sea'?-.7:.42)*gap];
          let actor=origin;
          if(zone==='sea') actor=G.Nav.nearestSea(goal[0],goal[1],11) || origin;
          else {
            for (let i=0;i<16;i++) {
              const a=i*Math.PI/8+.8, candidate=[c.lon-Math.cos(a)*gap,c.lat+Math.sin(a)*gap];
              if (G.Geo.canWalk(...candidate,{date:s.date,mount:{id:'walk'}})) {actor=candidate;break;}
            }
          }
          s.loc.lon=actor[0];s.loc.lat=actor[1];
          st.cam.lon=(actor[0]+c.lon)/2;st.cam.lat=(actor[1]+c.lat)/2;st.cam.zoom=zoom;st.cam.zoomT=0;
          st.t=24;st.busy=1;st.paused=true;
          if(zone==='sea') {st.npcs=[]; st.target={lon:c.lon,lat:c.lat,city:c};}
          else {st.trail=[];}
          G.Game.renderer.invalidate();
          G.TerrainArt.invalidate();
          window.__trees=[];
          window.__cityMode='previous';window.__citySeen={};window.__cityClose=close;
          window.__cityPlan(c);
          __cityTick();
          return {zone,zoom,actor,city:city.coords,scene:G.Game.sceneName};
        },{city,close});
        for (let i=0;i<9;i++) await page.evaluate(()=>__cityTick());
        const previous=await page.evaluate(id=>window.__citySeen[id],city.id);
        await page.screenshot({path:path.join(gameDir,`${city.key}-${view}-before.png`)});
        const seen=await page.evaluate(id=>{window.__cityMode='proposal';__cityTick();__cityTick();return window.__citySeen[id];},city.id);
        const card=rows.find(r=>r.id===city.key+'-c');
        assert.equal(seen?.width,close?card.zoomWidth:card.width,city.key+' 표시 너비');
        assert.equal(seen.width,previous.width*2,city.key+' 확대 비율');
        assert(Math.abs((seen.bounds[3]-seen.bounds[1])/(previous.bounds[3]-previous.bounds[1])-2)<.01,city.key+' 세로 확대 비율');
        assert.equal(seen.city.dry,seen.city.count,city.key+' 건물의 발치');
        assert.equal(seen.city.corners,seen.city.edgeCount,city.key+' 건물 발치의 둘레');
        assert.equal(!!seen.quay,city.facilities.harbor,city.key+' 강둑 부두와 수면 위 배');
        await page.screenshot({path:path.join(gameDir,`${city.key}-${view}-proposal.png`)});
        report.push({...shot,key:city.key,view,seen,previous});
        console.log(city.key,view,seen.width,'land',seen.city.dx,seen.city.dy,'dock',seen.quay?.id ?? '-',
          'height',Math.round(seen.cityHeight),'tree',Math.round(seen.treeHeight));
      }
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(gameDir,'report.json'),JSON.stringify({report,errors},null,2));
    const low=report.filter(({seen})=>seen.cityHeight<=seen.treeHeight);
    assert.deepEqual(low.map(({key,view,seen})=>[key,view,seen.cityHeight,seen.treeHeight]),[]);
    const blocks=cities.map(c=>`<section><h2>${c.name}</h2>${['basic','close'].map(view=>
      '<h3>'+(view==='basic'?'기본':'확대')+'</h3><div>'+['before','proposal'].map(mode=>`<figure><figcaption>${mode==='before'?'이전 C안':'대도시 가로·세로 2배'}</figcaption><a href="${c.key}-${view}-${mode}.png"><img loading="lazy" src="${c.key}-${view}-${mode}.png" alt="${c.name} ${mode==='before'?'이전':'수정안'}"></a></figure>`).join('')+'</div>'
    ).join('')}</section>`).join('');
    fs.writeFileSync(path.join(gameDir,'index.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>게임 화면 아이콘 비교</title><style>body{margin:24px auto;max-width:1380px;padding:0 16px;background:#eeeade;color:#292e27;font:16px system-ui,sans-serif}
    div{display:grid;grid-template-columns:1fr 1fr;gap:9px}figure{margin:0}figcaption{margin-bottom:6px}img{width:100%;display:block}
    section{margin:30px 0;border-top:1px solid #c5bbab}a{color:#29624e}@media(max-width:600px){div{grid-template-columns:1fr}}</style>
    <h1>대도시 크기와 해안 배치</h1><p><a href="../index.html">25종 갤러리</a> · 같은 카메라에서 이전 C안과 수정 C안을 비교했습니다. 지도 1600×900 기준으로 수정안의 본체 너비는 기본 112픽셀, 확대 132픽셀입니다.</p>${blocks}</html>`,'utf8');
  } finally {
    await browser.close();
  }
})().catch(e=>{console.error(e); process.exitCode=1;});
