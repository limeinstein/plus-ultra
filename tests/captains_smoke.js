/* 바다의 이름난 선장들 점검 (js/data/seacaptains.js · js/systems/seacaptains.js)
   · 명부: 후원자·항해사·탐험가와 겹치는 사람이 없고, 해마다 나라별 자리(7/5/4)와 상선·군함 최소 수가 채워지는지
   · 한 나라 상선 4척이 한꺼번에 나와도 모두 다른 선장이 붙는지 (바다에 보이는 수보다 명부가 적지 않다)
   · 이름난 해적: 1515년 지중해 → 바르바로사 형제, 바르바로사를 고용하면 그는 나오지 않는다
   · 10년 동안 고용되지 않은 철새 → 제독, 그 기함을 나포하면 다시 철새(술집에 나타남)
   · 실존 선장을 사로잡으면 몸값을 받고 명부에서 빠진다 · 바다에 나가 며칠 지나도 오류 없음
   node tests/captains_smoke.js */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAME = pathToFileURL(path.join(ROOT, process.env.PAGE || 'index.html')).href;
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }

(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::/.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errors.push('console: ' + m.text()); });
  try {
    await page.goto(GAME);
    await page.waitForFunction(() => window.G && G.Game && G.Captains && G.Captains.hooked, null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.State.newGame({ name: '주앙', nation: 'PT', job: 'explorer', age: 25, birth: { m: 1, d: 1 }, st: { str: 60, int: 62, mar: 58, cha: 64 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, CP = G.Captains, out = {};
      out.nCaps = CP.list().length; out.nPir = CP.pirates().length;
      const sponsorNames = {}; G.SPONSORS.forEach(sp => sp.holders.forEach(h => sponsorNames[h[2]] = 1));
      const mateNames = {}; G.MATES.forEach(m => { if (!m.wd) mateNames[m.name] = 1; });
      out.clash = CP.list().concat(CP.pirates()).filter(c => !c.mate && (sponsorNames[c.name] || mateNames[c.name])).map(c => c.name);
      out.dropped = G.SEA_CAPTAINS.filter(c => !CP.list().includes(c)).map(c => c.name);
      // 해마다 자리
      out.short = [];
      for (const y of [1480, 1500, 1530, 1560, 1590, 1620, 1650, 1700, 1750, 1800]) {
        s.date.y = y; s.capRoster = null; CP.ensure();
        Object.keys(G.SEA_GROUPS).forEach(k => {
          const g = G.SEA_GROUPS[k], L = CP.roster(k, y);
          const n = L.filter(c => c.k === 'n' || c.k === 'b').length, m = L.filter(c => c.k === 'm' || c.k === 'b').length;
          if (L.length < g.seats || n < g.min || m < g.min) out.short.push(y + ' ' + k + ' ' + L.length + '/' + n + '/' + m);
        });
      }
      s.date.y = 1515; s.capRoster = null; CP.ensure();
      out.es1515 = CP.roster('ES').map(c => c.name + (c.src === 'gen' ? '*' : ''));
      out.ot1560 = (s.date.y = 1560, s.capRoster = null, CP.ensure(), CP.roster('OT').map(c => c.name + (c.src === 'gen' ? '*' : '')));
      // 상선 4척이 한꺼번에
      s.date.y = 1560; s.capRoster = null;
      const npcs = [];
      for (let i = 0; i < 4; i++) { const n = { kind: 'merchant', nation: '포르투갈', zone: 'atl', lon: -12, lat: 38, n: 2, K: 0.3, ships: ['carrack', 'caravel'] }; G.SeaFolk.decorate(n, npcs); npcs.push(n); }
      out.four = npcs.map(n => n.cap ? n.cap.name : n.captain && n.captain.mate ? G.MATE[n.captain.mate].name + '(항해사)' : null);
      out.fourLabel = npcs[0].label;
      // 해적
      s.date.y = 1515; s.capRoster = null; G.BALANCE.captains.namedPirate = 1;
      const pir = []; for (let i = 0; i < 6; i++) { const n = { kind: 'pirate', zone: 'med', lon: 10, lat: 37, n: 2, K: 0.3, ships: ['fusta', 'galley'] }; G.SeaFolk.decorate(n, pir); pir.push(n); }
      out.pir = pir.map(n => n.cap ? n.cap.name : null);
      out.pirText = G.Captains.encounterText(pir[0], '', false);
      s.mates.push({ id: 'barbarossa', role: 'none', joined: 0, loyal: 80 });
      const pir2 = []; for (let i = 0; i < 6; i++) { const n = { kind: 'pirate', zone: 'med', lon: 10, lat: 37, n: 2, K: 0.3, ships: ['fusta'] }; G.SeaFolk.decorate(n, pir2); pir2.push(n); }
      out.pirHired = pir2.map(n => n.cap ? n.cap.name : null);
      s.mates = s.mates.filter(m => m.id !== 'barbarossa');
      // 철새 → 제독 → 나포 → 철새
      s.date.y = 1530; s.capRoster = null; CP.ensure();
      const wd = G.MATES.find(m => m.wd && m.st);
      const rr = s.capRoster; rr.seen[wd.id] = 1519;
      G.BALANCE.captains.promoteP = 1; G.BALANCE.captains.promoteMax = 999;
      const news = CP.newYear();
      out.promNews = news.map(x => x.text).join(' / ').slice(0, 220);
      out.prom = rr.prom[wd.id]; out.gone = !!s.flags['gone_' + wd.id];
      const pr = rr.prom[wd.id];
      let fleet = null;
      for (let i = 0; i < 40 && !fleet; i++) {
        const n = pr.k === 'p' ? { kind: 'pirate', zone: pr.zone, lon: -12, lat: 38, n: 2, K: 0.3, ships: ['caravel'] } : { kind: pr.k === 'n' ? 'navy' : 'merchant', nation: G.SEA_GROUPS[pr.nat].al[0], zone: 'atl', lon: -12, lat: 38, n: 2, K: 0.3, ships: ['caravel'] };
        G.SeaFolk.decorate(n, []);
        if (n.cap && n.cap.id === wd.id) fleet = n;
      }
      out.fleetLabel = fleet && fleet.label;
      out.speaker = fleet && G.SeaFolk.captain(fleet, {}).name;
      const lines = [];
      G.Captains.afterBattle(fleet, 'win', [{ side: 'en', flag: true, captured: true }], lines);
      out.capLine = lines.join(' ');
      out.freed = !s.flags['gone_' + wd.id] && !rr.prom[wd.id];
      out.where = G.MateMove.where(wd.id) && G.MateMove.where(wd.id).name;
      // 실존 선장 사로잡기
      s.date.y = 1560; s.capRoster = null; CP.ensure();
      const nv = { kind: 'navy', nation: '오스만 제국', zone: 'med', lon: 20, lat: 36, n: 2, K: 0.4, ships: ['galley', 'galley'] };
      G.SeaFolk.decorate(nv, []);
      const g0 = s.player.gold, l2 = [];
      G.Captains.afterBattle(nv, 'win', [{ side: 'en', flag: true, captured: true }], l2);
      out.ransom = s.player.gold - g0; out.histOut = !!s.capRoster.out[nv.cap.id]; out.histName = nv.cap.name; out.histMate = nv.cap.mate || null; out.histLine = l2.join(' ').replace(/<[^>]+>/g, '');
      // 다른 선장 수에 비해 저장 크기
      out.saveLen = JSON.stringify(s.capRoster).length;
      return out;
    });
    console.log('  명부 ' + r.nCaps + '명 · 해적 ' + r.nPir + '명' + (r.dropped.length ? ' · 걸러 낸 사람: ' + r.dropped.join(', ') : ''));
    ok(!r.clash.length, '후원자·항해사와 겹치는 이름 없음 ' + r.clash.join(','));
    ok(!r.short.length, '1480~1800년 모든 나라 자리·상선/군함 최소 수 채움 ' + r.short.slice(0, 5).join(' | '));
    console.log('    1515 에스파냐: ' + r.es1515.join(', '));
    console.log('    1560 오스만: ' + r.ot1560.join(', '));
    ok(r.four.every(Boolean) && new Set(r.four).size === 4, '포르투갈 상선 4척 모두 다른 선장: ' + r.four.join(', '));
    console.log('    이름표: ' + r.fourLabel);
    ok(r.pir.filter(Boolean).length >= 3 && r.pir.some(x => /바르바로사|오루츠|이샤크/.test(x || '')), '1515 지중해 해적: ' + r.pir.join(', '));
    ok(!r.pirHired.some(x => x === '하이레딘 바르바로사'), '바르바로사를 고용하면 해적으로 나오지 않음: ' + r.pirHired.join(', '));
    ok(r.prom && r.gone, '10년 고용되지 않은 철새 → ' + JSON.stringify(r.prom) + ' — ' + r.promNews);
    ok(r.fleetLabel && r.speaker, '그 함대: ' + r.fleetLabel);
    ok(r.freed && r.where && /철새/.test(r.capLine), '기함 나포 → 다시 철새 (' + r.where + ') — ' + r.capLine.replace(/<[^>]+>/g, ''));
    ok(r.histOut && (r.histMate ? /철새/.test(r.histLine) : r.ransom > 0), '명부의 선장 ' + r.histName + ' 사로잡음 → ' + (r.histMate ? '항해사로 이어진 사람이라 철새가 됨' : '몸값 ' + r.ransom) + ', 명부에서 빠짐');
    console.log('    저장 크기 ' + r.saveLen + '자');
    // 바다에 나가 며칠
    await page.evaluate(() => { const s = G.Game.state; s.date.y = 1560; s.capRoster = null; G.Game.go('sea', { depart: s.player.home }); });
    await page.waitForTimeout(3000);
    await page.evaluate(() => { for (let i = 0; i < 30; i++) G.Game.passDays ? null : null; });
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(6000);
    const seen = await page.evaluate(() => (G.Scenes.sea._npcs ? G.Scenes.sea._npcs() : []).length);
    ok(!errors.length, '콘솔 오류 없음' + (errors.length ? ': ' + errors.join(' / ') : ''));
  } catch (e) {
    console.error('✗ ' + e.message); if (errors.length) console.error(errors.join('\n')); process.exitCode = 1;
  } finally { await browser.close(); }
})();
