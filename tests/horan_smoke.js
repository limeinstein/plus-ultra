/* 정묘호란·병자호란 (2026-11-01 사용자 요청) — node tests/horan_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 정묘년(1627.2.28~4.17) 조선 도시에서 최명길 — 피란 배(사흘) / 용골산성 화약 → 정봉수와 육상전 (4.30까지)
   · 청의 국호 소식은 어디서나 · ③ 병자년 경고(1636.12~1637.1.8)
   · ④ A 남한산성 군량(금화 · 지면 열흘 뒤 다시) · B 강화도 바다(한양에 바닷길로만 · 해전) · C 백마산성 임경업(보급 행렬)
   · ⑤ 강화도를 지키고 둘 이상이면 담판 — 틀린 말 뒤 한 번 더(정묘년에 도왔으면) → 굴욕을 피한다 · 작위 · 최명길·임경업 합류
   · 조건이 모자라면 역사대로(강화 함락·삼전도·볼모) · 담판에서 틀리면 역사대로 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
'use strict';
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
function ok(v, msg) { if (!v) throw new Error(msg); console.log('  ✓ ' + msg); }
(async function () {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXE || undefined, args: ['--use-gl=swiftshader', '--no-sandbox', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => window.__noRaf ? 0 : setTimeout(() => raf(cb), 200); });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|Failed to load|net::|ERR_FILE/.test(m.text())) errors.push('console: ' + m.text()); });
  try {
    await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => window.G && G.Game && G.Horan && G.World && G.Rel, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, HR = G.Horan, said = [], asked = [], out = {}, specs = [];
      let plan = [], landRes = [], seaWin = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async (l) => { said.push('[소식] ' + (l || []).length); };
      G.Scenes.land.landBattle = async (nm, n, b, o) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      G.Rel.greatBattle = async (sp) => { specs.push(sp); if (seaWin) sp.onWin(); else sp.onLose(); return true; };
      const fresh = () => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y: 1627, m: 1, d: 1 }; s.player.born = { y: 1600, m: 1, d: 1 }; delete s.life; delete s.horan; s.player.gold = 20000;
        return s;
      };
      const at = (s, y, m, d, c, via) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat, via: via || 'sea' }; };
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; const p = HR.pending(); if (p) await HR.check(); return p; };
      const land = async (p, choices, res) => { plan = (choices || []).slice(); landRes = (res || []).slice(); said.length = 0; asked.length = 0; const s = G.Game.state; s.loc = { mode: 'land', lon: p[0], lat: p[1], party: 40, base: { type: 'city', city: 190, lon: 126.958, lat: 37.573 } }; return await HR.onLand(p[0], p[1], { battle: (nm, n, o) => G.Scenes.land.landBattle(nm, n, false, o), stop: () => {} }); };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const P = HR.PLACES;
      out.geo = { namhan: G.Geo.isLand(P.namhan[0], P.namhan[1]), baekma: G.Geo.isLand(P.baekma[0], P.baekma[1]), yonggol: G.Geo.isLand(P.yonggol[0], P.yonggol[1]) };
      // ── ① 정묘년
      let s = fresh();
      out.gate = { nagasaki: (at(s, 1627, 3, 1, 191), HR.pending()), early: (at(s, 1627, 2, 20, 190), HR.pending()), late: (at(s, 1627, 4, 20, 190), HR.pending()), ok: (at(s, 1627, 3, 1, 228), HR.pending()) };
      at(s, 1627, 3, 1, 190); await go(['yonggol']);
      out.c1 = { v: s.horan.c1, line: said.some(x => /강화도로 모시기로/.test(x)) };
      out.yonggolLate = (s.date = { y: 1627, m: 5, d: 2 }, await land(P.yonggol, [], []));
      s.date = { y: 1627, m: 4, d: 10 };
      out.yonggol = { r: await land(P.yonggol, [], ['win']), v: s.horan.yonggol, jbs: said.some(x => /정봉수요/.test(x)) };
      s.date = { y: 1627, m: 4, d: 18 }; out.brother = HR.daily().map(x => x.text).join(' | ');
      // ── 청의 국호: 유럽에서도
      s.loc = { mode: 'sea', lon: -10, lat: 40 }; s.date = { y: 1636, m: 5, d: 15 }; out.qing = HR.daily().map(x => x.text).join(' | ');
      // ── ③ 경고
      at(s, 1636, 12, 20, 228); await go([]);
      out.warn = { v: s.horan.warn, known: said.some(x => /정묘년에 우리를 도왔던/.test(x)), three: said.some(x => /세 가지를 부탁하오/.test(x)) };
      // ── ④ A 남한산성 군량 — 지면 열흘 뒤
      s.date = { y: 1637, m: 1, d: 15 }; let g0 = s.player.gold;
      out.food1 = { r: await land(P.namhan, ['go'], ['lose']), v: s.horan.food };
      out.foodCool = await land(P.namhan, ['go'], ['win']);
      s.day += 11;
      out.food2 = { r: await land(P.namhan, ['go'], ['win']), v: s.horan.food, gold: g0 - s.player.gold, king: said.some(x => /과인의 군사를 먹이는구나/.test(x)) };
      out.talkEarly = await land(P.namhan, [], []);
      // ── C 백마산성
      s.date = { y: 1637, m: 1, d: 25 };
      out.baekma = { r: await land(P.baekma, ['go'], ['win']), v: s.horan.baekma, im: said.some(x => /임경업이오/.test(x)) };
      // ── B 강화도 (바닷길로만)
      at(s, 1637, 2, 1, 190, 'land'); out.ganghwaLand = HR.pending();
      at(s, 1637, 2, 1, 190, 'sea'); await go([]);
      out.ganghwa = { spec: specs[0] && specs[0].id, back: specs[0] && specs[0].backCity, label: specs[0] && specs[0].fightLabel, v: s.horan.ganghwa, drunk: said.some(x => /하늘이 낸 요새/.test(x)), score: HR.score() };
      // ── ⑤ 담판 — 틀린 말 한 번 뒤 바른 말 · 최명길·임경업
      const kr = G.COURT.realms.KR, rk0 = G.Court.rank(kr);
      s.date = { y: 1637, m: 2, d: 12 };
      out.talk = { r: await land(P.namhan, ['ming', 'ice', 'yes', 'yes'], []), end: s.horan.end, tries: s.horan.tries, torn: said.some(x => /국서를 집어 들어 찢으며/.test(x)), pox: said.some(x => /짐도 마마가 두렵다/.test(x)), rank: G.Court.rank(kr) - rk0, choi: hired('h_choemyeonggil'), im: hired('h_imgyeongeop') };
      s.date = { y: 1637, m: 2, d: 16 }; out.newsHeld = HR.daily().map(x => x.text).join(' | ');
      s.date = { y: 1637, m: 2, d: 24 }; out.newsWon = HR.daily().map(x => x.text).join(' | ');
      s.date = { y: 1637, m: 3, d: 5 }; out.newsNoHostage = HR.daily().length;
      // ── 역사대로: 강화도를 잃으면 담판이 없다
      s = fresh(); seaWin = false;
      s.date = { y: 1637, m: 1, d: 15 }; await land(P.namhan, ['go'], ['win']);
      s.date = { y: 1637, m: 1, d: 20 }; await land(P.baekma, ['go'], ['win']);
      at(s, 1637, 2, 5, 190, 'sea'); await go([]);
      s.date = { y: 1637, m: 2, d: 12 };
      out.hist = { g: s.horan.ganghwa, score: HR.score(), can: HR.canTalk(), talk: await land(P.namhan, [], []) };
      s.loc = { mode: 'sea', lon: 126, lat: 37 };
      s.date = { y: 1637, m: 2, d: 16 }; out.histFall = HR.daily().map(x => x.text).join(' | ');
      s.date = { y: 1637, m: 2, d: 24 }; out.histSam = HR.daily().map(x => x.text).join(' | ');
      s.date = { y: 1637, m: 3, d: 4 }; out.histHostage = HR.daily().map(x => x.text).join(' | ');
      // ── 담판에서 틀리면 (두 번째 기회 없음) 역사대로
      s = fresh(); seaWin = true;
      s.date = { y: 1637, m: 1, d: 15 }; await land(P.namhan, ['go'], ['win']);
      at(s, 1637, 2, 5, 190, 'sea'); await go([]);
      s.date = { y: 1637, m: 2, d: 13 }; await land(P.namhan, ['gold'], []);
      out.fail = { end: s.horan.end, tries: s.horan.tries, gold: said.some(x => /금은이라/.test(x)), choi: hired('h_choemyeonggil') };
      // ── 피란 배 (사흘)
      s = fresh(); at(s, 1627, 3, 2, 229); const d0 = s.day; await go(['ferry']);
      out.ferry = { v: s.horan.ferry, days: s.day - d0, boat: said.some(x => /갑곶 나루를 오갔다/.test(x)) };
      // ── 옛 저장
      s = fresh(); s.date = { y: 1700, m: 1, d: 1 }; delete s.horan; out.oldSave = HR.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'horan');
      out.journal = !!(HR.daily && HR.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ geo: r.geo, gate: r.gate, food2: r.food2, ganghwa: r.ganghwa, talk: r.talk, hist: r.hist, fail: r.fail, ferry: r.ferry }));
    ok(r.geo.namhan && r.geo.baekma && r.geo.yonggol, '남한산성·백마산성·용골산성 자리는 뭍이다');
    const g = r.gate;
    ok(!g.nagasaki && !g.early && !g.late && g.ok, '① 정묘년 — 1627.2.28~4.17 조선 도시에서만');
    ok(r.c1.v === 'yonggol' && r.c1.line && r.yonggolLate === false && r.yonggol.r && r.yonggol.v === 'win' && r.yonggol.jbs, '② 용골산성 — 4월이 가기 전 정봉수와 함께 후금 기병을 막는다');
    ok(/형제의 맹약/.test(r.brother) && /정봉수/.test(r.brother) && /대청/.test(r.qing), '소식 — 형제의 맹약(용골산성 이야기) · 청의 국호는 유럽에서도');
    ok(r.warn.v === 1 && r.warn.known && r.warn.three, '③ 병자년 경고 — 정묘년에 도운 선장을 알아본다 · 세 가지 부탁');
    ok(r.food1.r && r.food1.v === 'fail' && r.foodCool === false && r.food2.v === 'in' && r.food2.gold === 4000 && r.food2.king && r.talkEarly === false, 'A 남한산성 군량 — 지면 열흘 뒤 다시 · 쌀값 두 번 · 담판은 2.10부터');
    ok(r.baekma.v === 'cut' && r.baekma.im, 'C 백마산성 — 임경업과 청군 보급 행렬을 끊는다');
    ok(r.ganghwaLand === false && r.ganghwa.spec === 'horan_ganghwa' && r.ganghwa.back === 190 && r.ganghwa.label === '봉림대군과 함께 나루를 막는다' && r.ganghwa.v === 'held' && r.ganghwa.drunk && r.ganghwa.score === 3, 'B 강화도 — 한양에 바닷길로 들어설 때만 해전 · 김경징 · 지켰다');
    const t = r.talk;
    ok(t.r && t.end === 'avoided' && t.tries === 2 && t.torn && t.pox && t.rank === 1 && t.choi && t.im, '⑤ 담판 — 국서를 찢는 김상헌 · 틀린 말 뒤 한 번 더 · 「짐도 마마가 두렵다」 → 굴욕을 피한다 · 작위 · 최명길·임경업 합류');
    ok(/버틴다/.test(r.newsHeld) && /성문을 나서지 않았다/.test(r.newsWon) && r.newsNoHostage === 0, '소식 — 강화도가 버틴다 · 임금은 성문을 나서지 않았다 · 볼모 소식 없음');
    ok(r.hist.g === 'lost' && r.hist.score === 2 && !r.hist.can && r.hist.talk === false && /김경징/.test(r.histFall) && /아홉 번 머리를/.test(r.histSam) && /소현세자/.test(r.histHostage), '강화도를 잃으면 둘을 해내도 담판이 없다 — 강화 함락·삼전도·볼모 (역사대로)');
    ok(r.fail.end === 'history' && r.fail.tries === 1 && r.fail.gold && !r.fail.choi, '담판에서 틀리고 두 번째 기회가 없으면 역사대로');
    ok(r.ferry.v === 1 && r.ferry.days === 3 && r.ferry.boat, '① 피란 배 — 사흘이 지나간다');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    await page.reload();
    await page.waitForFunction(() => window.G && G.Game && G.Horan && G.World && G.Rel, null, { timeout: 120000 });
    const q = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, out = {};
      UI.say = async () => {}; UI.alert = async () => {}; UI.toast = () => {}; UI.ask = async (t, opts) => opts[0].value;
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
      const s = G.Game.state; s.date = { y: 1637, m: 2, d: 1 }; s.player.born = { y: 1600, m: 1, d: 1 }; delete s.life; s.horan = { told: {}, warn: 1 };
      s.loc = { mode: 'city', city: 190, lon: G.CITY_DATA[190].lon, lat: G.CITY_DATA[190].lat, via: 'sea' };
      G.Game.go('city', { cityId: 190, via: 'sea' });
      const wait = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await new Promise(r => setTimeout(r, 200)); } return false; };
      out.inBattle = await wait(() => G.Game.sceneName === 'battle' && G.Scenes.battle.runtime(), 60000);
      const bs = G.Scenes.battle.runtime();
      out.allies = bs ? bs.ships.filter(b => b.ally).length : -1; out.foes = bs ? bs.ships.filter(b => b.side === 'en').length : -1;
      await G.Scenes.battle._t().finish('win');
      out.back = await wait(() => G.Game.sceneName === 'city' && s.loc.city === 190 && !G.Horan._busy, 60000);
      out.held = s.horan.ganghwa;
      return out;
    });
    console.log(JSON.stringify(q));
    ok(q.inBattle && q.allies === 2 && q.foes === 6 && q.back && q.held === 'held', '진짜 해전 장면 — 강화도 앞바다: 판옥선·맹선이 우리 편 · 청군 배 6척 · 이기면 한양으로 · 강화도가 버틴다');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
