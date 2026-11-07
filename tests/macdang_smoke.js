/* 막 왕조의 성립 (2026-11-07 사용자 요청) — node tests/macdang_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 꼬짜이에서 온 씨름꾼(1522.8.2~1527.6.14 교도) — 씨름(힘으로 이기고 짐 · 어느 쪽이든 벗) · 인국공의 총 주문 · 태후의 약 · ①' 총을 바친다(그물추)
   · ② 여섯째 달 보름(1527.6.15~7.21 교도) — 왕손을 배로(끼엔이 벗이면 싸우지 않는다 · 아니면 부두의 금위와 육상전) → 사흘 뒤 마 강 어귀 · 빗 · 후옌 / 막의 즉위 잔치(7.22) / 떠난다
   · ③ 깃발이 오르다(1533~1535 유에 — 후옌이 남았으면) · ④ 진남관의 밧줄(교도 — 1528~ / 1540.12.10~1542)
   · 둘 다 eventOnly · 후옌 여자 어른(연애 됨) · 끼엔 wed 'sea' · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.MacDang && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, MD = G.MacDang, said = [], asked = [], out = {};
      let plan = [], landRes = [];
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => false;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d, str) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: str || 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; s.fleet.food = 200; if (str) s.player.st.str = str; MD.state(); return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = MD.pending(); if (p) await MD.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const has = (id) => G.R.hasItem(id);
      const b = () => MD.state();
      const sea = (s, y, m, d) => { s.loc = { mode: 'sea', lon: 107, lat: 19 }; s.date = { y, m, d }; };
      const ids = ['md_huyen', 'md_kien'];
      const H = G.MATE.md_huyen, Kd = G.MATE.md_kien;
      out.mates = { huyen: !!H && H.eventOnly && !H.wed && H.g === 'f' && !H.minor && H.wage === 0 && !!H.face && !!H.desc, kien: !!Kd && Kd.eventOnly && Kd.wed === 'sea' && Kd.g === 'm' && Kd.wage === 0 && !!Kd.face,
        pool: (G.MATES || []).filter(m => ids.includes(m.id)).length, tavern: G.Frontier && G.Frontier.mateReady ? ids.map(id => G.Frontier.mateReady(G.MATE[id], 1530)) : null };
      // ── 문
      let s = fresh(1522, 1, 1);
      out.gate = { early: (at(s, 1522, 8, 1, 165), MD.pending()), on: (at(s, 1522, 8, 2, 165), MD.pending()), hue: (at(s, 1524, 1, 1, 164), MD.pending()), late: (b().night = 'x', at(s, 1527, 6, 15, 165), MD.pending()) };
      delete b().night; b().met = 1; b().huyen = 'met';
      Object.assign(out.gate, { nightOn: (at(s, 1527, 6, 15, 165), MD.pending()), nightOff: (at(s, 1527, 7, 22, 165), MD.pending()), nightHue: (at(s, 1527, 7, 1, 164), MD.pending()) });
      // ── ① 씨름에 이긴다 · 주문 · 약
      s = fresh(1523, 3, 1, 70); at(s, 1523, 3, 1, 165); let g0 = s.player.gold;
      await go(['yes', 'take', 'med']);
      out.M1 = { met: b().met, wrestle: b().wrestle, kien: b().kien, order: b().order, due: b().dueDay - s.day, huyen: b().huyen, paid: g0 - s.player.gold, pigeon: said.some(x => /오늘부터 형님이라/.test(x)), mac: said.some(x => /고기를 잡던 손/.test(x)), med: said.some(x => /이렇게 해 준 건 처음/.test(x)), again: (at(s, 1523, 3, 2, 165), MD.pending()) };
      // ①' 총이 없으면 열리지 않는다 · 총을 싣고 오면 바친다
      out.M1.noGuns = MD.pending();
      const o = G.BALANCE.macdang.order; s.fleet.cargo[o.good] = { q: o.n + 3 }; g0 = s.player.gold;
      at(s, 1523, 9, 1, 165); await go([]);
      out.D1 = { order: b().order, gold: s.player.gold - g0, expect: MD.orderGold(), left: s.fleet.cargo[o.good] && s.fleet.cargo[o.good].q, sinker: has('md_sinker'), kien: b().kien, guard: said.some(x => /나도 이제 금위요|이제 금위가 됐소/.test(x)), again: (at(s, 1523, 9, 2, 165), MD.pending()) };
      // ── ① 씨름에 진다 · 사양 · 이야기만 · 기한이 지나면 끝
      s = fresh(1524, 1, 1, 40); at(s, 1524, 1, 10, 165); await go(['yes', 'no', 'talk']);
      out.M2 = { wrestle: b().wrestle, kien: b().kien, order: b().order, huyen: b().huyen, lose: said.some(x => /버틴 시간이 제일 길었소/.test(x)) };
      s = fresh(1524, 1, 1); b().met = 1; b().order = 'take'; b().dueDay = s.day - 1; sea(s, 1524, 2, 1); const lateMsg = MD.daily().map(x => x.text).join(' ');
      out.lateOrder = { order: b().order, msg: /기한이 지났다/.test(lateMsg) };
      // ── ② 끼엔이 벗 — 싸우지 않고 빠져나가 함께 간다 · 후옌도 함께
      s = fresh(1527, 6, 1); b().met = 1; b().kien = 'friend'; b().huyen = 'friend'; at(s, 1527, 6, 20, 165);
      await go(['ship', 'join', 'join']);
      out.N1 = { night: b().night, esc: b().esc, kien: b().kien, huyen: b().huyen, hiredK: hired('md_kien'), hiredH: hired('md_huyen'), comb: has('md_comb'), date: s.date.m + '.' + s.date.d, fight: said.some(x => /\[육상전\]/.test(x)), saw: said.some(x => /아무것도 못 봤소/.test(x)), kim: said.some(x => /신 응우옌 낌이옵니다/.test(x)), ninh: said.some(x => /배 이름을 부르겠소/.test(x)), knows: said.some(x => /약은 잘 들었어요/.test(x)), again: (at(s, 1527, 7, 1, 165), MD.pending()) };
      sea(s, 1533, 2, 5); const nw = MD.daily().map(x => x.text).join(' | ');
      out.newsWon = { throne: /명덕/.test(nw), cung: /염주/.test(nw), lady: /여관 하나가 그 전에/.test(nw), trang: /장종이다/.test(nw), pig: /돼지 임금/.test(nw) };
      // ── ② 끼엔을 만나기만 함 — 금위와 싸워 이긴다 · 후옌은 남는다 → ③ 1533 유에에서 동료
      s = fresh(1527, 6, 1); b().met = 1; b().kien = 'met'; b().huyen = 'met'; at(s, 1527, 7, 1, 165);
      await go(['ship', 'stay'], ['win']);
      out.N2 = { esc: b().esc, kien: b().kien, huyen: b().huyen, hiredH: hired('md_huyen'), comb: has('md_comb'), fight: said.some(x => /\[육상전\] 홍강 부두의 금위 16/.test(x)), sorry: said.some(x => /이건 내 일이오/.test(x)), flagEarly: (at(s, 1533, 2, 3, 164), MD.pending()) };
      at(s, 1533, 6, 1, 164); await go(['join']);
      out.F1 = { huyen: b().huyen, hired: hired('md_huyen'), king: said.some(x => /장종이세요/.test(x)), again: (at(s, 1533, 6, 2, 164), MD.pending()) };
      // ④ 1540.12 진남관 — 끼엔(만나기만 했던) → 동료 · 밧줄
      out.K0 = { early: (at(s, 1540, 12, 9, 165), MD.pending()) };
      at(s, 1541, 3, 1, 165); await go(['join']);
      out.K1 = { kien: b().kien, hired: hired('md_kien'), rope: has('md_rope'), noSell: !!G.ITEM.md_rope.noSell, pass: said.some(x => /목에 밧줄을 걸고 맨발로/.test(x)), sea: said.some(x => /바다와 혼인할 거니까/.test(x)) };
      // ── ② 부두에서 진다 — 후옌과 왕손은 고깃배로 사라진다
      s = fresh(1527, 6, 1); at(s, 1527, 6, 16, 165); await go(['ship'], ['lose']);
      out.N3 = { esc: b().esc, huyen: b().huyen, hired: hired('md_huyen'), comb: has('md_comb'), stranger: said.some(x => /막의 깃발을 달지 않은 배는/.test(x)), boat: said.some(x => /고깃배 하나가 노를/.test(x)), flag: (at(s, 1534, 1, 1, 164), MD.pending()) };
      // ── ② 끼엔이 벗 — 돌아가라 → ④ 1528년부터 그물 깁는 끼엔 (밧줄 없음)
      s = fresh(1527, 6, 1); b().met = 1; b().kien = 'friend'; at(s, 1527, 6, 16, 165); await go(['ship', 'stay', 'stay']);
      out.N5 = { kien: b().kien, huyen: b().huyen, early: (at(s, 1527, 12, 31, 165), MD.pending()) };
      at(s, 1529, 4, 1, 165); await go(['join']);
      out.K2 = { kien: b().kien, hired: hired('md_kien'), rope: has('md_rope'), net: said.some(x => /곤장 백 대/.test(x)) };
      // ── ② 막의 즉위 잔치 (총을 바쳤으면 +1000)
      s = fresh(1527, 6, 1); b().met = 1; b().order = 'done'; b().kien = 'friend'; at(s, 1527, 6, 20, 165); g0 = s.player.gold;
      await go(['mac']);
      out.N4 = { night: b().night, huyen: b().huyen, date: s.date.m + '.' + s.date.d, gold: said.some(x => /하사금 금화 \+3,000/.test(x)), sinker: has('md_sinker'), throne: said.some(x => /명덕/.test(x)), kitchen: said.some(x => /부엌에서 아이 하나가 사라졌다/.test(x)), kien: said.some(x => /웃지 않는다/.test(x)) };
      // ── ② 떠난다
      s = fresh(1527, 6, 1); at(s, 1527, 6, 20, 165); await go(['no']);
      out.N6 = { night: b().night, huyen: b().huyen, esc: b().esc || null };
      // ── 소식 · 옛 저장
      s = fresh(1516, 1, 1); sea(s, 1541, 10, 1); out.newsAll = MD.daily().map(x => x.text);
      s = fresh(1530, 6, 1); delete s.macDang; out.oldSave = { n: MD.daily().length, told: Object.keys(G.Game.state.macDang.told).length };
      // ── 소문 · 일지 · 말투
      const rum = (G.EVENT_RUMORS || []).find(x => x.id === 'macdang');
      s = fresh(1524, 1, 1); const r1 = rum ? rum.text(s) : []; s.date = { y: 1541, m: 1, d: 1 }; const r2 = rum ? rum.text(s) : [];
      out.rumor = { has: !!rum, wrestle: r1.some(x => /씨름꾼/.test(x.y) && x.o), two: r1.some(x => /임금이 둘/.test(x.y)), rope: r2.some(x => /밧줄/.test(x.y)) };
      out.journal = !!(MD.daily && MD.daily._journal);
      const VH = G.VOICES.md_huyen, VK = G.VOICES.md_kien;
      out.love = !!(VH && VH.love && VH.love.a50.length >= 3 && VH.love.a80.length >= 3 && VK && !VK.love && !VK.wife);
      out.voice = [VH, VK].map(v => !!v && v.stories.length >= 4 && v.stories.length <= 6 && v.stories.every(st => st.l.length >= 3 && st.l.length <= 6));
      out.voiceLen = [VH, VK].every(v => { const L = [].concat(v.greet.hi, v.greet.mid, v.greet.low, v.chat.hi, v.chat.mid, v.chat.low, v.again, v.drink, [v.drinkDone], v.lifeIntro, v.love ? v.love.a50.concat(v.love.a80) : []); return L.every(x => x.length <= 140); });
      s = fresh(1530, 1, 1); s.mates.push({ id: 'md_kien', role: 'none', loyal: 90 }); const m = s.mates[s.mates.length - 1];
      out.greet = !!(G.Voice && G.Voice.greet(G.MATE.md_kien, m));
      return out;
    });
    console.log(JSON.stringify({ gate: r.gate, M1: r.M1, D1: r.D1, N1: r.N1, N2: r.N2, F1: r.F1, K1: r.K1, N3: r.N3, N4: r.N4, oldSave: r.oldSave }));
    ok(r.mates.huyen && r.mates.kien && r.mates.pool === 2 && (!r.mates.tavern || r.mates.tavern.every(x => !x)), '동료 둘 — 사건으로만(술집에 안 나옴) · 후옌은 여자 어른(연애 됨) · 끼엔은 바다와 혼인(wed sea) · 월급 0 · 얼굴 경로');
    const g = r.gate;
    ok(!g.early && g.on && !g.hue && !g.late && g.nightOn && !g.nightOff && !g.nightHue, '문 — 씨름판 1522.8.2부터 교도 · 여섯째 달 보름 1527.6.15~7.21 교도만');
    ok(r.M1.met && r.M1.wrestle === 'win' && r.M1.kien === 'friend' && r.M1.order === 'take' && r.M1.due === 240 && r.M1.huyen === 'friend' && r.M1.paid === 200 && r.M1.pigeon && r.M1.mac && r.M1.med && r.M1.again === false && r.M1.noGuns === false, '① 씨름판 — 힘으로 이기면 「형님」 · 인국공의 총 주문(240일) · 태후의 약(200) · 총이 없으면 바치지 못한다');
    ok(r.D1.order === 'done' && r.D1.gold === r.D1.expect && r.D1.left === 3 && r.D1.sinker && r.D1.kien === 'friend' && r.D1.guard && r.D1.again === false, "①' 총을 바친다 — 시세의 2배 · 그물추 · 금위가 된 끼엔");
    ok(r.M2.wrestle === 'lose' && r.M2.kien === 'friend' && r.M2.order === 'no' && r.M2.huyen === 'met' && r.M2.lose && r.lateOrder.order === 'late' && r.lateOrder.msg, '① 져도 벗 · 주문을 사양 · 이야기만 · 기한이 지나면 끝');
    ok(r.N1.night === 'ship' && r.N1.esc === 'pass' && r.N1.kien === 'joined' && r.N1.hiredK && r.N1.huyen === 'joined' && r.N1.hiredH && r.N1.comb && r.N1.date === '6.23' && !r.N1.fight && r.N1.saw && r.N1.kim && r.N1.ninh && r.N1.knows && r.N1.again === false, '② 왕손을 배로 — 벗 끼엔이 길을 연다(싸우지 않음) → 끼엔·후옌 동료 · 사흘 뒤 마 강 어귀의 응우옌 낌 · 대모 빗');
    ok(r.newsWon.throne && r.newsWon.cung && r.newsWon.lady && r.newsWon.trang && !r.newsWon.pig, '소식 — 막당중 즉위(명덕) · 공황과 태후 · 「여관 하나가 그 전에」 · 장종(1533)');
    ok(r.N2.esc === 'won' && r.N2.kien === 'met' && r.N2.huyen === 'stay' && !r.N2.hiredH && r.N2.comb && r.N2.fight && r.N2.sorry && r.N2.flagEarly === false && r.F1.huyen === 'joined' && r.F1.hired && r.F1.king && r.F1.again === false, '② 부두의 금위 16과 싸워 이긴다 · 후옌은 왕손 곁에 → ③ 1533 유에의 부두에서 동료');
    ok(r.K0.early === false && r.K1.kien === 'joined' && r.K1.hired && r.K1.rope && r.K1.noSell && r.K1.pass && r.K1.sea, '④ 진남관의 밧줄 (1540.12.10부터) — 끼엔 동료 · 밧줄 한 토막(팔 수 없음)');
    ok(r.N3.esc === 'lost' && r.N3.huyen === 'lost' && !r.N3.hired && !r.N3.comb && r.N3.stranger && r.N3.boat && r.N3.flag === false, '② 부두에서 지면 후옌과 왕손은 고깃배로 사라진다 · 처음 보는 사이에도 열린다');
    ok(r.N5.kien === 'stay' && r.N5.early === false && r.K2.kien === 'joined' && r.K2.hired && !r.K2.rope && r.K2.net, '② 「돌아가라」 → 곤장 맞고 쫓겨난 끼엔이 1528년부터 교도 부두에 (밧줄 없음)');
    ok(r.N4.night === 'mac' && r.N4.huyen === 'gone' && r.N4.date === '7.22' && r.N4.gold && r.N4.sinker && r.N4.throne && r.N4.kitchen && r.N4.kien && r.N6.night === 'no' && r.N6.huyen === 'gone', '② 막의 즉위 잔치 — 7.22까지 · 하사금(총을 바쳤으면 +1000) · 그물추 · 웃지 않는 끼엔 · 떠난다');
    const na = r.newsAll.join(' | ');
    ok(r.newsAll.length === 9 && /돼지 임금/.test(na) && /두 개|둘이다/.test(na) && /진남관/.test(na) && /안남 도통사/.test(na) && /꼬짜이에서 숨을/.test(na) && r.oldSave.n === 0 && r.oldSave.told === 6, '소식 — 돼지 임금·소종·막당중·공황·막당영·장종·진남관·막당중의 죽음 · 옛 저장은 지난 소식을 띄우지 않는다');
    ok(r.rumor.has && r.rumor.wrestle && r.rumor.two && r.rumor.rope && r.journal, '소문(씨름꾼·두 임금·진남관) · 일지');
    ok(r.love && r.voice.every(Boolean) && r.voiceLen && r.greet, '말투 — 둘 다 옛이야기 · 후옌만 연애 말 · 한 줄 140자 이하 · 첫마디');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
