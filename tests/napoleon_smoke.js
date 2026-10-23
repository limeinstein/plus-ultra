/* 나폴레옹과 조제핀 (js/systems/napoleon.js): 코르시카 바다 포격 승리 → 소년 구조 · 백병전 승리 → 가족 구출·합류 · 오스트리아 살롱 → 도둑질·일기토 → 둘 다 동료
   node tests/napoleon_smoke.js */
'use strict';
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load resource|net::/.test(m.text())) errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Game.sceneName === 'title' && G.Napoleon, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, NP = G.Napoleon;
      const said = []; let duelRes = 'win', duelN = 0;
      UI.say = async (t, w) => { said.push((w && w.name ? w.name + ': ' : '') + t); };
      UI.ask = async (t, o) => o[0].value; UI.fade = async fn => { fn && fn(); }; UI.alert = async () => {};
      G.Games.duel = async () => { duelN++; return duelRes; };
      function fresh() {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 26, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.settings.sound = 0; s.player.gold = 5000; return s;
      }
      const sea = (s, y, lon, lat) => { s.date = { y, m: 6, d: 1 }; s.loc = { mode: 'sea', lon, lat }; };
      const pirate = { kind: 'pirate', n: 2 }, sunk = [{ side: 'en', sunk: true }, { side: 'en' }], took = [{ side: 'en', captured: true }, { side: 'en', sunk: true }];
      const out = {};
      const N = G.MATE.napoleon;
      out.skills = Object.keys(N.sk).sort().map(k => k + N.sk[k]).join(' '); out.langs = Object.keys(N.lg).sort((a, b) => a - b).map(k => k + ':' + N.lg[k]).join(' ');
      out.data = { nap: !!(G.MATE.napoleon && G.MATE.napoleon.eventOnly), jos: G.MATE.josephine && G.MATE.josephine.g, tavern: G.Frontier.mateReady(G.MATE.napoleon, 1520) || G.Frontier.mateReady(G.MATE.josephine, 1520) };
      // ① 코르시카 바다 · 포격
      let s = fresh();
      sea(s, 1509, 9, 42); NP.afterBattle(pirate, 'win', sunk, []); out.before1510 = !!NP.state().tell;
      sea(s, 1512, -9, 38); NP.afterBattle(pirate, 'win', sunk, []); out.outside = !!NP.state().tell;
      sea(s, 1512, 9, 42); NP.afterBattle(pirate, 'win', took, []); out.boardFirst = !!NP.state().tell;
      NP.afterBattle({ kind: 'navy' }, 'win', sunk, []); out.navy = !!NP.state().tell;
      const lines = []; NP.afterBattle(pirate, 'win', sunk, lines); out.rescueTell = NP.state().tell; out.rescueLine = lines.join();
      await NP.tell(); out.phase1 = NP.state().phase; out.guest = s.mates.some(m => m.id === 'napoleon');
      // ② 다른 바다 · 포격이면 귀띔, 백병전이면 가족
      sea(s, 1513, -20, 30); NP.afterBattle(pirate, 'win', sunk, []); out.hint = NP.state().tell; await NP.tell();
      NP.afterBattle(pirate, 'win', took, []); out.familyTell = NP.state().tell; said.length = 0; await NP.tell();
      out.phase2 = NP.state().phase; out.joined = s.mates.some(m => m.id === 'napoleon'); out.mother = said.some(x => /레티치아/.test(x));
      // ③ 오스트리아 — 빈
      const vienna = G.CITY_DATA.find(c => c && c.name === '비엔나');
      s.loc = { mode: 'city', city: vienna.id }; s.date = { y: 1515, m: 3, d: 1 };
      s.player.items.push({ id: 'pearlnk' }, { id: 'cards' }); const day0 = s.day;
      out.austria = G.Napoleon.isAustria(vienna); out.pending = NP.pending();
      said.length = 0; await NP.check();
      const nap = s.mates.find(m => m.id === 'napoleon'), jos = s.mates.find(m => m.id === 'josephine');
      out.win = { phase: NP.state().phase, josephine: !!jos, aff: jos && jos.aff, loyal: nap && nap.loyal, pearl: s.player.items.some(i => i.id === 'pearlnk'), days: s.day - day0, stoleSaid: said.some(x => /진주 목걸이/.test(x)), duelN, after: NP.pending() };
      // ③-2 일기토에서 지면: 조제핀이 돌려주고, 다음에 다시
      s = fresh(); duelRes = 'lose'; duelN = 0;
      s.napo = { phase: 'joined' }; G.Legend.join('napoleon', null);
      s.loc = { mode: 'city', city: vienna.id }; s.date = { y: 1520, m: 3, d: 1 }; s.player.items = []; const g0 = s.player.gold;
      await NP.check();
      out.lose = { phase: NP.state().phase, gold: s.player.gold === g0, josephine: s.mates.some(m => m.id === 'josephine'), again: NP.pending() };
      s.day += 5; duelRes = 'win'; out.lose.again2 = NP.pending(); await NP.check();
      out.lose.final = NP.state().phase; out.lose.jos2 = s.mates.some(m => m.id === 'josephine'); out.lose.duelN = duelN;
      return out;
    });
    console.log(JSON.stringify(r, null, 1));
    assert.deepStrictEqual(r.data, { nap: true, jos: 'f', tavern: false }, '전설 동료 둘 — 술집에는 나오지 않는다');
    assert.strictEqual(r.skills, 'art1 gun3 hist3 music2 nav1 ops3 sci3 ship3 shoot3 speech3 survey3 sword2', '나폴레옹 특기 (사용자 지정)');
    assert.strictEqual(r.langs, '0:3 1:3 2:3 3:3 4:3 5:3 10:3', '나폴레옹 말: 스페인어·포르투갈어·로망스어·게르만어·슬라브·아랍어·아프리카어');
    assert(!r.before1510 && !r.outside && !r.boardFirst && !r.navy, '1510년 전·코르시카 밖·백병전·해군이면 일어나지 않는다');
    assert.strictEqual(r.rescueTell, 'rescue'); assert(/손을 흔든다/.test(r.rescueLine));
    assert.strictEqual(r.phase1, 'rescued'); assert.strictEqual(r.guest, false, '아직 손님');
    assert.strictEqual(r.hint, 'hint', '포격으로만 이기면 배에 올라야 한다는 귀띔');
    assert.strictEqual(r.familyTell, 'family'); assert.strictEqual(r.phase2, 'joined'); assert(r.joined && r.mother, '백병전 승리 → 가족(레티치아) 구출 · 나폴레옹 합류');
    assert(r.austria && r.pending, '빈은 오스트리아 — 살롱');
    assert.deepStrictEqual(r.win, { phase: 'done', josephine: true, aff: 40, loyal: 100, pearl: true, days: 3, stoleSaid: true, duelN: 1, after: false }, '진주 목걸이를 훔치다 들킴 → 일기토 승리 → 되찾음 · 나폴레옹 충성 100 · 조제핀 합류');
    assert.deepStrictEqual(r.lose, { phase: 'met', gold: true, josephine: false, again: false, again2: true, final: 'done', jos2: true, duelN: 2 }, '지면 금화 주머니를 돌려받고, 다음에 다시 겨뤄 이기면 합류');
    assert.deepStrictEqual(errors, [], '콘솔 오류 0');
    console.log('통과');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
