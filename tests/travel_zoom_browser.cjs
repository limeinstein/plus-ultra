/* 실제 항해·탐험 화면에서 창 크기, 화질, 카메라 배율을 따로 바꿔 본다. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const root = path.resolve(__dirname, '..');
const out = process.env.OUT || path.join(root, 'tmp/travel-zoom-qa/views');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist']
  });
  try {
    fs.mkdirSync(out, { recursive: true });
    const page = await browser.newPage({ viewport: { width:1280, height:720 } });
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { requestAnimationFrame = () => 0; });
    await page.goto((process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(root, 'index.html')).href), { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.State && G.Img.count(), null, { polling:100 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = Object.fromEntries(G.SKILLS.map(k => [k.id,1]));
      const s = G.Game.state = G.State.newGame({name:'배율 검사',nation:'PT',job:'explorer',age:24,
        birth:{m:4,d:12},st:{str:60,int:60,mar:60,cha:60},sk,lg:G.LANGS.map(() => 1),diff:'normal'});
      s.flags.prologue = true;
      s.settings.res = 1;
      s.fleet.crew = 60;
      s.known = [0];
      G.State.save = () => {};
      G.UI.toast = () => {};
      G.Rain.weather = () => ({cloud:0,storm:0});
      const city = G.CityIcon.plan(G.CITY_DATA[0]);
      await Promise.all([G.TerrainArt.ready, ...['map-cities/'+city.culture,'map-cities/quays',
        ...city.parts.map(p => p.art.key)].map(key => G.Img.load(key))]);
    });
    const shots = [];
    for (const scene of ['sea','land']) {
      const start = await page.evaluate(scene => {
        G.Game.go(scene, scene === 'sea' ? {depart:0,fresh:true} : {from:0});
        const st = G.Game.scene.runtime(), s = G.Game.state, city = G.CITY_DATA[0];
        const zoom = st.cam.zoom, warm = G.Game.warmView(s,scene).zoom;
        if (scene === 'sea') {
          st.target = {city,lon:city.lon,lat:city.lat};
          st.npcs = [];
        } else {
          s.loc.lon = -55; s.loc.lat = -3;
        }
        st.cam.lon = s.loc.lon; st.cam.lat = s.loc.lat;
        st.paused = true; st.busy = 1; st.dayAcc = -1e6;
        return {zoom,warm};
      }, scene);
      assert.equal(start.zoom, start.warm);
      for (const width of [1280,800]) {
        const height = width*9/16;
        await page.setViewportSize({width,height});
        await page.evaluate(w => {
          G.Game.state.settings.res = w === 800 ? .5 : 1;
          window.dispatchEvent(new Event('resize'));
        }, width);
        for (const zoom of [110,start.zoom,330]) {
          const result = await page.evaluate(({zoom,scene}) => {
            const st = G.Game.scene.runtime(), renderer = G.Game.renderer;
            st.cam.zoom = zoom; st.cam.zoomT = 0;
            const city = G.CITY_DATA[0];
            if (scene === 'sea') G.CityIcon.site(city,G.CityIcon.plan(city),G.CityIcon.view(city,{zoom}),true);
            renderer.invalidate();
            const tick = () => { st.rframe = 2; G.Game.scene.update(0); };
            tick();
            for (let frame=0; frame<400 && G.TerrainArt.stats().pendingChunks; frame++) tick();
            tick();
            const gl = renderer.gl, mark = st.cityMarks?.[0];
            const boxes = mark?.boxes?.map(b => [b[0]-mark.anchorX,b[1]-mark.y,b[2]-b[0],b[3]-b[1]]);
            return {zoom,scene,bufferWidth:renderer.canvas.width,landZoom:gl.getUniform(renderer.progLand,renderer.uL.uLandZoom),
              stats:G.TerrainArt.stats(),boxes,hit:mark?.boxes.every(b => G.CityIcon.hit(mark,(b[0]+b[2])/2,(b[1]+b[3])/2))};
          }, {zoom,scene});
          assert.equal(result.landZoom,zoom);
          assert.equal(result.stats.pendingChunks,0);
          assert(result.stats.trees > 0);
          if (scene === 'sea') assert(result.hit && result.boxes.length > 1);
          shots.push({...result,width});
          await page.screenshot({path:path.join(out,`${scene}-${width}-${zoom}.png`)});
        }
      }
      if (scene === 'sea') {
        await page.getByRole('button',{name:'기본 배율로 돌아가기',exact:true}).click();
        assert.equal(await page.evaluate(() => G.Scenes.sea.runtime().cam.zoomT),start.zoom);
        for(const zoom of [110,330]){
          const point=await page.evaluate(zoom=>{
            const s=G.Game.state,st=G.Scenes.sea.runtime(),city=G.CITY_DATA[0];
            st.cam.zoom=zoom;st.cam.zoomT=0;st.path=null;st.target=null;
            st.cam.lon=s.loc.lon=city.lon-718/zoom;st.cam.lat=s.loc.lat=city.lat;st.busy=1;
            st.rframe=2;G.Scenes.sea.update(0);st.busy=0;
            const rect=G.Game.canvases().overlay.getBoundingClientRect();
            for(const box of st.cityMarks[0].boxes){
              const x=(box[0]+box[2])/2,y=(box[1]+box[3])/2;
              const px=rect.left+x*rect.width/1600,py=rect.top+y*rect.height/900;
              if(x>1450&&x<1600&&document.elementFromPoint(px,py)?.closest('.mapcatch'))return [px,py];
            }
            throw Error('오른쪽 가장자리에 선택할 건물이 없음');
          },zoom);
          await page.mouse.click(...point);
          assert.equal(await page.evaluate(()=>G.Scenes.sea.runtime().target?.city?.id),0);
        }
      }
    }
    const base = shots.find(s => s.scene === 'sea');
    for (const row of shots.filter(s => s.scene === 'sea')) {
      assert.equal(row.boxes.length,base.boxes.length);
      row.boxes.forEach((b,i) => b.forEach((v,j) => assert(Math.abs(v-base.boxes[i][j]*row.zoom/base.zoom)<.01)));
    }
    // 같은 숲의 가운데를 같은 면적으로 줄여 겹친다. 좌표·수종·수관이 바뀌면 픽셀 차이가 커진다.
    const forest = await page.evaluate(() => {
      const camera = {lon:-55,lat:-3,zoom:110}, art = G.TerrainArt;
      const full = document.createElement('canvas'); full.width=1600; full.height=900;
      const ctx=full.getContext('2d');
      function sample(zoom) {
        camera.zoom=zoom;
        const project=(x,y) => [800+G.Geo.wrapLon(x-camera.lon)*zoom,450-(y+G.Terrain.lift(x,y)-camera.lat)*zoom];
        for(let frame=0;frame<400;frame++){
          ctx.clearRect(0,0,1600,900); art.draw(ctx,camera,project,null);
          if(!art.stats().pendingChunks)break;
        }
        if(art.stats().pendingChunks)throw Error('숲 구역 준비 시간 초과');
        const crop=document.createElement('canvas');crop.width=360;crop.height=180;
        const c=crop.getContext('2d'),k=zoom/110;
        c.imageSmoothingQuality='high';
        c.drawImage(full,800-180*k,450-90*k,360*k,180*k,0,0,360,180);
        return c.getImageData(0,0,360,180).data;
      }
      const a=sample(110),b=sample(330);
      function compare(a,b){
        let error=0,area=0;
        for(let i=3;i<a.length;i+=4){error+=Math.abs(a[i]-b[i]);area+=Math.max(a[i],b[i]);}
        return {coverage:area/(255*360*180),difference:error/area};
      }
      const settled=compare(a,b);
      sample(110);camera.zoomT=330;
      const moving=sample(123);camera.zoomT=0;
      const alignment=compare(moving,sample(123));
      sample(110);
      const before=art.stats().plateBuilds,frames=48,times=[];
      const project=(x,y) => [800+G.Geo.wrapLon(x-camera.lon)*camera.zoom,450-(y+G.Terrain.lift(x,y)-camera.lat)*camera.zoom];
      for(let i=1;i<=frames;i++){
        const out=i>frames/2;
        camera.zoomT=out?110:330;
        camera.zoom=110*3**(out?2-i*2/frames:i*2/frames);
        ctx.clearRect(0,0,1600,900);art.draw(ctx,camera,project,null);
        times.push(art.stats().drawMs);
      }
      times.sort((x,y)=>x-y);
      return {...settled,movingDifference:alignment.difference,frames,rebuilds:art.stats().plateBuilds-before,p95:times[Math.floor(frames*.95)]};
    });
    assert(forest.coverage>.1 && forest.difference<.18,JSON.stringify(forest));
    assert(forest.movingDifference<.08,JSON.stringify(forest));
    assert(forest.rebuilds<forest.frames/2,JSON.stringify(forest));
    const crossing = await page.evaluate(() => {
      const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
      const ctx=canvas.getContext('2d'),stroke=ctx.stroke;
      let deck=0;
      ctx.stroke=function(){if(this.strokeStyle==='#393125')deck=this.lineWidth;stroke.call(this);};
      for(const route of G.Hydro.routes())for(const site of route.crossings){
        if(!G.Hydro.crossingOpen(site))continue;
        const widths=[110,330].map(zoom=>{
          deck=0;
          const project=(x,y)=>[800+G.Geo.wrapLon(x-site.lon)*zoom,450-(y+G.Terrain.lift(x,y)-site.lat)*zoom];
          G.TerrainArt.draw(ctx,{lon:site.lon,lat:site.lat,zoom},project,null);
          return deck;
        });
        if(widths.every(w=>w>0))return widths;
      }
      throw Error('화면에 표시된 다리·나루를 찾지 못했습니다');
    });
    assert(Math.abs(crossing[1]-3*crossing[0])<.001);
    for (const row of shots.filter(s => s.width === 800)) {
      const large = shots.find(s => s.width === 1280 && s.scene === row.scene && s.zoom === row.zoom);
      assert(row.bufferWidth < large.bufferWidth);
      assert.equal(row.stats.trees, large.stats.trees);
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...await page.evaluate(()=>({version:G.Scenes.title.version,channel:window.PU_WEB_CHANNEL||'stable'})),shots,forest,crossing,errors},null,2));
    console.log('항해·탐험 배율 검사 통과',shots.length,forest);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
