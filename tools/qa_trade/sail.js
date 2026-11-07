/* 교역 1억 QA — 봇이 많이 쓴 길을 실제 바다 장면으로 몰아 보기 (2026-11-07) — node tools/qa_trade/sail.js
   봇(tradebot.js)은 바다를 건너뛰고 RT.estDays(바람 없음)만큼 날을 넘긴다. 같은 길을 실제 항해(QA.voyage: 바람·폭풍·해적·사건 그대로)로 가서
   걸린 날·사건·잃은 선원을 비교한다. 환경값: OUT=결과 파일(json) · REP=길마다 몇 번(기본 2) · ROUTES="0-85,85-0,..." */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const OUT = process.env.OUT || '/tmp/qa_trade_sail.json';
const REP = +(process.env.REP || 2);
const ROUTES = (process.env.ROUTES || '0-85,85-0,3-85,12-85,9-85,7-85,23-22,23-24,23-38,29-12,29-32').split(',').map(x => x.split('-').map(Number));
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const all = [];
  try {
    for (let k = 0; k < REP; k++) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errors = {};
      page.on('pageerror', e => { const m = String(e.message).slice(0, 160); errors[m] = (errors[m] || 0) + 1; });
      await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
      await page.addInitScript('window.__QA_SEED=' + (7100 + k));
      await page.addInitScript({ path: path.join(ROOT, 'tools/qa_longrun/qalib.js') });
      await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
      const res = await page.evaluate(async (routes) => {
        await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); };
        QA.stubGames();
        const job = G.JOBS.find(j => j.id === 'merchant') || G.JOBS[0], sk = {};
        G.SKILLS.forEach(x => { sk[x.id] = 0; }); Object.assign(sk, job.skills || {});
        G.State.newGame({ name: '시험', nation: 'PT', job: 'merchant', age: 20, birth: { m: 3, d: 9 }, st: { str: 60, int: 64, mar: 56, cha: 66 }, sk, lg: G.LANGS.map((_, i) => i === 1 ? 3 : 0), diff: 'normal' });
        const s = G.Game.state; s.flags.prologue = true; s.settings.res = 0.35; s.player.gold = 50000;
        const out = [];
        for (const [a, b] of routes) {
          const c = G.CITY_DATA[a];
          s.loc = { mode: 'city', city: a, lon: c.lon, lat: c.lat, heading: 0 };
          if (s.known.indexOf(a) < 0) s.known.push(a);
          G.Game.go('city', { cityId: a }); await QA.settle(30000);
          QA.prep(60);
          let est = null; try { est = +G.Routes.estDays(a, b).toFixed(1); } catch (e) { /* 없음 */ }
          const f0 = s.stats.battles || 0;
          const r = await QA.voyage(b, { realMs: 180000 });
          out.push({ from: a, to: b, fromN: c.name, toN: G.CITY_DATA[b].name, est, eta: r.eta, days: r.days, res: r.res, crewLost: r.crewLost, battles: (s.stats.battles || 0) - f0, mode: r.mode, retarget: r.retarget, log: r.anomaly ? r.anomaly.log.slice(-8) : undefined });
        }
        return out;
      }, ROUTES);
      res.forEach(x => { x.rep = k; all.push(x); console.log(JSON.stringify(x).slice(0, 300)); });
      if (Object.keys(errors).length) console.log('errors', JSON.stringify(errors));
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(OUT, JSON.stringify(all, null, 1));
})();
