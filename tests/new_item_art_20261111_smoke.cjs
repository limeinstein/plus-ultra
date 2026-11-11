/* 새 소지품 43종의 원화 읽기·실제 소지품·도감과 전체 그림 누락을 검사한다. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/new-item-art-20261111');
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art/new-item-prompts-20261111.json'), 'utf8'));
// 같은 작업 폴더에 다른 채팅의 발견물이 추가될 수 있으므로 처음 조사한 품목을 별도로 검증한다.
const BASELINE = JSON.parse(fs.readFileSync(path.join(ROOT,'tools/new_item_art_20261111_baseline.json'),'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const errors = [], watch = page => {
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  };
  const offline = page => page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body:'',contentType:'text/css' }));
  try {
    const page = await browser.newPage({ viewport:{width:1280,height:960} }); watch(page); await offline(page);
    await page.addInitScript(() => {
      const raf=window.requestAnimationFrame;
      window.requestAnimationFrame=fn=>fn.name==='loop'?0:raf(fn);
    });
    await page.goto(process.env.WEB_BASE ? new URL('index.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'index.html')).href, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, {timeout:120000});
    await page.waitForFunction(() => G.Loader && !G.Loader.shown(), null, {timeout:120000});
    const report = await page.evaluate(async assets => {
      const loaded = [];
      for (const asset of assets) {
        const item = G.ITEM[asset.id];
        if (!item || item.name !== asset.name || item.kind !== asset.kind) throw Error('자료 불일치: '+asset.id);
        const key = G.Img.pick(G.Img.chain.item(item));
        if (key !== 'items/'+item.id) throw Error('그림 연결: '+item.id+' → '+key);
        const image = new Image(), src = G.Img.itemSrc(item); if (/^https?:/.test(src)) image.crossOrigin = 'anonymous'; image.src = src; await image.decode();
        if (image.naturalWidth !== 256 || image.naturalHeight !== 256) throw Error('크기: '+item.id);
        const canvas = document.createElement('canvas'); canvas.width=canvas.height=256;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image,0,0);
        if (ctx.getImageData(0,0,1,1).data[3] !== 0) throw Error('투명도: '+item.id);
        loaded.push({id:item.id,key,width:image.naturalWidth,height:image.naturalHeight});
      }
      const all = Object.values(G.ITEM), missing = all.filter(it => {
        const key=G.Img.pick(G.Img.chain.item(it)); return !key || /^(item|relic)-kinds\//.test(key);
      }).map(it=>it.id);
      return {loaded,total:all.length,missing};
    }, SPEC.assets);
    assert.equal(report.loaded.length,SPEC.assets.length);
    const baselineIds = new Set(BASELINE.rows.map(r=>r.id));
    report.baselineTotal = baselineIds.size;
    report.baselineMissing = report.missing.filter(id=>baselineIds.has(id));
    report.addedDuringWorkMissing = report.missing.filter(id=>!baselineIds.has(id));
    assert.deepEqual(report.baselineMissing,[], '처음 조사한 전체 아이템의 그림 누락 없음');
    const discoveryWork = JSON.parse(fs.readFileSync(path.join(ROOT,'tools/discovery_art_20261111/prompts.json'),'utf8'));
    const coveredElsewhere = new Set(discoveryWork.assets.map(a=>a.itemId).filter(Boolean));
    assert(report.addedDuringWorkMissing.every(id=>coveredElsewhere.has(id)), '추가 등록된 미완성 유물은 진행 중인 발견 원화 작업에 포함');
    await page.evaluate(async ids => {
      const state=G.State.newGame({name:'새 소지품 그림 검사',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},
        st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
      G.Game.state=state; state.settings.res=.35; state.flags.prologue=true;
      state.player.items=ids.map(id=>({id}));
      await G.Game.ensureGeo();
      G.Game.go('sea',{depart:0});
      G.Info.open('items');
    }, SPEC.assets.map(a=>a.id));
    for (const id of ['wayland','kavacha','an_sanaa_pearls','pr_family_map','sm_clove']) {
      const row=page.locator('.items-tbl tr').filter({has:page.locator('canvas[data-img="items/'+id+'"]')});
      await row.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !G.Loader.shown());
      await page.waitForFunction(id=>{ const im=G.Img.get('items/'+id); return im && im.naturalWidth===256; },id);
      await page.screenshot({path:path.join(OUT,id+'-inventory.png')});
    }
    const catalog=await browser.newPage({viewport:{width:1280,height:960}}); watch(catalog); await offline(catalog);
    await catalog.goto((process.env.WEB_BASE ? new URL('catalog.html',process.env.WEB_BASE).href : pathToFileURL(path.join(ROOT,'catalog.html')).href)+'?view=assets#items');
    for (const id of ['wayland','pr_family_map']) {
      const asset=SPEC.assets.find(a=>a.id===id);
      await catalog.locator('#q').fill(asset.name);
      const card=catalog.locator('.card').filter({hasText:asset.name});
      await card.locator('.thumb canvas').waitFor(); await card.click();
      assert((await catalog.locator('#detail').innerText()).includes('items/'+id+'.webp'));
      await catalog.screenshot({path:path.join(OUT,id+'-catalog.png')});
      await catalog.locator('#detail').evaluate(d=>d.close());
    }
    assert.deepEqual(errors,[],'콘솔 오류 없음');
    fs.writeFileSync(path.join(OUT,'browser-check.json'),JSON.stringify({...report,errors,screenshots:7},null,2)+'\n');
    console.log('신규 원화 '+report.loaded.length+'종 로딩·256×256·투명 배경·소지품·도감 통과, 처음 조사한 '+report.baselineTotal+'종 누락 0 · 콘솔 오류 0');
    if (report.addedDuringWorkMissing.length) console.log('작업 중 추가된 유물 '+report.addedDuringWorkMissing.length+'종은 별도 발견 원화 작업에서 제작 중');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
