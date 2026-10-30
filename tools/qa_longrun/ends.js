/* 1700년 저장에서 끝나는 두 길 — node ends.js 저장.json
   ① 아들 없이 80세 수명이 다한다 → 「항해의 끝」(바다 위에서 생을 마치다) → 타이틀
   ② 바다에서 선원이 모두 쓰러진다 → 「항해의 끝」 → 타이틀 */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const SAVE = process.argv[2];
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const json = fs.readFileSync(SAVE, 'utf8');
  for (const mode of ['age', 'crew']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await page.route(/^https?:\/\//, r => r.fulfill({ status: 204, body: '' }));
    await page.addInitScript({ path: path.join(__dirname, 'qalib.js') });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const r = await page.evaluate(async (a) => {
      const [json, mode] = a;
      await G.Game.ensureGeo(); G.Nav.init(); G.UI.fade = async fn => { fn && fn(); }; QA.stubGames();
      G.Game.state = G.State.deserialize(json); const s = G.Game.state, p = s.player;
      s.contract = null;
      const o = { mode, date: QA.date(), name: p.name, age: G.R.age(), heirs: G.Family.heirs().length, minor: !!G.Family.minorSon() };
      let fin = null; const ob = new MutationObserver(() => { const t = document.body.innerText; if (!fin && /FINIS/.test(t)) fin = (document.querySelector('.win') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 160); });
      ob.observe(document.body, { childList: true, subtree: true, characterData: true });
      if (mode === 'age') {
        // 80번째 생일 사흘 전으로
        p.born = { y: s.date.y - 80, m: s.date.m, d: Math.min(28, s.date.d + 3) };
        if (p.born.d <= s.date.d) p.born.m = s.date.m;   // 같은 달 사흘 뒤
        G.Game.go('city', { cityId: s.loc.city }); await QA.settle(60000);
        o.age0 = G.R.age();
        o.pass = await QA.pass(40);
      } else {
        G.Game.go('city', { cityId: s.loc.city }); await QA.settle(60000);
        G.Game.go('sea', { depart: s.loc.city }); await QA.settle(30000);
        s.fleet.crew = 1; s.fleet.food = 0; s.fleet.water = 0;
        const SEA = G.Scenes.sea, st = SEA.runtime(); st.speed = 4;
        const t0 = Date.now();
        while (G.Game.sceneName === 'sea' && Date.now() - t0 < 180000) { if (G.UI.busy()) await QA.clear(30); else { SEA.update(0.2); QA.aux(); } await QA.sleep(5); }
        await QA.settle(30000);
      }
      ob.disconnect();
      o.fin = fin; o.scene = G.Game.sceneName; o.dateEnd = QA.date();
      o.log = (G.Game.state.log || []).slice(-4).map(x => x.t);
      return o;
    }, [json, mode]);
    r.errs = errs;
    console.log(JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
