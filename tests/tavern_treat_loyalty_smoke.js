/* 술집에서 한턱 내면 모든 고용 부하의 충성이 오르는지 점검
   node tests/tavern_treat_loyalty_smoke.js */
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
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title', null, { timeout: 90000 });
    const r = await page.evaluate(async () => {
      G.Game.state = G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 22, birth: { m: 6, d: 10 }, st: { str: 50, int: 50, mar: 50, cha: 50 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state, T = G.Scenes.city.B.tavern, c = G.CITY_DATA[0], ids = G.MATES.slice(0, 3).map(x => x.id);
      s.mates = [{ id: ids[0], role: 'none', loyal: 0 }, { id: ids[1], role: 'none', loyal: 98 }, { id: ids[2], role: 'none', loyal: 100 }];
      s.player.gold = 1000; s.fleet.crew = 10; s.fleet.discipline = 50; s.fleet.fatigue = 50;
      const cur = { treats: 0, looked: true };
      G.Scenes.city.current = () => cur;
      G.UI.confirm = async () => true;
      G.UI.say = async () => {};
      G.Scenes.city.mate = async () => {};
      G.U.chance = () => false;
      const gold0 = s.player.gold;
      await T.treat(c);
      return { loyal: s.mates.map(m => m.loyal), gold: gold0 - s.player.gold, discipline: s.fleet.discipline, fatigue: s.fleet.fatigue, treats: cur.treats, configured: G.BALANCE.mates.treatLoyal };
    });
    ok(r.configured === 3, '한턱 충성 상승량은 밸런스 값 +3');
    ok(r.loyal.join() === '3,100,100', '모든 부하 충성 상승 및 100 상한: ' + r.loyal.join(' → '));
    ok(r.gold > 0 && r.discipline === 62 && r.fatigue === 35 && r.treats === 1, '기존 비용·규율·피로·한턱 횟수 효과 유지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.join(' | '));
  } catch (e) { console.error('✗', e.message); console.error(errors.join('\n')); process.exitCode = 1; } finally { await browser.close(); }
})();
