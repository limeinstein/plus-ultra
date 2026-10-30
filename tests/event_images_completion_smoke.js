/* 누락 이벤트 장면 49개 — 실제 이미지 로딩과 자택·왕녀·개척 도시 연결 확인 */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require('../tools/procedural_art/node_modules/playwright-core')); }
const ROOT = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/event_image_completion_prompts.json'), 'utf8'));
function ok(value, message) { if (!value) throw new Error(message); console.log('  ✓ ' + message); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|net::ERR/.test(m.text())) errors.push(m.text()); });
  try {
    fs.mkdirSync(path.join(ROOT, 'artifacts/event-images-2026-10-25'), { recursive: true });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const result = await page.evaluate(async rows => {
      const images = await Promise.all(rows.map(row => new Promise(resolve => {
        const im = new Image();
        const timer = setTimeout(() => resolve({ key: row.key, ok: false }), 15000);
        im.onload = () => { clearTimeout(timer); resolve({ key: row.key,
          ok: !!G.Img.file(row.key) && im.naturalWidth === row.size[0] && im.naturalHeight === row.size[1] }); };
        im.onerror = () => { clearTimeout(timer); resolve({ key: row.key, ok: false }); };
        im.src = G.Img.src(row.key);
      })));
      const home = G.HomeArt.NAMES.map(name => ({ name,
        key: G.Img.pick(G.Img.chain.homeEvent(name)), framed: G.HomeArt.framed(name) }));
      const shown = [], oldShow = G.FamEv.showPic, oldCompose = G.EventShot.compose;
      G.FamEv.showPic = ev => { shown.push(ev); return { stop: async () => {} }; };
      G.EventShot.compose = () => { throw new Error('전용 이미지 대신 대용 그림을 선택함'); };
      try {
        for (const row of rows.filter(r => r.key.indexOf('events/princess/') === 0)) {
          const handle = await G.EventShot.show({ key: row.key.split('/').pop(), title: row.title });
          await handle.stop();
        }
      } finally { G.FamEv.showPic = oldShow; G.EventShot.compose = oldCompose; }
      const colony = ['found', 'stage2', 'stage3', 'stage4', 'governor'].map(key => !!G.Colony.picture(key));
      return { images, home, shown: shown.map(ev => ({ img: ev.img, noStand: ev.noStand })), colony };
    }, rows);
    ok(result.images.length === 49 && result.images.every(x => x.ok), '새 이벤트 그림 49개 모두 manifest 등록·실제 디코딩·액자 규격 정상');
    ok(result.home.length === 22 && result.home.every(x => x.key === 'events/home/' + x.name && x.framed), '자택 22개 장면 모두 전용 그림과 액자를 선택');
    ok(result.shown.length === 8 && result.shown.every(x => x.img.indexOf('events/princess/') === 0 && x.noStand), '왕녀 사건 8개가 대용 합성 대신 전용 그림을 선택');
    ok(result.colony.length === 5 && result.colony.every(Boolean), '개척 도시 5개 장면이 전용 그림을 선택');
    await page.evaluate(() => { window.eventImageHandle = G.FamEv.showPic({ img: 'legend-events/aztec_tenochtitlan', title: '호수 위의 도시' }); });
    await page.waitForFunction(() => { const im = document.querySelector('.famscene img'); return im && im.complete && im.naturalWidth > 0; });
    await page.screenshot({ path: path.join(ROOT, 'artifacts/event-images-2026-10-25/runtime.png') });
    await page.evaluate(async () => { await window.eventImageHandle.stop(); delete window.eventImageHandle; });
    ok(await page.locator('.famscene').count() === 0, '실제 이벤트 액자를 표시하고 정상적으로 닫음');
    await page.evaluate(async () => {
      await G.Img.preload([G.Img.chain.homeEvent('chart')], 4000);
      window.homeImageHandle = G.HomeArt.show('chart', { title: '함께 펼친 해도' });
    });
    await page.screenshot({ path: path.join(ROOT, 'artifacts/event-images-2026-10-25/runtime-home.png') });
    await page.evaluate(async () => { await window.homeImageHandle.stop(); delete window.homeImageHandle; });
    ok(await page.locator('.homeart').count() === 0, '자택 배경 그림도 표시하고 정상적으로 닫음');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); }
})();
