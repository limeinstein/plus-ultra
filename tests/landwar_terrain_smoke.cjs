/* 개울의 지면 경계·고정 질감·흐름과 9개 지역의 실제 육상전 적용을 file://에서 검사한다. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'tools/procedural_art/node_modules/playwright-core'));
const OUT = path.join(ROOT, 'artifacts/landwar-terrain-20261106');
fs.mkdirSync(OUT, { recursive: true });
const ok = (v, text) => { assert(v, text); console.log('✓ ' + text); };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: {width: 1440, height: 1000} });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.State && G.LandWarTerrain && !G.Scenes.title.bootPending, null, {timeout: 120000});
    const pixels = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 1000; c.height = 440;
      const ctx = c.getContext('2d', {willReadFrequently: true}), art = G.LandWarTerrain.create('grass', 1000, 440);
      const features = ['stream', 'stream', 'stream'], sides = ['me', 'en', 'me'], lanes = [140, 262, 384];
      function draw(t) { ctx.clearRect(0, 0, 1000, 440); art.draw(ctx, features, sides, lanes, t); return ctx.getImageData(0, 0, 1000, 440).data; }
      const a = draw(0), b = draw(0), d = draw(1);
      let sky = 0, unstable = 0, changed = [0, 0, 0], body = [0, 0, 0];
      for (let y = 0; y < 440; y++) for (let x = 0; x < 1000; x++) {
        const i = (y * 1000 + x) * 4, lane = y < 201 ? 0 : y < 323 ? 1 : 2;
        if (y < G.FX.landwar.terrain.groundY) sky += a[i + 3];
        if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) unstable++;
        if (a[i] !== d[i] || a[i + 3] !== d[i + 3]) changed[lane]++;
        if (a[i + 3] > 0) body[lane]++;
      }
      const start = performance.now(); for (let n = 0; n < 90; n++) art.draw(ctx, features, sides, lanes, n / 30);
      return {sky, unstable, changed, body, msPerDraw: (performance.now() - start) / 90};
    });
    ok(pixels.sky === 0, '개울 세 줄 모두 하늘·산 위로 올라가지 않는다');
    ok(pixels.unstable === 0, '같은 시간의 지형 질감·돌·풀이 완전히 같다');
    ok(pixels.changed.every(n => n > 40) && pixels.body.every(n => n > 500), '세 줄의 물길이 보이고 물살·갈대가 시간에 따라 움직인다');
    ok(pixels.msPerDraw < 20, '저장한 지형 재사용: 평균 ' + pixels.msPerDraw.toFixed(2) + 'ms');
    await page.evaluate(() => {
      G.State.newGame({name:'지형 확인',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:70,int:70,mar:70,cha:70},sk:{sword:3,shoot:3,gun:3},lg:[],diff:'normal'});
      const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0; s.settings.shake = false; s.settings.res = .35;
      s.loc = {mode:'city',city:0,lon:-9,lat:39};
    });
    const regional = [];
    for (const terr of ['grass','steppe','desert','forest','jungle','mountain','snow','tundra','ice']) {
      await page.evaluate(terr => {
        G.Games.landWar({enemy:{name:'지형 확인 부대',kind:'garrison',n:80,noSpecial:true},party:80,terr,guns:true});
        G.Games._landDebug.step(8);
      }, terr);
      await page.waitForFunction(terr => !!G.Img.get('landwar/backgrounds/' + terr), terr, {timeout: 30000});
      await page.waitForTimeout(150);
      await page.evaluate(() => G.Games._landDebug.draw());
      await page.locator('.lwar canvas').screenshot({path:path.join(OUT,terr + '.png')});
      const sample = await page.evaluate(terr => {
        const c = document.createElement('canvas'); c.width = 1000; c.height = 440;
        const ctx = c.getContext('2d', {willReadFrequently:true}), art = G.LandWarTerrain.create(terr,1000,440);
        const feats = ['woods','stream','hill'], sides = ['me','en','me'], lanes = [140,262,384];
        function draw(t) {ctx.clearRect(0,0,1000,440);art.draw(ctx,feats,sides,lanes,t);return ctx.getImageData(0,0,1000,440).data;}
        const a = draw(0), b = draw(1), repeat = draw(1);
        let treeMotion=0, waterMotion=0, unstable=0;
        for(let y=0;y<440;y++)for(let x=0;x<1000;x++) {
          const i=(y*1000+x)*4, changed=a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+3]!==b[i+3];
          if(changed&&y<225&&(x<440||x>560))treeMotion++;
          if(changed&&y>220&&y<310&&x>460&&x<540)waterMotion++;
          if(b[i]!==repeat[i]||b[i+3]!==repeat[i+3])unstable++;
        }
        const start=performance.now();for(let n=0;n<30;n++){ctx.clearRect(0,0,1000,440);art.draw(ctx,feats,sides,lanes,n/30);}
        window.__terrainPreview={canvas:c,ctx,art,feats,sides,lanes,terr};
        function composite(t) {
          ctx.clearRect(0,0,1000,440);G.Img.drawCover(ctx,G.Img.get('landwar/backgrounds/'+terr),-20,-20,1040,480,.5,.5);
          art.draw(ctx,feats,sides,lanes,t);return c.toDataURL('image/png').split(',')[1];
        }
        window.__terrainComposite=composite;
        return {terr,tree:G.FX.landwar.terrain.regions[terr].tree,treeMotion,waterMotion,unstable,msPerDraw:(performance.now()-start)/30,image:composite(0)};
      },terr);
      fs.writeFileSync(path.join(OUT,'regional-'+terr+'.png'),Buffer.from(sample.image,'base64')); delete sample.image;
      ok(sample.treeMotion>100&&sample.waterMotion>200&&sample.unstable===0,terr+': 나무 윤곽·수면 전체가 움직이고 같은 시간의 그림은 같다');
      regional.push(sample);
      if (terr === 'forest' || terr === 'jungle') {
        const frames = path.join(OUT,'motion-'+terr);fs.mkdirSync(frames,{recursive:true});
        for(let n=0;n<24;n++) {
          const frame=await page.evaluate(t=>window.__terrainComposite(t),n/12);
          fs.writeFileSync(path.join(frames,String(n).padStart(2,'0')+'.png'),Buffer.from(frame,'base64'));
        }
      }
      // 실제 전투의 세 위치에 물길을 강제로 배치해 맨 위·아래 경계와 겹침을 함께 검수한다.
      if (terr === 'grass') {
        await page.evaluate(() => {G.Games._landDebug.state().feat.splice(0,3,'stream','stream','stream');G.Games._landDebug.draw();});
        await page.locator('.lwar canvas').screenshot({path:path.join(OUT,'stream-three-lanes.png')});
      }
      await page.evaluate(() => G.Games._landDebug.close());
      ok(true, terr + ': 전투 화면 적용·닫기');
    }
    ok(errors.length === 0, 'pageerror·console.error 0: ' + errors.join(' | '));
    ok(new Set(regional.map(r=>r.tree)).size===9,'9개 지역의 식생 형태를 각각 구별한다');
    fs.writeFileSync(path.join(OUT,'report.json'), JSON.stringify({pixels,regional,errors},null,2));
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode = 1;});
