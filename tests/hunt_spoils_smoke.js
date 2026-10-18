/* 사냥 전리품 점검 (js/data/hunt.js · js/systems/hunt.js · js/scenes/land.js landBattle) — node tests/hunt_spoils_smoke.js   (BROWSER_EXE=크롬 경로)
   뭍에서 짐승 떼를 물리치면 그 땅 짐승의 가죽을 짐칸에 싣는다: 인도 호랑이 → 호피 · 조선 곰 떼와 범 → 모피·호피 · 이베리아 멧돼지·곰 → 피혁·모피 ·
   서아프리카 하이에나·사자 → 피혁·모피. 짐칸이 모자라면 두고 온다. 호피는 교역소에서 팔 수 있고, 인도보다 유럽에서 비싸다. 옛 교역품 순번 그대로. 콘솔 오류 0. */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_NAME/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      const out = {}, R = G.R, UI = G.UI;
      const s = G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 24, birth: { m: 3, d: 2 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const toasts = []; UI.toast = (t) => { toasts.push(t); }; G.Game.refreshHud = () => {};
      const g = G.GOOD.tigerskin; out.good = !!g && g.name === '호피' && G.GOODS[g.idx] === g && G.GOOD.slaves.idx < g.idx && G.GOOD.sweetpotato.idx < g.idx;
      const lw = G.Games.landWar; G.Games.landWar = async (o) => ({ res: 'win', left: o.party, dead: 0, back: 0 });
      async function fight(lon, lat, n) {
        s.fleet.cargo = {}; toasts.length = 0;
        s.loc = { mode: 'land', lon, lat, party: 30, days: 0 };
        await G.Scenes.land.landBattle('들짐승', n, true);
        const c = {}; for (const k in s.fleet.cargo) c[k] = s.fleet.cargo[k].q;
        return { cargo: c, toast: toasts.join(' | '), label: G.Hunt.label(lon, lat) };
      }
      out.india = await fight(78, 20, 20);
      out.korea = await fight(127.5, 36.5, 15);
      out.iberia = await fight(-4, 40, 20);
      out.africa = await fight(-5, 9, 20);
      // 짐칸이 꽉 차면 두고 온다
      s.fleet.cargo = {}; const room = R.free(); s.fleet.food += room; out.full = await (async () => { toasts.length = 0; s.loc = { mode: 'land', lon: 78, lat: 20, party: 30, days: 0 }; await G.Scenes.land.landBattle('들짐승', 20, true); return { cargo: Object.keys(s.fleet.cargo).length, toast: toasts.join(' | ') }; })();
      s.fleet.food -= room;
      G.Games.landWar = lw;
      // 교역소에서 판다: 인도(산지 가까움)보다 런던·리스본이 비싸다
      const city = n => G.CITY_DATA.find(c => c && c.name === n), T = G.Scenes.city.B.trade;
      out.price = { 캘리컷: T.sellP(city('캘리컷'), 'tigerskin'), 북경: T.sellP(city('북경'), 'tigerskin'), 리스본: T.sellP(city('리스본'), 'tigerskin'), 런던: T.sellP(city('런던'), 'tigerskin'), 피혁_리스본: T.sellP(city('리스본'), 'hides'), 모피_리스본: T.sellP(city('리스본'), 'fur') };
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(r.good, '새 교역품 「호피」 — 옛 교역품 순번(노예·고구마까지)은 그대로, 맨 뒤에 붙음');
    ok(r.india.cargo.tigerskin >= 2 && Object.keys(r.india.cargo).length === 1 && /호피/.test(r.india.toast), '인도 ' + r.india.label + ' 떼 → 호피 ' + r.india.cargo.tigerskin + '통 (' + r.india.toast.slice(0, 80) + ')');
    ok(r.korea.cargo.fur >= 1 && r.korea.cargo.tigerskin === 1, '조선 ' + r.korea.label + ' → 모피 ' + r.korea.cargo.fur + '통 · 호피 1통');
    ok(r.iberia.cargo.hides >= 1 && r.iberia.cargo.fur === 1, '이베리아 ' + r.iberia.label + ' → 피혁 ' + r.iberia.cargo.hides + '통 · 모피 1통');
    ok(r.africa.cargo.hides >= 1 && r.africa.cargo.fur === 2, '서아프리카 ' + r.africa.label + ' → 피혁 ' + r.africa.cargo.hides + '통 · 모피 2통');
    ok(r.full.cargo === 0 && /두고 왔다/.test(r.full.toast), '짐칸이 꽉 차면 가죽은 두고 온다');
    ok(r.price.런던 > r.price.캘리컷 && r.price.리스본 > r.price.캘리컷 && r.price.캘리컷 > 0, '호피 매각 시세: 캘리컷 ' + r.price.캘리컷 + ' · 북경 ' + r.price.북경 + ' · 리스본 ' + r.price.리스본 + ' · 런던 ' + r.price.런던 + '닢 (피혁 ' + r.price.피혁_리스본 + ' · 모피 ' + r.price.모피_리스본 + ')');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
    console.log('\n통과');
  } catch (e) { console.error('✗ ' + e.message); process.exitCode = 1; }
  await browser.close();
})();
