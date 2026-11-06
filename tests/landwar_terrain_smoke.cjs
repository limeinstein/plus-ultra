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
    await page.addScriptTag({path:path.join(ROOT,'js/data/seafx.js')});
    await page.addScriptTag({path:path.join(ROOT,'js/art/landwarterrain.js')});
    // 투명 가장자리는 합성 색으로 비교한다. SwiftShader의 색상 반올림(2/255)과 경계점 4픽셀 이내 차이만 허용한다.
    const pixels = await page.evaluate(() => {
      const cases = [], shapes = [];
      function different(a,b,i) {
        const aa=a[i+3],ba=b[i+3];if(Math.abs(aa-ba)>2)return true;
        for(let j=0;j<3;j++)if(Math.abs(a[i+j]*aa-b[i+j]*ba)>510)return true;
        return false;
      }
      for (const terr of Object.keys(G.FX.landwar.terrain.regions)) {
        const c = document.createElement('canvas'); c.width = 1000; c.height = 440;
        const ctx = c.getContext('2d', {willReadFrequently:true}), art = G.LandWarTerrain.create(terr,1000,440);
        const sides = ['me','en','me'], lanes = [140,262,384];
        function draw(feats,t=0) {ctx.clearRect(0,0,1000,440);art.draw(ctx,feats,sides,lanes,t);return ctx.getImageData(0,0,1000,440).data;}
        const a = draw(['stream',null,null]), same = draw(['stream',null,null]), moving = draw(['stream',null,null],1);
        let unstable=0, changed=0, sky=0, gaps=0, bottom=0, duplicateDiff=0, laneDiff=0;
        const start=G.FX.landwar.terrain.regions[terr].groundY, shape=[];
        for(let y=0;y<440;y++) {
          let row=0, sum=0;
          for(let x=0;x<1000;x++) {
            const i=(y*1000+x)*4;
            if(y<start)sky+=a[i+3];
            if(different(a,same,i))unstable++;
            if(a[i]!==moving[i]||a[i+3]!==moving[i+3])changed++;
            if(a[i+3]>230){row++;sum+=x;}
          }
          if(y>=start+24&&row===0)gaps++;
          if(y===439)bottom=row;
          if(y>=240&&y%30===0)shape.push(row?Math.round(sum/row):-1);
        }
        const duplicate=draw(['stream','stream','stream']);
        for(let i=0;i<a.length;i+=4)if(Math.abs(a[i+3]-duplicate[i+3])>2)duplicateDiff++;
        for(let lane=1;lane<3;lane++) {
          const feats=[null,null,null];feats[lane]='stream';const moved=draw(feats);
          for(let i=0;i<a.length;i+=4)if(Math.abs(a[i+3]-moved[i+3])>2)laneDiff++;
        }
        const dry=draw([null,null,null]);let dryPixels=0;
        for(let i=3;i<dry.length;i+=4)dryPixels+=dry[i];
        shapes.push(shape.join(','));cases.push({terr,sky,gaps,bottom,unstable,changed,duplicateDiff,laneDiff,dryPixels});
      }
      return {cases,uniquePaths:new Set(shapes).size};
    });
    fs.writeFileSync(path.join(OUT,'continuity-report.json'),JSON.stringify(pixels,null,2));
    for(const c of pixels.cases) {
      ok(c.sky===0&&c.gaps===0&&c.bottom>14,c.terr+': 지면부터 화면 맨 앞까지 물길이 끊기거나 흐려지지 않는다');
      ok(c.duplicateDiff<=4&&c.laneDiff<=8,c.terr+': 개울이 어느 칸에 있든 하나의 연속된 물길을 그린다');
      ok(c.dryPixels===0&&c.changed>200&&c.unstable<=32,c.terr+': 개울 없는 전장은 물길 없음·물살 움직임·고정 질감');
    }
    ok(pixels.uniquePaths===9,'9개 지형의 물길 경로가 각각 다르다');
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForFunction(() => window.G && G.State && G.LandWarTerrain && !G.Scenes.title.bootPending, null, {timeout: 120000});
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
      const actualFeatures=await page.evaluate(()=>G.Games._landDebug.state().feat.slice());
      const sample = await page.evaluate(({terr,actualFeatures}) => {
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
          if(Math.abs(b[i+3]-repeat[i+3])>2||[0,1,2].some(j=>Math.abs(b[i+j]*b[i+3]-repeat[i+j]*repeat[i+3])>510))unstable++;
        }
        const start=performance.now();for(let n=0;n<30;n++){ctx.clearRect(0,0,1000,440);art.draw(ctx,feats,sides,lanes,n/30);}
        window.__terrainPreview={canvas:c,ctx,art,feats,sides,lanes,terr};
        function composite(t) {
          ctx.clearRect(0,0,1000,440);G.Img.drawCover(ctx,G.Img.get('landwar/backgrounds/'+terr),-20,-20,1040,480,.5,.5);
          art.draw(ctx,feats,sides,lanes,t);return c.toDataURL('image/png').split(',')[1];
        }
        window.__terrainComposite=composite;
        const streamImage=composite(0);
        ctx.clearRect(0,0,1000,440);G.Img.drawCover(ctx,G.Img.get('landwar/backgrounds/'+terr),-20,-20,1040,480,.5,.5);
        art.draw(ctx,actualFeatures,sides,lanes,0);
        return {terr,hasStream:actualFeatures.includes('stream'),tree:G.FX.landwar.terrain.regions[terr].tree,treeMotion,waterMotion,unstable,msPerDraw:(performance.now()-start)/30,image:c.toDataURL('image/png').split(',')[1],streamImage};
      },{terr,actualFeatures});
      fs.writeFileSync(path.join(OUT,'regional-'+terr+'.png'),Buffer.from(sample.image,'base64')); delete sample.image;
      fs.writeFileSync(path.join(OUT,'watercourse-'+terr+'.png'),Buffer.from(sample.streamImage,'base64')); delete sample.streamImage;
      ok(sample.hasStream===['grass','jungle','tundra'].includes(terr),terr+': 실제 전장의 개울 유무 유지');
      ok(sample.treeMotion>100&&sample.waterMotion>200&&sample.unstable<=32,terr+': 나무 윤곽·수면 전체가 움직이고 같은 시간의 그림은 같다');
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
