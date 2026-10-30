/* 명청 시대의 몽골·만주 도시 7곳 + 고구려 국내성 (2026-10-30) — node tests/mingqing_cities_smoke.js
   장가구 309 · 차하르 올도 310 · 에르덴 조 311 · 굴자 312 · 심양 313 · 길림 314 · 요양 315 (귀화성=후허호토 296, 콥도=호브드 143은 이미 있다) */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
function ok(v, msg) { console.log((v ? '  ✓ ' : '  ✗ ') + msg); if (!v) fail++; }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const sk = {}; G.SKILLS.forEach(x => { sk[x.id] = 0; });
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk, lg: [0, 1, 2, 3], diff: 'normal' });
      const s = G.Game.state, R = G.R, ids = [309, 310, 311, 312, 313, 314, 315], out = {};
      const at = (y) => { s.date = { y, m: 6, d: 1 }; return ids.map(id => ({ id, name: G.CITY_DATA[id].name, on: R.cityExists(G.CITY_DATA[id]), owner: R.cityOwner(G.CITY_DATA[id]) })); };
      out.names = ids.map(id => G.CITY_DATA[id].name);
      out.land = ids.filter(id => !G.Geo.isLand(G.CITY_DATA[id].lon, G.CITY_DATA[id].lat));
      out.y1490 = at(1490); out.y1600 = at(1600); out.y1650 = at(1650); out.y1700 = at(1700); out.y1760 = at(1760);
      s.date = { y: 1580, m: 1, d: 1 }; out.kara1580 = R.cityExists(G.CITY_DATA[144]);
      s.date = { y: 1590, m: 1, d: 1 }; out.kara1590 = R.cityExists(G.CITY_DATA[144]); out.erd1590 = R.cityExists(G.CITY_DATA[311]);
      out.erdDisc = G.DISC.erdenezuu && G.DISC.erdenezuu.city === 311;
      out.erdLib = R.facilities(G.CITY_DATA[311]).library && G.BOOKS.some(b => b.libs.indexOf(311) >= 0);
      out.zones = { mongol: [310, 311, 312].every(id => G.MATE_ZONES.mongol.ids.includes(id)), china: [309, 313, 314, 315].every(id => G.MATE_ZONES.china.ids.includes(id)) };
      out.fac = ids.map(id => { const f = R.facilities(G.CITY_DATA[id]); return f.trade && f.tavern && f.inn && f.gate; });
      out.bg = ids.map(id => G.Img.pick(G.Img.chain.bg(G.CITY_DATA[id])));
      // 국내성
      const d = G.DISC.gungnae;
      out.gn = d && { name: d.realName || d.name, cat: d.cat, how: d.how, clue: G.DISC_NAMES.gungnae.clue, facts: (G.DISC_FACTS.gungnae || []).length, fam: (G.DISC_FAM.gungnae || []).length, relic: (G.RELICS.gungnae || []).map(x => x.name), land: G.Geo.isLand(d.lon, d.lat) };
      // 실제로 그 도시에 들어가 거리 화면을 띄운다 (심양 1600년)
      s.date = { y: 1600, m: 6, d: 1 }; s.known.push(313, 311, 312);
      s.loc = { mode: 'city', city: 313 }; G.Game.go('city', { cityId: 313 });
      await new Promise(r => setTimeout(r, 2500));
      out.scene = G.Game.sceneName;
      return out;
    });
    console.log('   ' + r.names.join(' · '));
    console.log('   1490: ' + r.y1490.map(x => x.name + (x.on ? '(' + x.owner + ')' : '×')).join(' '));
    console.log('   1650: ' + r.y1650.map(x => x.name + (x.on ? '(' + x.owner + ')' : '×')).join(' '));
    console.log('   1760: ' + r.y1760.map(x => x.name + (x.on ? '(' + x.owner + ')' : '×')).join(' '));
    ok(r.names.join() === '장가구,차하르 올도,에르덴 조,굴자,심양,길림,요양' && !r.land.length, '7곳이 뭍 위에 있다 ' + r.land.join(','));
    const on = (arr, id) => arr.find(x => x.id === id).on, own = (arr, id) => arr.find(x => x.id === id).owner;
    ok(on(r.y1490, 309) && own(r.y1490, 313) === '명' && own(r.y1490, 315) === '명' && on(r.y1490, 310) && !on(r.y1490, 311) && !on(r.y1490, 312) && !on(r.y1490, 314), '1490년: 장가구·심양·요양(명)·차하르 올도는 있고 에르덴 조·굴자·길림은 아직 없다');
    ok(own(r.y1650, 313) === '청' && own(r.y1650, 315) === '청' && own(r.y1650, 309) === '청' && !on(r.y1650, 310) && own(r.y1650, 312) === '준가르 칸국' && !on(r.y1650, 314), '1650년: 심양·요양·장가구는 청 · 차하르 올도는 사라짐 · 굴자는 준가르 칸국');
    ok(on(r.y1700, 314) && own(r.y1700, 314) === '청' && own(r.y1700, 311) === '청' && own(r.y1760, 312) === '청', '길림은 1673년부터(청) · 에르덴 조는 1691년부터 청 · 굴자는 1755년부터 청');
    ok(r.kara1580 && !r.kara1590 && r.erd1590 && r.erdDisc && r.erdLib, '카라코룸은 1585년에 에르덴 조로 — 에르데니 주 사원 발견·『몽골 원류』 도서관도 에르덴 조로');
    ok(r.zones.mongol && r.zones.china, '술집·여관의 고장 사람: 몽골 초원(차하르 올도·에르덴 조·굴자) · 중국(장가구·심양·길림·요양)');
    ok(r.fac.every(Boolean) && r.bg.every(Boolean), '교역소·술집·여관·성문이 있고 거리 배경이 있다 ' + r.bg.join(','));
    ok(r.gn && r.gn.name === '고구려 국내성' && r.gn.cat === 'ruin' && r.gn.land && r.gn.facts >= 3 && r.gn.fam === 4 && r.gn.relic.length === 1, '고구려 국내성 발견물: 단서 「' + (r.gn && r.gn.clue) + '」 · 관찰 ' + (r.gn && r.gn.facts) + ' · 가족 4줄 · 유물 ' + (r.gn && r.gn.relic.join()));
    ok(r.scene === 'city', '심양 거리 화면이 열린다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 2).join(' | '));
    console.log(fail ? '\n실패 ' + fail : '\n통과');
    process.exitCode = fail ? 1 : 0;
  } catch (e) { console.error('✗', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
