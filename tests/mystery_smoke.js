/* 지역별 미스터리 유적 110곳 (js/data/mysterydisc.js) — 1600년부터 증거가 나오고 찾을 수 있다
   node tests/mystery_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const res = [];
function ok(v, msg) { res.push(!!v); console.log((v ? '  ✓ ' : '  ✗ ') + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::|Failed to load/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const out = {}, ids = G.MYSTERY_IDS, D = G.Disc, F = G.Frontier;
      out.n = ids.length;
      const reg = {}; ids.forEach(id => { const d = G.DISC[id]; reg[d.reg] = (reg[d.reg] || 0) + 1; });
      out.reg = reg;
      out.bad = ids.filter(id => { const d = G.DISC[id]; return !d || d.cat !== 'ruin' || d.openY !== 1600 || !d.mystery || !G.DISC_NAMES[id] || !G.DISC_NAMES[id].clue || !G.RELICS[id] || !d.desc || !d.hint; });
      out.must = ['괴베클리 테페', '라스코 동굴', '조조 고릉', '에페소스의 셀수스 도서관'].map(n => G.DISCOVERIES.some(d => ids.indexOf(d.id) >= 0 && (d.realName || d.name0 || d.name).indexOf(n.replace('에페소스의 ', '')) >= 0 || (G.DISC_NAMES[d.id] && G.DISC_NAMES[d.id].name === n)));
      out.names = ids.map(id => (G.DISC_NAMES[id] && G.DISC_NAMES[id].name) || G.DISC[id].name).slice(0, 4);
      out.dupId = G.DISCOVERIES.length - new Set(G.DISCOVERIES.map(d => d.id)).size;
      // 새 게임: 모든 개척 단계를 연 채로 1599년과 1600년을 견준다
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state;
      (G.FRONTIERS || []).forEach(f => { const o = F.state(f.id); o.lv = 3; o.t2 = true; o.t3 = true; });
      const pick = ids.map(id => G.DISC[id]).filter(d => d.how === 'land');
      function at(y) {
        s.date = { y: y, m: 6, d: 1 };
        const avail = ids.filter(id => F.available(G.DISC[id])).length;
        const hint = ids.filter(id => F.canHint(G.DISC[id], 'relic:x') ).length;
        let found = 0; pick.forEach(d => { const h = D.checkLand(d.lon, d.lat, { search: true }).hits; if (h && h.some(x => x.id === d.id)) found++; });
        const add = D.addHint(pick[0].id, 'tavern') ? 1 : 0; delete s.hints[pick[0].id];
        return { avail, hint, found, add };
      }
      if (G.BALANCE.noClueFind) G.BALANCE.noClueFind.on = false;
      out.y1599 = at(1599); out.y1600 = at(1600);
      out.land = pick.length;
      out.ach = G.ACHIEVEMENTS.find(a => a.id === 'mysteries');
      out.ach = out.ach && { n: out.ach.n, ids: out.ach.ids.length, ev: !!(G.ACHV_EVENTS && G.ACHV_EVENTS.mysteries) };
      return out;
    });
    console.log(JSON.stringify(r));
    ok(r.n === 110 && Object.keys(r.reg).length === 11 && Object.values(r.reg).every(x => x === 10), '11개 지역마다 10곳씩 모두 110곳');
    ok(!r.bad.length, '모두 유적 · 1600년 · 단서 이름 · 유물 · 설명 · 소문이 있다 ' + r.bad.join(','));
    ok(r.must.every(Boolean), '사용자가 든 곳: 괴베클리 테페 · 라스코 동굴 · 조조 고릉 · 셀수스 도서관 ' + JSON.stringify(r.must));
    ok(r.dupId === 0, '발견물 id가 겹치지 않는다');
    ok(r.y1599.avail === 0 && r.y1599.hint === 0 && r.y1599.found === 0 && r.y1599.add === 0, '1599년: 단서도, 그 자리에 가도 찾을 수 없다 ' + JSON.stringify(r.y1599));
    ok(r.y1600.avail === 110 && r.y1600.hint === 110 && r.y1600.found >= r.land * 0.9 && r.y1600.add === 1, '1600년: 단서가 돌고 그 자리에서 찾는다 ' + JSON.stringify(r.y1600) + ' (뭍 ' + r.land + '곳)');
    ok(r.ach && r.ach.ids === 110 && r.ach.n === 20 && r.ach.ev, '업적 「세계의 수수께끼」(20곳)와 그 장면');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
  const bad = res.filter(x => !x).length;
  console.log(bad ? '실패 ' + bad : '모두 통과 ' + res.length);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
