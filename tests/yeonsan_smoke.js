/* 연산군과 장녹수, 그리고 흥청망청 (2026-11-03 사용자 요청) — node tests/yeonsan_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 노비의 노래(1501~1503) · ② 흥청의 잔치 — 주문(장신구·견직물 · 기한 · 시세 2.5배 · 악명) · 장녹수의 「그날」 약속 · ③ 채홍사(동래·경주·평양)
   · ④ 반정의 밤(9.28) — 반정군(명예 작위) / 장녹수 구출(정·약속 또는 웅변 → 수구문 → 노비 문서의 재 → 배 / 놓아줌) · 실패하면 은가락지 / 연산군 곁(시)
   · 장녹수는 구하기 전엔 술집에 없다 · 소식 · 옛 저장 · 소문 · 일지 · 말투 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Yeonsan && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, YS = G.Yeonsan, said = [], asked = [], out = {};
      let plan = [], landRes = [], luck = false;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n) => { said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { c = c || 190; s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = YS.pending(); if (p) await YS.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const rank = () => G.Court.rank(G.COURT.realms.KR);
      // ── 갈래 A: 뱃노래 → 주문·약속 → 바친다 → 장녹수를 배에
      let s = fresh(1501, 1, 1); const b = () => G.Game.state.yeonsan;
      out.hidden0 = !!G.MATE.h_jangnoksu.eventOnly;
      out.gate = { early: (at(s, 1500, 12, 31), YS.pending()), song: (at(s, 1502, 3, 1), YS.pending()), feastEarly: (at(s, 1505, 5, 19), YS.pending()), coupNoFeast: (at(s, 1506, 9, 28), YS.pending()) };
      at(s, 1502, 3, 1); await go(['kind']);
      out.A1 = { song: b().song, rope: said.some(x => /밧줄을 당기는 노래/.test(x)), sing: said.some(x => /바다 건너의 노래는 어떤 소리예요/.test(x)) };
      at(s, 1505, 6, 1); await go(['yes', 'yes']);
      out.A2 = { order: b().order, promise: b().promise, poem: said.some(x => /풀잎의 이슬/.test(x)), cheoseon: said.some(x => /김처선/.test(x)), knew: said.some(x => /바다의 노래를 가르쳐 준 사람/.test(x)), smile: said.some(x => /웃지 않으면 죽어요/.test(x)) };
      s.day += 5; at(s, 1505, 6, 6); await go([]); out.A2short = { remind: said.some(x => /흥청의 주문 — 장신구 0\/30/.test(x)), delivered: !!b().delivered };
      out.A2again = YS.pending();
      s.fleet.cargo.jewelry = { q: 32 }; s.fleet.cargo.silk = { q: 30 }; const g0 = s.player.gold, n0 = s.player.notoriety || 0;
      s.day += 1; at(s, 1505, 6, 7); await go([]);
      out.A3 = { delivered: b().delivered, gold: s.player.gold - g0, expect: YS.orderGold(), noto: (s.player.notoriety || 0) - n0, left: s.fleet.cargo.jewelry && s.fleet.cargo.jewelry.q, silk: !s.fleet.cargo.silk, tax: said.some(x => /삼남의 세금/.test(x)) };
      at(s, 1506, 9, 15); await go(['noksu', 'ship'], ['win']);
      out.A4 = { coup: b().coup, date: s.date.m + '.' + s.date.d, noksu: b().noksu, hired: hired('h_jangnoksu'), ash: G.R.hasItem('ys_ash'), y: G.MATE.h_jangnoksu.y[1], came: said.some(x => /정말 오셨네요/.test(x)), cloth: said.some(x => /흥청의 비단을 날라 온 장사치/.test(x)), name: said.some(x => /계집종 녹수/.test(x)) };
      s.loc = { mode: 'sea', lon: 126, lat: 36 }; s.yeonsan.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return YS.daily().map(x => x.text).join(' | '); };
      out.newsA = { palace: day(1502, 10, 15), hc: day(1505, 7, 20), coup: day(1506, 9, 28), mang: day(1507, 3, 1) };
      // ── 갈래 B: 목걸이 → 주문 사양 · 약속 안 함 → 장녹수 구출 실패 → 은가락지
      s = fresh(1502, 1, 1); at(s, 1503, 1, 1); await go(['gift']); const gift = b().song;
      at(s, 1505, 8, 1); await go(['no', 'no']); const cup = said.some(x => /잔을 내던지며/.test(x));
      at(s, 1506, 9, 25); await go(['noksu'], ['lose']);
      out.B = { gift, order: b().order, noksu: b().noksu, ring: G.R.hasItem('ys_ring'), hired: hired('h_jangnoksu'), stones: said.some(x => /돌무더기/.test(x)), cup };
      s.loc = { mode: 'sea', lon: 126, lat: 36 }; s.yeonsan.told = {}; out.newsB = day(1506, 9, 28);
      // ── 갈래 C: 노래를 지나침 · 정 없음 → 설득 실패
      s = fresh(1502, 1, 1); at(s, 1502, 5, 1); await go(['pass']); at(s, 1505, 9, 1); await go(['no', 'no']); luck = false; at(s, 1506, 9, 20); await go(['noksu']);
      out.C = { noksu: b().noksu, refuse: said.some(x => /웃다가 끝날 사람이에요/.test(x)), fights: said.filter(x => /\[육상전\]/.test(x)).length };
      // ── 갈래 D: 반정군 · E: 연산군 곁 · F: 놓아준다
      s = fresh(1505, 6, 1); at(s, 1505, 6, 1); await go(['no', 'no']); const r0 = rank(); at(s, 1506, 9, 28); await go(['rebels'], ['win']);
      out.D = { coup: b().coup, rank: rank() - r0, gate: said.some(x => /돈화문이 열렸다/.test(x)) };
      s = fresh(1505, 6, 1); at(s, 1505, 6, 1); await go(['no', 'no']); at(s, 1506, 9, 20); await go(['king']);
      out.E = { coup: b().coup, poem: G.R.hasItem('ys_poem'), mom: said.some(x => /어머니를 사약으로 잃었다/.test(x)) };
      s.loc = { mode: 'sea', lon: 126, lat: 36 }; s.yeonsan.told = {}; out.newsE = day(1506, 12, 30);
      s = fresh(1505, 6, 1); at(s, 1505, 6, 1); await go(['no', 'yes']); at(s, 1506, 9, 20); await go(['noksu', 'free'], ['win']);
      out.F = { noksu: b().noksu, hired: hired('h_jangnoksu'), visible: !G.MATE.h_jangnoksu.eventOnly };
      // ── 채홍사
      s = fresh(1505, 6, 1); at(s, 1505, 8, 1, 226); await go(['fight'], ['win']);
      out.G1 = { bride: b().bride, hc: said.some(x => /흥청 때문에 나라가 망할 거라고요/.test(x)), again: (at(s, 1505, 9, 1, 227), YS.pending()) };
      s = fresh(1505, 6, 1); const gb = s.player.gold; at(s, 1505, 8, 1, 228); await go(['bribe']); out.G2 = { bride: b().bride, paid: gb - s.player.gold };
      s = fresh(1505, 6, 1); at(s, 1505, 8, 1, 227); await go(['pass']); out.G3 = b().bride;
      // ── 주문 기한
      s = fresh(1505, 6, 1); at(s, 1505, 6, 1); await go(['yes', 'no']); s.day += 130; at(s, 1505, 10, 10); await go([]); out.late = b().order;
      // ── 옛 저장 · 소문 · 일지 · 말투
      s = fresh(1600, 1, 1); delete s.yeonsan; out.oldSave = YS.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'yeonsan');
      out.journal = !!(YS.daily && YS.daily._journal);
      out.voice = !!(G.VOICES && G.VOICES.h_jangnoksu);
      return out;
    });
    console.log(JSON.stringify({ A2: r.A2, A3: r.A3, A4: r.A4, B: r.B, C: r.C }));
    ok(r.hidden0 && !r.gate.early && r.gate.song && !r.gate.feastEarly && !r.gate.coupNoFeast, '장녹수는 처음엔 술집에 없다 · 노래 1501~1503 · 흥청 1505.5.20~ · 반정은 흥청의 잔치를 본 사람만');
    ok(r.A1.song === 'kind' && r.A1.rope && r.A1.sing, '① 노비의 노래 — 뱃노래를 가르친다 · 「노비 문서」');
    ok(r.A2.order === 'yes' && r.A2.promise === 'yes' && r.A2.poem && r.A2.cheoseon && r.A2.knew && r.A2.smile, '② 흥청의 잔치 — 연산군의 시 · 김처선 · 장녹수가 알아본다 · 주문 · 「그날」 약속');
    ok(r.A2short.remind && !r.A2short.delivered && r.A3.delivered === 1 && r.A3.gold === r.A3.expect && r.A3.gold > 15000 && r.A3.noto === 6 && r.A3.left === 2 && r.A3.silk && r.A3.tax, '주문 — 짐이 모자라면 알림만 · 다 실으면 시세 2.5배(삼남의 세금) · 악명 +6 · 짐에서 덜어 낸다');
    ok(r.A4.coup === 'noksu' && r.A4.date === '9.28' && r.A4.noksu === 'ship' && r.A4.hired && r.A4.ash && r.A4.y >= 1540 && r.A4.came && r.A4.cloth && r.A4.name, '④ 반정의 밤(9.28) — 약속대로 장녹수를 수구문으로 · 노비 문서의 재 · 배에 태운다 (흥청의 비단을 날랐다는 박원종의 말)');
    const na = r.newsA;
    ok(/뱃노래 가락/.test(na.palace) && /채홍사/.test(na.hc) && /노비 문서의 재/.test(na.coup) && /흥청망청/.test(na.mang) && /바다 건너에서 온 것이 많았다/.test(na.mang), '소식 — 대궐에 든 노비(뱃노래) · 흥청 · 반정(사라진 숙용) · 흥청망청(바다 건너의 비단)');
    ok(r.B.gift === 'gift' && r.B.order === 'no' && r.B.cup && r.B.noksu === 'lost' && r.B.ring && !r.B.hired && r.B.stones && /은가락지/.test(r.newsB) && /목이 베였다/.test(r.newsB), '정이 있어도 수구문에서 지면 역사대로 — 군기시의 돌무더기 · 던진 은가락지');
    ok(r.C.noksu === 'lost' && r.C.refuse && r.C.fights === 0, '정도 약속도 없으면 — 웅변 설득에 실패하면 장녹수가 따르지 않는다');
    ok(r.D.coup === 'rebels' && r.D.rank === 1 && r.D.gate, '반정군 편 — 돈화문을 연다 · 조선 명예 작위');
    ok(r.E.coup === 'king' && r.E.poem && r.E.mom && /첫 줄만 적힌 종이/.test(r.newsE), '연산군 곁 — 「어머니를 사약으로 잃었다」 · 연산군의 시 · 교동도 소식');
    ok(r.F.noksu === 'free' && !r.F.hired && r.F.visible, '놓아주면 장녹수는 이름 없는 소리꾼으로 — 조선 술집에 나온다');
    ok(r.G1.bride === 'fight' && r.G1.hc && r.G1.again === false && r.G2.bride === 'bribe' && r.G2.paid === 800 && r.G3 === 'pass', '③ 채홍사 — 혼례날의 신부를 배에 숨긴다 / 매수 / 지나친다 (한 번만)');
    ok(r.late === 'late', '주문 기한(120일)이 지나면 끝');
    ok(r.oldSave === 0 && r.rumor && r.journal && r.voice, '옛 저장 · 소문 · 일지 · 장녹수의 말투');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
