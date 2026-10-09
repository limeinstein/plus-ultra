/* 마을 사람 무릎상은 로딩 중에도 머리·몸통·하체 일부만 보이지 않아야 한다. */
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
        const base = root.querySelector('.rig-base');
        const pieces = [...root.querySelectorAll('.rig-piece')];
        return {
          ready: root.classList.contains('rig-ready'),
          baseVisible: !!base && Number(getComputedStyle(base).opacity) > .5,
          pieces: pieces.length,
          piecesVisible: pieces.filter(e => Number(getComputedStyle(e).opacity) > .5).length
        };
      }));
      if (!state.length || state.some(s => s.pieces !== 3 || (s.ready ? s.baseVisible || s.piecesVisible !== 3 : !s.baseVisible || s.piecesVisible !== 0))) {
        throw new Error(type + ' 부분 레이어 노출: ' + JSON.stringify(state));
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
            if (rig.root.classList.contains('rig-ready')) return resolve('ready');
            if (rig.root.classList.contains('rig-piece-failed')) return resolve('failed');
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
    console.log(JSON.stringify({ portraits: coverage.count, partialLayers: coverage.failed.length, screenshots: OUT, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
