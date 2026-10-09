/* 거리 볼거리(도시 발견물)가 하늘에 떠 보이지 않는지 (2026-10-09) — node tests/landmark_ground_smoke.js   (BROWSER_EXE=크롬 경로)
   · 조감 그림(런던 탑·콜로세움처럼 발치가 V자)은 앞(아래)으로 당겨 발치 양옆이 길 위에 닿게 세운다 — 앞 끝은 주인공 발보다 조금 아래까지
   · 그래도 남는 틈만 길바닥 마당으로 채운다 — 길 윗변보다 위에 뜬 곳이 없다
   · 픽셀을 못 읽을 때(file://)도 G.LANDMARK_BASE 표로 같은 결과. 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
async function run(browser, taint) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (taint) await page.addInitScript(() => { CanvasRenderingContext2D.prototype.getImageData = function () { throw new Error('tainted'); }; });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    await G.Game.ensureGeo();
    G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 20, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
    G.Game.state.date = { y: 1700, m: 6, d: 1 };
    const out = {};
    for (const [cid, id] of [[38, 'whitetower'], [33, 'colosseum'], [188, 'forbidden']]) {
      G.Game.state.known.push(cid);
      G.Game.go('city', { cityId: cid });
      let st = null;
      for (let i = 0; i < 80; i++) { await new Promise(r => setTimeout(r, 100)); st = G.Town.runtime && G.Town.runtime(); if (st && st.marks && st.marks.some(m => m.id === id)) break; }
      const m = st && st.marks.filter(x => x.id === id)[0];
      if (!m) { out[id] = null; continue; }
      const ty = m.y - m.cv.height + (m.foot || 0) + (m.pull || 0);
      const corner = m.base ? Math.min.apply(null, m.base.map(b => b.y)) + ty : null;   // 발치 중 가장 높은 곳(화면 y)
      out[id] = { plaza: !!m.plaza, pull: m.pull || 0, base: m.base ? m.base.length : 0,
        plazaTop: m.plaza ? Math.round(ty + m.plaza.oy) : null, plazaBottom: m.plaza ? Math.round(ty + m.plaza.oy + m.plaza.height) : null,
        corner: Math.round(corner), front: Math.round(m.y + (m.pull || 0)), walkTop: 742, heroFeet: 768 + 34,
        lift: m.base ? Math.max.apply(null, m.base.map(b => (m.cv.height - m.foot) - b.y)) : 0 };
      G.Town.update(0.016);
    }
    out.table = Object.keys(G.LANDMARK_BASE || {}).length;
    return out;
  });
  await page.close();
  return { r, errors };
}
(async function () {
  const opt = { args: ['--no-sandbox', '--allow-file-access-from-files'] };
  if (process.env.BROWSER_EXE) opt.executablePath = process.env.BROWSER_EXE;
  const browser = await chromium.launch(opt);
  try {
    for (const taint of [false, true]) {
      const { r, errors } = await run(browser, taint);
      const tag = taint ? '(file:// 표) ' : '';
      console.log(tag + JSON.stringify(r));
      ok(r.table >= 50, tag + '볼거리 아래 테두리 표 ' + r.table + '곳');
      ['whitetower', 'colosseum', 'forbidden'].forEach(id => {
        const m = r[id];
        ok(m && m.lift > 30 && m.pull > 0, tag + id + ': 발치가 V자(양옆이 ' + (m && m.lift) + 'px 뜸) → 앞으로 ' + (m && m.pull) + 'px 당김');
        ok(m.front <= m.heroFeet + 20, tag + id + ': 앞 끝(' + m.front + ')은 주인공 발(' + m.heroFeet + ') 언저리까지만');
        ok(m.corner >= m.walkTop - 4 || (m.plaza && m.plazaTop <= m.corner + 6 && m.plazaBottom >= m.walkTop), tag + id + ': 길 위로 뜬 곳 없음 (발치 ' + m.corner + ' · 길 ' + m.walkTop + (m.plaza ? ' · 남은 틈은 마당 ' + m.plazaTop + '~' + m.plazaBottom : '') + ')');
      });
      ok(!errors.length, tag + '콘솔 오류 0 ' + errors.join(' | '));
    }
    console.log('\n통과');
  } catch (e) {
    console.error('✗', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
