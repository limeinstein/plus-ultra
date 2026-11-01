/* 제보 회귀: 미로·가족 이사·해안 해전·잔 질문·연인 해고·설정·항구 모집. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('../tools/procedural_art/node_modules/playwright-core');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'artifacts/feedback-20261101');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--allow-file-access-from-files', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; });
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    await page.evaluate(async () => {
      await G.Game.ensureGeo();
      G.Scenes.title.exit();
      window.feedbackFresh = function () {
        const s = G.Game.state = G.State.newGame({ name: '제보 점검', nation: 'ES', job: 'explorer', age: 30,
          birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'easy' });
        s.settings.sound = 0; s.settings.music = 0; s.settings.res = .35;
        s.day = 1000; s.date = { y: 1520, m: 5, d: 1 }; s.player.gold = 100000;
        return s;
      };
      feedbackFresh();
    });
    for (const lv of [1, 2, 3]) {
      await page.evaluate(lv => { G.Games.pz.maze({ id: 'knossos' }, lv); }, lv);
      const maze = await page.evaluate(() => {
        const cells = [...document.querySelectorAll('.maze .rm')];
        return { count: cells.length, readable: cells.every(e => e.classList.contains('seen') || e.classList.contains('near')),
          walls: cells.filter(e => /\bw[nsew]\b/.test(e.className)).length, torch: cells.filter(e => e.classList.contains('me')).length };
      });
      assert(maze.count === 64 && maze.readable && maze.walls > 50 && maze.torch === 1, '미로의 모든 방과 벽을 읽을 수 있다 ★' + lv);
      if (lv === 2) await page.screenshot({ path: path.join(OUT, 'maze.png') });
      await page.locator('.modal-back .foot button', { hasText: '포기한다' }).click();
    }
    console.log('통과 · 미로 3단계에서 모든 벽·통로 표시');

    const family = await page.evaluate(async () => {
      const s = feedbackFresh(), p = s.player, FE = G.FamEv, play = FE.play;
      const site = G.Colony.sites().find(x => x.nat === 'ES');
      s.colony = { list: [{ id: 1000, key: site.key, nat: 'ES', owner: '에스파냐', name: '시험 관저', stage: 4, gov: true }], call: null };
      G.Colony.apply();
      p.wife = Object.keys(G.MAID)[0]; p.homeSeen = 0; p.wifeAboard = false;
      G.BALANCE.famEv.dockChance = 1;
      FE.play = async (id, cs) => ({ id, city: cs.city, home: cs.home });
      try {
        const before = await FE.arrive(G.CITY_DATA[p.home]);
        p.seat = 1000;
        const oldHome = await FE.arrive(G.CITY_DATA[p.home]);
        const seat = await FE.arrive(G.CITY_DATA[1000]);
        p.wifeAboard = true;
        const aboard = await FE.arrive(G.CITY_DATA[1000]);
        return { before, oldHome, seat, aboard };
      } finally { FE.play = play; }
    });
    assert(family.before.id === 'dock_embrace' && family.oldHome === false && family.seat.id === 'dock_embrace' && family.seat.city === '시험 관저' && family.seat.home === '시험 관저' && family.aboard === false, JSON.stringify(family));
    console.log('통과 · 이사 전 고향/이사 후 관저 마중, 옛집·동승 시 마중 없음');

    const dismissal = await page.evaluate(async () => {
      const UI = G.UI, confirm = UI.confirm, say = UI.say, chance = G.U.chance, results = [];
      UI.say = async () => {}; G.U.chance = () => false;
      try {
        for (const ids of [['romeo', 'juliet'], ['juliet', 'romeo'], ['gyeonwoo', 'jiknyeo'], ['jiknyeo', 'gyeonwoo']]) {
          const s = feedbackFresh(); s.loc = { mode: 'city', city: s.player.home };
          if (ids.includes('gyeonwoo')) s.gw = { stage: 3, end: 'crew', wed: G.U.dateNum(s.date), aboard: [] };
          s.mates.push(...ids.map(id => ({ id, role: 'none', loyal: 80, joinedDay: s.day, joined: G.U.dateNum(s.date), ev: true })));
          // 저장 후 불러온 상태에서도 사건 부부 관계를 읽는다.
          G.Game.state = JSON.parse(JSON.stringify(s)); const loaded = G.Game.state;
          let warning = '';
          UI.confirm = async text => { warning = text; return false; };
          const cancelled = !await G.MateDismiss.fire(loaded.mates.find(m => m.id === ids[0])) && ids.every(id => loaded.mates.some(m => m.id === id));
          const warned = warning.includes(G.MATE[ids[1]].name) && warning.includes('함께');
          UI.confirm = async () => true;
          const fired = await G.MateDismiss.fire(loaded.mates.find(m => m.id === ids[0]));
          results.push({ from: ids[0], follows: ids[1], cancelled, warned, fired,
            left: ids.every(id => !loaded.mates.some(m => m.id === id)), returning: ids.every(id => G.MateDismiss.returning(id)) });
        }
        return results;
      } finally { UI.confirm = confirm; UI.say = say; G.U.chance = chance; }
    });
    for (const d of dismissal) assert(d.cancelled && d.warned && d.fired && d.left && d.returning, JSON.stringify(d));
    console.log('통과 · 로미오↔줄리엣·견우↔직녀 네 방향: 동반 하선 경고·취소 시 둘 다 잔류·확정 시 함께 하선·재등용');

    await page.evaluate(() => { feedbackFresh(); G.Info.settings(); });
    const settings = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.modal-back button[data-act]')];
      return { first: buttons.slice(0, 2).map(e => e.dataset.act), top: buttons.slice(0, 2).every(e => e.getBoundingClientRect().bottom < innerHeight),
        aboveOptions: buttons[0].compareDocumentPosition(document.querySelector('.modal-back .kv')) & Node.DOCUMENT_POSITION_FOLLOWING };
    });
    assert.deepStrictEqual(settings.first, ['save', 'title']); assert(settings.top && settings.aboveOptions);
    await page.screenshot({ path: path.join(OUT, 'settings.png') });
    await page.evaluate(() => { window.feedbackSaves = 0; window.feedbackSaveMenu = G.Info.saveMenu; G.Info.saveMenu = async () => { feedbackSaves++; }; });
    await page.locator('[data-act=save]').click();
    assert.strictEqual(await page.evaluate(() => feedbackSaves), 1);
    await page.evaluate(() => { G.Info.saveMenu = feedbackSaveMenu; });
    await page.keyboard.press('Escape');
    console.log('통과 · 설정 최상단 기록·타이틀 버튼, 기록 연결');

    const recruit = await page.evaluate(async () => {
      const s = feedbackFresh(), c = G.CITY_DATA[s.player.home], H = G.Scenes.city.B.harbor, UI = G.UI;
      s.loc = { mode: 'city', city: c.id }; s.fleet.crew = Math.max(1, G.R.crewMin() - 3);
      const n = s.fleet.crew, gold = s.player.gold, cost = G.R.hireCost(c), number = UI.number;
      const item = H.menu(c).find(x => x && x.label === '선원을 모은다');
      try { UI.number = async () => n + 3; await item.onClick(); }
      finally { UI.number = number; }
      return { n: s.fleet.crew - n, paid: gold - s.player.gold, want: cost * 3, tavern: G.Scenes.city.B.tavern.menu(c).some(x => x && x.label === '선원을 모은다') };
    });
    assert(recruit.n === 3 && recruit.paid === recruit.want && recruit.tavern);
    console.log('통과 · 항구에서 모집·비용 차감, 술집 모집 유지');

    const battles = await page.evaluate(async () => {
      const B = G.Scenes.battle, results = [], originalSdf = G.Geo.sdf, originalBerg = G.Geo.berg;
      const random = G.U.rf; G.U.rf = (a, b) => (a + b) / 2;
      function start(name, lon, lat, synthetic) {
        const s = feedbackFresh();
        s.loc = { mode: 'sea', lon, lat, heading: 0 };
        const ship = G.SHIP.galleon;
        s.fleet.ships = Array.from({ length: 5 }, (_, i) => ({ type: ship.id, name: '시험선' + i, hp: ship.hp, maxHp: ship.hp, crewMax: ship.crew[1], guns: { type: 'saker', n: 8 }, sails: ship.sails.slice() }));
        s.fleet.crew = 300;
        const began = performance.now();
        G.Game.go('battle', { npc: { kind: 'pirate', types: Array(5).fill('galleon'), n: 5 } });
        const st = B.runtime(), T = B._t(), me = st.ships.find(b => b.side === 'me' && b.flag);
        const result = { name, ms: Math.round(performance.now() - began), count: st.ships.length,
          afloat: st.ships.every(b => !T.terrainBlocked(b.x, b.y, b)),
          connected: st.ships.every(b => T.lineClear(b, me.x, me.y) || T.navPath(b, me.x, me.y)),
          sameSide: !synthetic || st.ships.every(b => b.x < 90),
          separated: st.ships.every((b, i) => st.ships.slice(i + 1).every(o => Math.hypot(b.x - o.x, b.y - o.y) >= Math.max(55, (b.len + o.len) * .42))) };
        results.push(result); B.exit();
      }
      try {
        // 조우 지점 바로 동쪽을 남북으로 가르는 육지. 이전 배치는 적을 반대 바다에 놓았다.
        G.Geo.sdf = lon => lon > .1 && lon < .3 ? 10 : -10; G.Geo.berg = () => false;
        start('남북 반도 재현', 0, 0, true);
        G.Geo.sdf = originalSdf; G.Geo.berg = originalBerg;
        for (const [name, lon, lat] of [['푸켓 서안', 98.15, 7.8], ['푸켓 북서안', 98.1, 8.3], ['파나마 태평양', -79.6, 8.6], ['파나마 카리브해', -80, 9.5]]) start(name, lon, lat, false);
      } finally { G.Geo.sdf = originalSdf; G.Geo.berg = originalBerg; G.U.rf = random; }
      return results;
    });
    for (const b of battles) assert(b.count === 10 && b.afloat && b.connected && b.sameSide && b.separated, JSON.stringify(b));
    console.log('통과 · 반도 재현·푸켓 2곳·파나마 양안, 10척 모두 연결된 물길에 배치');
    assert.deepStrictEqual(errors, [], '콘솔 오류');
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ family, dismissal, settings, recruit, battles, errors }, null, 2));
    console.log(JSON.stringify(battles));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
