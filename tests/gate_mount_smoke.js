/* 성문 마구간: 뭍길로 들른 탐험대가 마구간에 사 둔 짐승을 「탐험대로 돌아간다」에서 다시 사지 않는다 (js/city/misc.js GT.outfit)
   node tests/gate_mount_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const cid = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '시험 제독', nation: 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const y = G.Game.state.date.y, c = G.CITY_DATA.find(c => G.Mounts.offers(c, y).indexOf('camel') >= 0);
      G.Game.go('city', { cityId: c.id });
      return c.id;
    });
    await page.waitForTimeout(2000);
    // 배를 대고 걸어서 이 도시에 들른 탐험대
    const setup = await page.evaluate((cid) => {
      const s = G.Game.state, c = G.CITY_DATA[cid];
      s.fleet.crew = Math.max(s.fleet.crew, 30); s.player.gold = 200000;
      s.loc.via = 'land'; s.landReturn = { lon: c.lon, lat: c.lat, base: 0, party: 30, days: 5, mount: { id: 'walk', n: 0 } };
      delete (s.stable || {})[cid];
      return { city: c.name, need: G.Mounts.need('camel', 30), price: G.Mounts.get('camel').price };
    }, cid);
    console.log('   ' + JSON.stringify(setup));
    async function outfit(mode, id) {
      return page.evaluate(async ([cid, mode, id]) => {
        const GT = G.Scenes.city.B.gate, c = G.CITY_DATA[cid], g0 = G.Game.state.player.gold;
        const p = GT.outfit(c, mode);
        await new Promise(r => setTimeout(r, 300));
        const card = document.querySelector('.outfitwin .of-card[data-id="' + id + '"]');
        const txt = card && card.querySelector('.of-price').textContent;
        card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const btn = [...document.querySelectorAll('.outfitwin button')].find(b => /떠난다|맡긴다/.test(b.textContent));
        const label = btn.textContent; btn.click();
        const mt = await p;
        await new Promise(r => setTimeout(r, 200));
        return { spent: g0 - G.Game.state.player.gold, mt, stable: (G.Game.state.stable || {})[cid] || null, txt, label };
      }, [cid, mode, id]);
    }
    const a = await outfit('stable', 'camel');
    console.log('   마구간: ' + JSON.stringify(a));
    ok(a.stable && a.stable.id === 'camel' && a.stable.n === setup.need && a.spent === setup.need * setup.price, '마구간에서 낙타 ' + setup.need + '필을 산다 (' + a.spent + '닢)');
    const b = await outfit('resume', 'camel');
    console.log('   돌아간다: ' + JSON.stringify(b));
    ok(b.spent === 0 && b.mt && b.mt.id === 'camel' && b.mt.n === setup.need, '「탐험대로 돌아간다」에서 낙타를 고르면 값을 다시 치르지 않고 사 둔 낙타 ' + b.mt.n + '필을 데려간다 — ' + b.txt);
    ok(!b.stable, '마구간은 비었다 (데리고 나갔다)');
    // 다른 짐승이 마구간에 있을 때 걸어가면: 데려온 낙타를 되팔고 마구간 짐승은 그대로
    const c2 = await page.evaluate((cid) => { const s = G.Game.state; s.landReturn.mount = { id: 'camel', n: 4 }; s.stable[cid] = { id: 'horse', n: 3 }; return 1; }, cid);
    const d = await outfit('resume', 'walk');
    console.log('   걸어간다: ' + JSON.stringify(d));
    ok(d.mt.id === 'walk' && d.stable && d.stable.id === 'horse' && d.stable.n === 3 && d.spent < 0, '마구간에 말이 있으면 걸어갈 때 데려온 낙타를 되팔고 말은 그대로 둔다 (+' + (-d.spent) + '닢)');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
