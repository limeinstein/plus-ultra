/* 여급의 귀띔 — 알려 준 척수 그대로 나타나고, 만나기 전에 사라진 배는 다시 나타난다 (2026-10-23 QA)
   node tests/maidtip_count_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo(); G.Nav.init();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      G.UI.toast = () => {};
      const s = G.Game.state, MT = G.MaidTip, out = { bad: [] }; s.date = { y: 1520, m: 5, d: 1 }; s.player.gold = 90000;
      const named0 = G.BALANCE.captains.namedPirate;
      const cities = [12, 30, 0, 100, 160].map(id => G.CITY_DATA[id]).filter(c => c && c.port);
      let n = 0, pirates = 0;
      for (const forceNamed of [0, 1]) {
        G.BALANCE.captains.namedPirate = forceNamed; s.capRoster = null;
        for (const kind of ['pirate', 'merchant', 'navy']) for (const c of cities) for (let i = 0; i < 6; i++) {
          s.maidTips = [];
          const m = G.MAIDS.find(x => x.city === c.id) || G.MAIDS[0];
          const tip = MT.make(kind, c, m, { aff: 60, met: 5 }); if (!tip) continue;
          s.loc = { mode: 'sea', lon: tip.lon, lat: tip.lat, heading: 0 };
          const npc = MT.spawn([]); if (!npc) { out.bad.push('no spawn ' + kind); continue; }
          n++; if (kind === 'pirate') pirates++;
          if (npc.n !== tip.n || npc.ships.length !== tip.n) out.bad.push(kind + ' 알려 준 ' + tip.n + '척 → ' + npc.n + '/' + npc.ships.length + (npc.cap ? ' ' + npc.cap.name : ''));
          if (kind === 'pirate' && npc.cap) out.bad.push('이름난 해적이 붙음 ' + npc.cap.name);
          if (!MT.text(tip).includes(tip.n + '척')) out.bad.push('text');
        }
      }
      G.BALANCE.captains.namedPirate = named0;
      out.n = n; out.pirates = pirates;
      // 다시 나타남: 나타난 뒤 바다에서 사라지면(입항) 기한 안에 다시
      s.maidTips = []; const c0 = G.CITY_DATA[12], m0 = G.MAIDS.find(x => x.city === 12) || G.MAIDS[0];
      const t = MT.make('merchant', c0, m0, { aff: 60, met: 5 });
      s.loc = { mode: 'sea', lon: t.lon, lat: t.lat, heading: 0 };
      const a = MT.spawn([]); out.first = !!a;
      out.notTwiceWhileOnSea = !MT.spawn([a]);
      out.again = !!MT.spawn([]);                 // 입항해서 바다의 배가 사라졌다
      MT.met(t.id);
      out.notAfterMet = !MT.spawn([]);
      out.cleaned = !s.maidTips.some(x => x.id === t.id);
      // 기한이 지나면 나타나지 않는다
      s.maidTips = []; const t2 = MT.make('navy', c0, m0, { aff: 60, met: 5 }); s.loc = { mode: 'sea', lon: t2.lon, lat: t2.lat, heading: 0 };
      s.day = t2.to + 1; out.late = !MT.spawn([]);
      return out;
    });
    console.log('   ' + JSON.stringify(r));
    ok(r.n >= 60 && r.pirates >= 20, '여러 도시·종류로 ' + r.n + '번 띄움 (해적 ' + r.pirates + ')');
    ok(r.bad.length === 0, '알려 준 척수 그대로 · 해적에 이름난 두목이 붙지 않음 ' + (r.bad.slice(0, 5).join(' / ')));
    ok(r.first && r.notTwiceWhileOnSea, '바다에 떠 있는 동안은 한 번만');
    ok(r.again, '만나기 전에 바다에서 사라지면(입항) 기한 안에 다시 나타남');
    ok(r.notAfterMet && r.cleaned, '만난 뒤에는 끝 (목록에서 치움)');
    ok(r.late, '기한이 지나면 나타나지 않음');
    ok(errors.length === 0, '콘솔 오류 없음 ' + errors.slice(0, 3).join(' | '));
    console.log('통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  finally { await browser.close(); }
})();
