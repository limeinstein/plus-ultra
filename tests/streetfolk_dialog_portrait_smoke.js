/* 마을 사람 무릎상은 머리·몸통을 자르지 않고 완성된 한 장으로 보여야 한다. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(os.tmpdir(), 'streetfolk-dialog-portrait');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.StreetFolk, null, { timeout: 90000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({
        name: '마테우스 다 코스타', nation: 'PT', job: 'adventurer', age: 24,
        birth: { m: 5, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 },
        sk: {}, lg: G.LANGS.map(() => 3), diff: 'normal'
      });
      G.UI.fade = async fn => fn();
      G.Game.go('city', { cityId: 0 });
      await new Promise(r => setTimeout(r, 1200));
      document.querySelectorAll('#ui .modal-back').forEach(e => e.remove());
    });

    for (const type of ['noble', 'man']) {
      await page.evaluate(type => {
        const city = G.CITY_DATA[0];
        const row = { type, name: G.STREET_FOLK.types[type].name, seed: 'portrait-rig-test:' + type };
        window.__portraitPromise = G.UI.say('무릎상 로딩 확인', G.StreetFolk.speaker(row, city));
      }, type);
      await page.waitForSelector('.dlg-actor.tall .portrait-rig');
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => [...document.querySelectorAll('.dlg-actor.tall .portrait-rig')].map(root => {
        const whole = root.querySelector('.rig-fallback');
        return {
          single: root.classList.contains('rig-single'),
          whole: !!whole,
          visible: !!whole && Number(getComputedStyle(whole).opacity) > .5,
          pieces: root.querySelectorAll('.rig-piece').length
        };
      }));
      if (!state.length || state.some(s => !s.single || !s.whole || !s.visible || s.pieces !== 0)) {
        throw new Error(type + ' 무릎상 분할 노출: ' + JSON.stringify(state));
      }
      await page.screenshot({ path: path.join(OUT, type + '.png') });
      await page.click('.dlg');
      await page.evaluate(() => window.__portraitPromise);
    }
    const coverage = await page.evaluate(async () => {
      const keys = G.Img.list('portraits/street-folk/').filter(k => /_half$/.test(k));
      const failed = [];
      for (const key of keys) {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;left:-2000px;top:0;width:320px;height:480px';
        document.body.appendChild(host);
        const rig = G.PortraitRig.mount(host, { chain: [key], profile: 'half', alt: key });
        const state = await new Promise(resolve => {
          const started = performance.now();
          (function poll() {
            const whole = rig.root.querySelector('.rig-fallback');
            if (rig.root.classList.contains('rig-single') && whole && whole.complete && whole.naturalWidth) return resolve('ready');
            if (whole && whole.complete && !whole.naturalWidth) return resolve('failed');
            if (performance.now() - started > 5000) return resolve('timeout');
            setTimeout(poll, 16);
          })();
        });
        if (state !== 'ready') failed.push({ key, state });
        rig.destroy(); host.remove();
      }
      return { count: keys.length, failed };
    });
    if (coverage.count !== 260 || coverage.failed.length) throw new Error('전체 무릎상 리그 검사 실패: ' + JSON.stringify(coverage));
    if (errors.length) throw new Error('콘솔 오류: ' + errors.join('\n'));
    console.log(JSON.stringify({ portraits: coverage.count, splitHalves: coverage.failed.length, screenshots: OUT, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
