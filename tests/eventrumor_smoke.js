/* 사건·전설 부하의 소문 — 거리의 마을 사람이 5%로 그 고장 둘레의 사건을 두루뭉술하게 알려 준다 (2026-10-22)
   node tests/eventrumor_smoke.js   (스크린샷: OUT 또는 임시 폴더/eventrumor_shots) */
'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'eventrumor_shots');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [0, 1, 2, 3, 13, 14, 11], diff: 'normal' });
      const s = G.Game.state, ER = G.EventRumor, out = {};
      for (let i = 0; i < 20; i++) s.player.lg[i] = 3;
      const at = (y, cid) => { s.date = { y, m: 6, d: 1 }; return ER.at(G.CITY_DATA[cid]).map(x => x.id); };
      out.paris = at(1500, 14); out.toledo = at(1500, 4); out.hanyang = at(1500, 190); out.london1530 = at(1530, 38); out.london1500 = at(1500, 38);
      out.havana1518 = at(1518, 196); out.havana1600 = at(1600, 196); out.istanbul = at(1500, 112); out.florence = at(1485, 30); out.florence1500 = at(1500, 30);
      // 만난 사람은 소문이 끝난다
      s.date = { y: 1500, m: 6, d: 1 }; s.mates.push({ id: 'cinderella', role: 'none', loyal: 90 });
      out.parisAfter = ER.at(G.CITY_DATA[14]).map(x => x.id);
      // 마을 사람에게 말을 건다 — 확률 1로
      G.BALANCE.eventRumor.chance = 1; let said = null; G.UI.say = async (t, sp) => { said = { t, who: sp && sp.name }; };
      const c = G.CITY_DATA[4]; s.loc = { mode: 'city', city: 4 };
      const f = { type: 'elder', name: '마을 노인', seed: 1, talked: 0 };
      await G.StreetFolk.talk(f, c);
      out.said = said; out.heard = Object.keys(s.evRumor.heard); out.log = (s.log || []).slice(-1)[0];
      out.note = ER.html().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // 같은 사람은 두 번 소문을 말하지 않고, 같은 소문은 90일 안에 다시 나오지 않는다
      said = null; await G.StreetFolk.talk(f, c); out.second = said && said.t;
      out.again = ER.at(c).map(x => x.id);
      // 확률 0이면 나오지 않는다 · 말이 통하지 않으면 나오지 않는다
      G.BALANCE.eventRumor.chance = 0; out.zero = G.EventRumor.pick({ type: 'man' }, G.CITY_DATA[14]);
      G.BALANCE.eventRumor.chance = 1; s.player.lg = {}; s.mates = []; const f2 = { type: 'man', name: '사내', seed: 2, talked: 0 }; said = null;
      await G.StreetFolk.talk(f2, G.CITY_DATA[190]); out.deafHeard = Object.keys(s.evRumor.heard).length;
      G.BALANCE.eventRumor.chance = 0.05;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    ok(['cinderella', 'snow_white', 'joan', 'dartagnan'].every(id => r.paris.includes(id)), '파리: 프랑스 숲의 아가씨들·달타냥 (' + r.paris.join('·') + ')');
    ok(r.toledo.includes('quixote') && r.hanyang.includes('simcheong') && r.hanyang.includes('gyeonwoo'), '톨레도 돈키호테 · 한양 심청·견우직녀');
    ok(r.london1530.includes('henry') && !r.london1500.includes('henry'), '런던: 헨리 8세의 이혼 소문은 1525~1533년에만');
    ok(r.havana1518.includes('aztec') && !r.havana1600.includes('aztec'), '아바나: 아즈텍 소문은 1517~1521년에만');
    ok(r.istanbul.includes('scheherazade') && !r.istanbul.includes('lamp'), '이스탄불: 셰헤라자드 (알라딘은 그녀를 데려온 뒤)');
    ok(r.florence.includes('medici') && !r.florence1500.includes('medici'), '피렌체: 메디치 은행은 1492년 4월까지');
    ok(!r.parisAfter.includes('cinderella'), '이미 만난 신데렐라의 소문은 더 돌지 않는다');
    ok(r.said && r.heard.length === 1 && r.toledo.includes(r.heard[0]), '톨레도 노인: ' + (r.said && r.said.t));
    ok(!r.london1500.some(id => ['cinderella', 'snow_white', 'joan', 'dartagnan'].includes(id)), '런던 사람은 프랑스 숲 이야기를 하지 않는다 (' + r.london1500.join('·') + ')');
    ok(!r.hanyang.includes('tao'), '한양 사람은 중국 술집 이야기를 하지 않는다');
    ok(r.log && /소문 \(톨레도의 마을 사람\)/.test(r.log.t || r.log.text || r.log), '항해 일지에 남는다');
    ok(/들은 소문/.test(r.note), '수첩 할 일 아래 「들은 소문」');
    ok(!r.again.includes(r.heard[0]) && r.second && r.second.indexOf(r.said.t.slice(20, 40)) < 0, '같은 사람·같은 소문은 되풀이되지 않는다');
    ok(r.zero === null && r.deafHeard === 1, '확률 0·말이 통하지 않으면 듣지 못한다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
