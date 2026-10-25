/* 19~20세기 신기루 발견물 50 (js/data/miragedisc.js — 2026-10-25)
   ① 50개 · 지역마다 4~5개 · 모두 「미래의 건물」(1800년 이후) · 단서 이름·특기별 관찰이 있다 · 이미 있는 발견물과 이름이 겹치지 않는다
   ② 자리: 뭍(land)은 뭍 위 · 바다(sea)는 물 위 · 도시 안은 그 도시 곁
   ③ 1609년: 소문도 신기루도 없다 (D.built·M.active 거짓 · 그 자리에 가도 아무 일 없다)
   ④ 1610년부터: 신기루로 소문이 돌고, 그 자리에 가면 「신기루로 본 발견」 — 바다·뭍·도시 각각 실제로 찾아 본다
   ⑤ 그림이 없어도 발견 장면이 뜬다 (절차 그림) ⑥ 콘솔 오류 0
   node tests/mirage50_smoke.js  (BROWSER_EXE=크로미움 경로) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const PAGE = process.env.PAGE ? pathToFileURL(path.resolve(process.env.PAGE)).href : pathToFileURL(path.join(ROOT, 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|ERR_FILE_NOT_FOUND|ERR_FAILED|_blob/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(PAGE);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 180000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '디오구 페헤이라', nation: 'PT', job: 'explorer', age: 30, birth: { m: 4, d: 12 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.prologueDone = true; s.date = { y: 1609, m: 6, d: 1 };
      const D = G.Disc, M = G.Mirage, ids = G.MIRAGE50, L = ids.map(id => G.DISC[id]);
      const out = { n: ids.length, missing: ids.filter(id => !G.DISC[id]), reg: {}, notFuture: [], noClue: [], noFacts: [], dupName: [], bad: [] };
      L.forEach(d => { if (!d) return; out.reg[d.reg] = (out.reg[d.reg] || 0) + 1;
        if (!D.isFuture(d) || d.mirageFrom !== 1610) out.notFuture.push(d.id);
        if (!G.DISC_NAMES[d.id] || !G.DISC_NAMES[d.id].clue) out.noClue.push(d.id);
        const F = G.DISC_FACTS[d.id]; if (!F || F.length < 3) out.noFacts.push(d.id);
        const rn = G.discRealName ? G.discRealName(d) : (d.realName || d.name);
        if (G.DISCOVERIES.some(x => x !== d && (x.realName || x.name0 || '') === rn)) out.dupName.push(d.id);
        // ② 자리
        if (d.how === 'land' && !G.Geo.isLand(d.lon, d.lat)) out.bad.push('뭍 아님 ' + d.id);
        if (d.how === 'sea' && G.Geo.isLand(d.lon, d.lat)) out.bad.push('물 아님 ' + d.id);
        if (d.how === 'city') { const c = G.CITY_DATA[d.city]; if (!c || G.Geo.dist(c.lon, c.lat, d.lon, d.lat) > 1.2) out.bad.push('도시와 멂 ' + d.id); }
      });
      out.how = L.reduce((a, d) => (a[d.how] = (a[d.how] || 0) + 1, a), {});
      out.built = [Math.min(...L.map(d => d.built)), Math.max(...L.map(d => d.built))];
      // ③ 1609년
      const seen = []; const seeOld = M.see; M.see = d => { seen.push(d.id); return seeOld.call(M, d); };
      const sea = L.find(d => d.how === 'sea'), land = L.find(d => d.how === 'land'), city = L.find(d => d.how === 'city');
      out.y1609 = { built: L.filter(d => D.built(d)).length, active: L.filter(d => M.active(d)).length };
      s.discDay = null; const h0 = D.checkSea(sea.lon, sea.lat, { search: true }); const l0 = D.checkLand(land.lon, land.lat, { search: true }).hits; const c0 = D.checkCity(city.city).concat(D.cityBuildings(city.city));
      out.y1609.hits = h0.concat(l0, c0).filter(d => G.MIRAGE50.indexOf(d.id) >= 0).map(d => d.id);
      out.y1609.mirage = Object.keys(s.mirage || {}).filter(id => ids.indexOf(id) >= 0).length;
      // ④ 1610년
      s.date = { y: 1610, m: 1, d: 2 };
      out.y1610 = { built: L.filter(d => D.built(d)).length, active: L.filter(d => M.active(d)).length, now: L.filter(d => D.mirageNow(d)).length };
      ids.forEach(id => { s.hints[id] = { src: 'test', d: 0 }; });
      s.discDay = null; const h1 = D.checkSea(sea.lon, sea.lat, { search: true }).map(d => d.id);
      s.discDay = null; s.day = (s.day || 0) + 1; const l1 = D.checkLand(land.lon, land.lat, { search: true }).hits.map(d => d.id);
      const c1 = D.cityBuildings(city.city).map(d => d.id);
      out.y1610.sea = [sea.id, h1.indexOf(sea.id) >= 0]; out.y1610.land = [land.id, l1.indexOf(land.id) >= 0]; out.y1610.city = [city.id, c1.indexOf(city.id) >= 0];
      // 소문의 후보: 1609년엔 없고 1610년엔 있다
      const cand = y => { s.date = { y, m: 3, d: 1 }; return L.filter(d => D.built(d) && !(G.Mirage && G.Mirage.hidden(d))).length; };
      out.cand = [cand(1609), cand(1611)];
      M.see = seeOld;
      s.date = { y: 1612, m: 5, d: 1 };
      const d = G.DISC.empirestate; out.preName = d.name; out.mirFind = D.isMirageFind(d);
      return out;
    });
    ok(r.n === 50 && !r.missing.length, '발견물 50개가 들어왔다 (' + r.built[0] + '~' + r.built[1] + '년 건물) · 찾는 곳 ' + JSON.stringify(r.how));
    const counts = Object.values(r.reg);
    ok(Object.keys(r.reg).length === 11 && Math.min(...counts) >= 4 && Math.max(...counts) <= 5, '열한 지역에 고르게: ' + JSON.stringify(r.reg));
    ok(!r.notFuture.length && !r.noClue.length && !r.noFacts.length, '모두 미래의 건물(1610년부터) · 단서 이름 · 특기별 관찰 ' + [r.notFuture, r.noClue, r.noFacts].join('|'));
    ok(!r.dupName.length, '이미 있는 발견물과 이름이 겹치지 않는다 ' + r.dupName.join(','));
    ok(!r.bad.length, '자리: 뭍은 뭍 위 · 바다는 물 위 · 도시 안은 그 도시 곁 ' + r.bad.join(', '));
    ok(r.y1609.built === 0 && r.y1609.active === 0 && !r.y1609.hits.length && r.y1609.mirage === 0 && r.cand[0] === 0, '1609년: 소문·신기루·발견 모두 없음');
    ok(r.y1610.built === 50 && r.y1610.active === 50 && r.y1610.now === 50 && r.cand[1] === 50, '1610년부터: 50개 모두 신기루로 소문이 돈다');
    ok(r.y1610.sea[1] && r.y1610.land[1] && r.y1610.city[1], '1610년: 그 자리에 가면 찾는다 — 바다 ' + r.y1610.sea[0] + ' · 뭍 ' + r.y1610.land[0] + ' · 도시 ' + r.y1610.city[0]);
    // ⑤ 실제로 찾는다 (리스본 거리에서 D.find — 그림이 없어도 발견 카드가 뜨고 신기루로 흩어진다)
    await page.evaluate(() => { G.Game.go('city', { cityId: 0 }); });
    await page.waitForFunction(() => G.Game.sceneName === 'city' && !G.Scenes.city.isBusy(), null, { timeout: 60000 });
    const fd = await page.evaluate(async () => {
      const d = G.DISC.empirestate, s = G.Game.state, o = { pics: 0 };
      const tick = setInterval(() => {
        const b = [...document.querySelectorAll('.modal-back')].pop();
        if (b) { o.pics = Math.max(o.pics, b.querySelectorAll('canvas, img').length); const bt = b.querySelectorAll('.askrow button, .foot button, button'); if (bt.length) bt[bt.length - 1].click(); else b.click(); }
        const rv = document.querySelector('#ui .reveal'); if (rv) rv.click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }, 150);
      try { await Promise.race([G.Disc.find(d, 'city'), new Promise(r => setTimeout(r, 40000))]); } finally { clearInterval(tick); }
      const st = s.disc[d.id] || {};
      o.me = !!st.me; o.mirage = st.mirage; o.name = d.name; o.log = (s.log.slice(-6).map(l => l.t || l.text || l).find(t => /신기루로 보았다/.test(t)) || '');
      return o;
    });
    ok(r.mirFind && fd.me && fd.mirage === 1 && fd.pics > 0, '찾기 전 이름 「' + r.preName + '」 → 찾으면 「' + fd.name + '」 · 신기루로 본 발견 · 그림 없이도 발견 카드에 그림 ' + fd.pics + '장 · 일지: ' + String(fd.log).slice(0, 40));
    await page.waitForTimeout(400);
    ok(!errors.length, '콘솔 오류 없음 ' + errors.slice(0, 4).join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.slice(0, 5).join('\n')); process.exitCode = 1; }
  await browser.close();
})();
