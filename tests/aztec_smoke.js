/* 아즈텍 제국의 멸망 (js/systems/aztec.js): 열두 장의 문, 세 갈래(정복자·황제·방관)의 진행과 결말, 소식, 입항 금지, 술집 제외, 퇴각 판 육상전, 호수의 큰 싸움 자료.
   대화·선택은 시험용으로 대신 고르고(UI.say/ask), 싸움(육상전·일기토·큰 해전)은 결과만 돌려준다. 퇴각 판과 호수의 해전 장면은 따로 확인한다. */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

(async function () {
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_EXE || undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Aztec && !G.Scenes.title.bootPending, null, { timeout: 120000 });
    const result = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const AZ = G.Aztec, UI = G.UI;
      function fresh(nation) {
        G.State.newGame({ name: '시험', nation: nation || 'PT', job: 'explorer', age: 24, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.settings.sound = 0; s.settings.music = 0; s.fleet.crew = Math.max(s.fleet.crew, 80); s.player.gold = 50000;
        return s;
      }
      // 대화·선택 대신 고르기
      let answers = [], asked = [], said = 0;
      const keep = { say: UI.say, ask: UI.ask, fade: UI.fade, toast: UI.toast, alert: UI.alert };
      UI.say = async () => { said++; };
      UI.ask = async (q, opts) => { asked.push(q); const want = answers.shift(); const o = opts.filter(x => x.value === want)[0] || opts[0]; return o.value; };
      UI.fade = async fn => { fn && fn(); };
      UI.alert = async () => {};
      G.Scenes.city.news = async () => {};   // 머무는 동안의 소식 창
      const fights = [];
      G.Scenes.land.landBattle = async (name, n, b, o) => { fights.push({ name, n, hold: o && o.hold, leader: o && o.leader }); return 'win'; };
      G.Games.duel = async () => 'win';
      G.Disc.find = async (d) => { const g = G.Game.state; g.disc[d.id] = Object.assign(g.disc[d.id] || {}, { found: 1, me: true }); return true; };   // 발견 창 대신
      const greats = [];
      const gb = G.Rel.greatBattle;
      G.Rel.greatBattle = async (spec) => { greats.push(spec); spec.onWin && spec.onWin(); return true; };
      function at(s, y, m, d, city) { s.date = { y, m, d }; s.loc = { mode: 'city', city, lon: G.CITY_DATA[city].lon, lat: G.CITY_DATA[city].lat }; }
      async function go(s, y, m, d, city, ans) { at(s, y, m, d, city); answers = ans || []; const p = AZ.pending(); if (p) await AZ.check(); return p; }

      // ---------------- 문 (장마다 그 때 그 곳)
      let s = fresh();
      const gates = {};
      const O = AZ._open, C = AZ.CITY;
      function gate(name, y, m, d, city, state, arg) { s.aztec = Object.assign({ told: {} }, state || {}); at(s, y, m, d, city); return !!O[name](arg); }
      gates.rumor = gate('rumor', 1518, 6, 1, C.SANTIAGO);
      gates.rumorLate = gate('rumor', 1519, 3, 1, C.SANTIAGO);
      gates.sea = gate('sea', 1519, 3, 1, C.VERACRUZ, {}, { exp: { id: 'cortes' } });
      gates.vc = gate('vc', 1519, 5, 1, C.VERACRUZ);
      gates.tlax = gate('tlax', 1519, 9, 1, C.TLAX);
      gates.aud = gate('aud', 1519, 12, 1, C.TENOCH);
      gates.cemp = gate('cemp', 1520, 5, 20, C.VERACRUZ);
      gates.mass = gate('mass', 1520, 6, 1, C.TENOCH);
      gates.noche = gate('noche', 1520, 7, 1, C.TENOCH);
      gates.otumba = gate('otumba', 1520, 7, 20, C.TLAX);
      gates.pox = gate('pox', 1520, 10, 1, C.TLAX, { met: 1 });
      gates.lakeCortes = gate('lake', 1521, 6, 1, C.TLAX, { side: 'cortes' });
      gates.lakeAztec = gate('lake', 1521, 6, 1, C.TENOCH, { side: 'aztec' });
      gates.lakeNone = gate('lake', 1521, 6, 1, C.TENOCH, { side: 'none' });
      gates.end = gate('end', 1521, 9, 1, 7, { side: 'cortes' });

      // ---------------- 정복자의 편 (포르투갈 제독 — 에스파냐의 명예 작위)
      s = fresh('PT'); fights.length = 0; greats.length = 0;
      await go(s, 1518, 12, 1, C.SANTIAGO, ['cortes']);
      at(s, 1519, 3, 1, C.VERACRUZ); answers = ['rescue']; await AZ._t.sea();
      const aguilar = s.mates.some(m => m.id === 'aguilar');
      await go(s, 1519, 5, 1, C.VERACRUZ, ['cortes']);
      const sideAfterVc = s.aztec.side, marinaJoined = s.mates.some(m => m.id === 'marina');
      await go(s, 1519, 9, 1, C.TLAX, ['duel']);
      await go(s, 1519, 12, 1, C.TENOCH, ['peace']);
      await go(s, 1520, 5, 20, C.VERACRUZ, ['cortes']);
      const goldBeforeMass = s.player.gold;
      await go(s, 1520, 6, 1, C.TENOCH, ['stop', 'children', 1]);   // 머물러 슬픈 밤까지 → 금괴를 지고 → 오툰바
      const afterStay = { date: s.date.y * 10000 + s.date.m * 100 + s.date.d, noche: s.aztec.noche, otumba: s.aztec.otumba, wish: s.aztec.wish };
      const holdFight = fights.filter(f => f.hold)[0] || null;
      // 날마다 소식 (깃털관의 몫)
      s.date = { y: 1520, m: 8, d: 2 }; const crownNews = AZ.daily().map(x => x.text).join(' | ');
      await go(s, 1520, 10, 1, C.TLAX, ['help']);
      await go(s, 1521, 6, 1, C.TLAX, []);
      const lakeSpec = greats[0] ? { id: greats[0].id, my: greats[0].myFleet.length, allies: greats[0].allies.length, foes: greats[0].ships.length, lake: greats[0].lake, back: greats[0].backCity } : null;
      const titleBefore = G.Court.rank(G.COURT.realms.ES);
      await go(s, 1521, 8, 20, 7, ['stop']);
      const cortes = { side: s.aztec.side, end: s.aztec.end, lake: s.aztec.lake, title: G.Court.rank(G.COURT.realms.ES) - titleBefore, marinaStays: s.mates.some(m => m.id === 'marina'), aguilar, sideAfterVc, marinaJoined, xico: s.aztec.xico, cemp: s.aztec.cemp, mass: s.aztec.mass, afterStay, holdFight, crownHalf: /깃털관/.test(crownNews), lakeSpec, noto: s.player.notoriety };

      // ---------------- 황제의 편 (에스파냐 제독 — 작위 한 칸을 잃고 입항 금지)
      s = fresh('ES'); fights.length = 0; greats.length = 0;
      G.Court.state().titles.ES = 2;
      await go(s, 1519, 5, 1, C.VERACRUZ, ['none']);
      await go(s, 1519, 12, 1, C.TENOCH, ['aztec']);
      const crown = G.Disc.foundByMe('moctezuma');
      const marinaA = s.mates.some(m => m.id === 'marina');
      await go(s, 1520, 5, 20, C.VERACRUZ, []);
      await go(s, 1520, 6, 1, C.TENOCH, ['fight', 'treasure', 0]);
      await go(s, 1520, 7, 2, C.TENOCH, []);
      await go(s, 1521, 5, 10, C.TENOCH, []);
      await go(s, 1521, 8, 20, 7, []);
      at(s, 1522, 3, 1, 7);
      const ban = G.Scenes.city.entryCheck(G.CITY_DATA[C.VERACRUZ]);
      s.date = { y: 1526, m: 2, d: 1 };
      const banLater = G.Scenes.city.entryCheck(G.CITY_DATA[C.VERACRUZ]);
      const aztec = { side: s.aztec.side, crown, marinaA, marinaLeft: !s.mates.some(m => m.id === 'marina'), cuauh: s.mates.some(m => m.id === 'h_cuauhtemoc'), title: G.Court.rank(G.COURT.realms.ES), ban: ban && ban.reason, banLater: banLater && banLater.reason, noche: s.aztec.noche, lakeFoe: greats[0] && greats[0].foe, mask: s.player.items.some(i => i.id === 'moctezuma_mask') };

      // ---------------- 방관 — 정복 전쟁의 값, 그림 문서, 코르테스의 발표
      s = fresh('PT');
      await go(s, 1519, 5, 1, C.VERACRUZ, ['none']);
      s.loc = { mode: 'sea', lon: -80, lat: 20 };
      const newsTxt = [];
      for (const d of [[1519, 11, 9], [1520, 9, 16], [1521, 1, 2]]) { s.date = { y: d[0], m: d[1], d: d[2] }; AZ.daily().forEach(x => newsTxt.push(x.text)); }
      const econ = G.Econ.st ? null : null;
      await go(s, 1521, 9, 1, C.VERACRUZ, [1]);
      const none = { side: s.aztec.side, codex: s.player.items.some(i => i.id === 'aztec_codex'), pox: /천연두/.test(newsTxt.join()), war: /정복 전쟁/.test(newsTxt.join()), enter: /호수 위의 도시/.test(newsTxt.join()), defs: !!(G.Econ.DEF.aztecpox && G.Econ.DEF.aztecwar) };

      // ---------------- 멀리 있어도: 역사의 날에 테노치티틀란이 에스파냐로
      s = fresh('PT'); s.loc = { mode: 'sea', lon: -10, lat: 38 };
      s.date = { y: 1521, m: 8, d: 12 };
      G.Game.passDays(1);
      const owner13 = s.owners[200];
      // 황제의 대 (해의 소수 = 달)
      const azk = G.SPONSOR.az_king;
      const holders = [[1520, 3], [1520, 8], [1521, 3], [1521, 10]].map(([y, m]) => G.Sponsor.holder(azk, { y, m, d: 1 }));
      // 술집: 말린체·아길라르는 나오지 않는다
      s.date = { y: 1525, m: 1, d: 1 }; s.disc.aztec = { found: 15191108, rival: '에르난 코르테스' };
      const tavern = G.Frontier.mateReady(G.MATE.marina, 1525) || G.Frontier.mateReady(G.MATE.aguilar, 1525);
      // 오래된 저장 (1522년 뒤) → 방관
      s = fresh('PT'); delete s.aztec; s.date = { y: 1530, m: 1, d: 1 };
      AZ.daily(); const old = s.aztec.side;

      G.Rel.greatBattle = gb; Object.assign(UI, keep);
      return { figures: G.AZTEC_FIGS.length, gates, cortes, aztec, none, owner13, holders, tavern, old, asked: asked.length, said };
    });
    const r = result;
    assert.strictEqual(r.figures, 12, '역사 인물 12명');
    assert.deepStrictEqual(r.gates, { rumor: true, rumorLate: false, sea: true, vc: true, tlax: true, aud: true, cemp: true, mass: true, noche: true, otumba: true, pox: true, lakeCortes: true, lakeAztec: true, lakeNone: false, end: true }, '장마다의 문');
    const c = r.cortes;
    assert(c.aguilar, '코수멜에서 아길라르를 먼저 구하면 부하');
    assert.strictEqual(c.sideAfterVc, 'cortes'); assert(c.marinaJoined, '정복자의 편 — 말린체가 통역으로');
    assert.strictEqual(c.xico, 'duel', '시코텐카틀 일기토');
    assert.strictEqual(c.cemp, 'won'); assert.strictEqual(c.mass, 'stop');
    assert.strictEqual(c.afterStay.date, 15200630, '머물면 슬픈 밤(6.30)까지'); assert.strictEqual(c.afterStay.noche, 'carry'); assert.strictEqual(c.afterStay.otumba, 'win');
    assert(c.holdFight && c.holdFight.hold === 6, '금괴를 지면 퇴각 판 6차례');
    assert(c.crownHalf, '깃털관 발표의 몫');
    assert.deepStrictEqual(c.lakeSpec, { id: 'aztec_lake', my: 4, allies: 8, foes: 14, lake: true, back: 202 }, '호수의 큰 싸움 자료');
    assert.strictEqual(c.lake, 'won'); assert.strictEqual(c.end, 'cortes');
    assert.strictEqual(c.title, 1, '호수에서 이기면 에스파냐 작위 한 칸 (포르투갈 제독은 명예 작위)');
    assert(c.marinaStays, '「멈추라」를 두 번 — 말린체가 남는다');
    const a = r.aztec;
    assert.strictEqual(a.side, 'aztec'); assert(a.crown, '황제에게서 깃털관을 직접 받는다'); assert(a.marinaA && a.marinaLeft, '말린체는 돕다가 끝에 떠난다');
    assert(!a.cuauh, '호수에서 이겨도 황제 쿠아우테목은 부하가 되지 않는다 — 마야 해안에 내린다 (js/systems/matepower.js, 2026-10-29)'); assert.strictEqual(a.title, 1, '에스파냐 제독은 작위 한 칸을 잃는다');
    assert.strictEqual(a.ban, 'aztecban'); assert.strictEqual(a.banLater, null, '입항 금지는 1525년까지');
    assert.strictEqual(a.noche, 'held'); assert.strictEqual(a.lakeFoe, '에스파냐'); assert(a.mask);
    assert.deepStrictEqual(r.none, { side: 'none', codex: true, pox: true, war: true, enter: true, defs: true }, '방관 — 소식·시장 사건·그림 문서');
    assert.strictEqual(r.owner13, '에스파냐', '1521.8.13 테노치티틀란의 주인이 에스파냐로');
    assert.deepStrictEqual(r.holders, ['목테수마 2세', '쿠이틀라우아크', '쿠아우테목', null], '황제의 대');
    assert.strictEqual(r.tavern, false, '말린체·아길라르는 술집에 나오지 않는다');
    assert.strictEqual(r.old, 'none', '오래된 저장은 방관');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
