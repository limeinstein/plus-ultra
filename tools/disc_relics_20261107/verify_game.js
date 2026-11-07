/* 발견 유물 원화: 실제 획득 카드와 소지품 그림을 확인하고 화면을 보관한다. */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/art/disc-relics-20261107-game');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1360, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, {timeout:120000});
    await page.evaluate(async () => {
      G.State.newGame({name:'원화 확인',nation:'PT',job:'explorer',age:24,birth:{m:1,d:1},st:{str:60,int:60,mar:60,cha:60},sk:{},lg:[],diff:'normal'});
      G.Game.state.settings.res = 0.35;
      await G.Game.ensureGeo();
      G.Game.go('sea', {depart:0});
      G.UI.say = async () => {};
      G.UI.ask = async (t,o) => o[0].value;
      G.UI.alert = async () => {};
      G.UI.toast = () => {};
      G.Scenes.discoveryReveal = async () => {};
      G.Scenes.discoveryVoices = async () => {};
      if (G.Mirage) G.Mirage.vanish = async () => {};
      if (G.Names) G.Names.offer = async () => {};
      const original = G.UI.window;
      window.__qaWindows = [];
      G.UI.window = function(o) { const w = original.apply(this, arguments); window.__qaWindows.push(w); return w; };
    });
    for (const id of ['tiger','mermaid','notredame']) {
      await page.evaluate(id => { window.__qaFind = G.Disc.find(G.DISC[id], G.DISC[id].how); }, id);
      await page.waitForSelector('.disc-card', {timeout:30000});
      const relicId = id === 'tiger' ? 'r_tiger_baby' : id === 'mermaid' ? 'r_mermaid_legend' : 'r_notredame_holy';
      const box = page.locator('[data-relic="' + relicId + '"]');
      await box.scrollIntoViewIfNeeded();
      await page.waitForFunction(rid => {
        const e = document.querySelector('[data-relic="'+rid+'"] canvas');
        return e && e.dataset.img === 'relics/'+rid && !!G.Img.get('relics/'+rid);
      }, relicId);
      await page.screenshot({path:path.join(out, id+'-discovery.png')});
      const check = await page.evaluate(rid => {
        const image = G.Img.get('relics/'+rid);
        return {src:G.Img.file('relics/'+rid), width:image.naturalWidth};
      }, relicId);
      assert(check.src.includes(relicId+'.webp') && check.width === 256, id+' 발견 카드 원화 연결');
      await page.evaluate(async () => { window.__qaWindows.at(-1).close(1); await window.__qaFind; });
      console.log('확인: '+id+' 발견 카드 → '+relicId);
    }
    await page.evaluate(() => { G.Info.open('items'); });
    for (const rid of ['r_tiger_baby','r_mermaid_legend','r_notredame_holy']) {
      const item = page.locator('.items-tbl tr').filter({has:page.locator('canvas[data-img="relics/'+rid+'"]')});
      await item.scrollIntoViewIfNeeded();
      await page.waitForFunction(rid => { const cv=document.querySelector('.items-tbl canvas[data-img="relics/'+rid+'"]'); const img=G.Img.get('relics/'+rid); return cv && img && img.naturalWidth===256; },rid);
      await page.screenshot({path:path.join(out, rid+'-inventory.png')});
      console.log('확인: 소지품 → '+rid);
    }
    await page.evaluate(() => { window.__qaWindows.at(-1).close(null); });
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    fs.writeFileSync(path.join(out,'verification.json'), JSON.stringify({discoveries:['tiger','mermaid','notredame'],icons:256,consoleErrors:errors,screenshots:6},null,2)+'\n');
    console.log('게임 화면 6장 저장 · 콘솔 오류 0');
  } finally { await browser.close(); }
})().catch(e=>{ console.error(e); process.exitCode=1; });
