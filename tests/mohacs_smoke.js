/* 모하치 전투(1526) (2026-11-02 사용자 요청) — node tests/mohacs_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 부다의 궁정 — 왕에게 금화를 빌려주면 적이 준다 · 모하치 8.29 · 첼레 개울 · 도나우 강으로 왕비와 국고를 포조니로 → 헝가리 명예 작위 · 코르비누스 필사본 · 빌린 돈 절반
   · 「성벽 뒤에서 기다리자」 — 귀족들이 들고일어난다 · 사양 갈래 · ② 오스만 편 — 드라바 강의 부교 → 모하치 → 오스만 명예 작위 · 책
   · ③ 두 왕 — 부다의 서포여이 / 비엔나의 페르디난트(구한 왕비가 거든다) · 소식(전투 소식은 relevents.js 그대로) · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Mohacs && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, said = [], asked = [], fights = [], out = {};
      let plan = [], landRes = [], luck = true;
      UI.say = async (t, o) => { said.push((o && o.name ? o.name + ': ' : '') + String(t)); };
      UI.alert = async (t) => { said.push('[창] ' + String(t)); };
      UI.toast = (t) => { said.push('[알림] ' + String(t)); };
      UI.fade = async (fn) => { if (fn) await fn(); };
      UI.ask = async (t, opts) => { asked.push({ t, opts: opts.map(o => o.value) }); return plan.length ? plan.shift() : opts[0].value; };
      if (G.FamEv) G.FamEv.showPic = () => ({ stop: () => Promise.resolve() });
      G.Scenes.city.news = async () => {};
      G.U.chance = () => luck;
      G.Scenes.land.landBattle = async (nm, n, b, o) => { fights.push(nm + ' ' + n); said.push('[육상전] ' + nm + ' ' + n); return landRes.length ? landRes.shift() : 'win'; };
      const fresh = (y, m, d) => {
        G.State.newGame({ name: '시험', nation: 'PT', job: 'explorer', age: 30, birth: { m: 1, d: 1 }, st: { str: 60, int: 60, mar: 60, cha: 60 }, sk: {}, lg: [], diff: 'normal' });
        const s = G.Game.state; s.date = { y, m, d }; s.player.born = { y: y - 30, m: 1, d: 1 }; delete s.life; s.player.gold = 30000; return s;
      };
      const at = (s, y, m, d, c) => { s.date = { y, m, d }; s.loc = { mode: 'city', city: c, lon: G.CITY_DATA[c].lon, lat: G.CITY_DATA[c].lat }; };
      const MH = G.Mohacs;
      const go = async (choices) => { plan = choices.slice(); said.length = 0; asked.length = 0; fights.length = 0; const p = MH.pending(); if (p) await MH.check(); return p; };
      const rank = (rid) => G.Court.rank(G.COURT.realms[rid]);
      let s = fresh(1526, 5, 1);
      out.gate = { early: (at(s, 1526, 5, 30, 63), MH.pending()), late: (at(s, 1526, 8, 21, 63), MH.pending()), open: (at(s, 1526, 6, 1, 63), MH.pending()), belgrade: (at(s, 1526, 7, 1, 69), MH.pending()), bLate: (at(s, 1526, 8, 11, 69), MH.pending()) };
      // ── ① 빌려주고 함께 간다 → 강배로 왕비를 빼낸다
      const hu0 = rank('HU'); let g0 = s.player.gold; at(s, 1526, 7, 1, 63); await go(['loan', 'go', 'river']);
      out.court = { side: s.mohacs.side, loan: s.mohacs.loan, date: s.date.m + '.' + s.date.d, fight: fights[0], mary: s.mohacs.mary, rank: rank('HU') - hu0, book: G.R.hasItem('mh_corvina'), gold: g0 - s.player.gold, csele: said.some(x => /물에 빠지셨어요/.test(x)), tomori: said.some(x => /프란치스코회 수도사/.test(x)), crown: s.mohacs.title };
      // ── 기다리자 → 귀족 · 사양
      s = fresh(1526, 6, 1); at(s, 1526, 6, 5, 63); await go(['wait', 'no']);
      out.wait = { nobles: said.some(x => /헝가리 귀족은 들판에서 싸운다/.test(x)), side: s.mohacs.side, court: s.mohacs.court, fights: fights.length };
      // ── ② 오스만 편: 부교 → 모하치
      s = fresh(1526, 7, 1); const ot0 = rank('OT'); g0 = s.player.gold; at(s, 1526, 7, 5, 69); await go(['boats', 'go']);
      out.ot = { side: s.mohacs.side, bridge: s.mohacs.bridge, date: s.date.m + '.' + s.date.d, fight: fights[0], rank: rank('OT') - ot0, book: G.R.hasItem('mh_corvina'), gold: s.player.gold - g0, burn: said.some(x => /다리를 불태우라/.test(x)), suleyman: said.some(x => /이렇게 끝나기를 바라지는 않았다/.test(x)) };
      // ── ③ 두 왕: 부다에서 서포여이 (위 오스만 편 그대로)
      g0 = s.player.gold; at(s, 1526, 11, 20, 63); await go(['yes']);
      out.zap = { king: s.mohacs.king, gold: g0 - s.player.gold, envoy: said.some(x => /독일 사람의 왕은 안 되오/.test(x)) };
      // ── ③ 비엔나의 페르디난트 — 구한 왕비가 거든다
      s = fresh(1526, 7, 1); at(s, 1526, 7, 1, 63); await go(['go', 'go', 'river']); at(s, 1527, 1, 10, 54); await go(['yes']);
      out.fer = { king: s.mohacs.king, mary: said.some(x => /다시 만났네요/.test(x)) };
      // ── 만난 적 없으면 두 왕 장면은 없다
      s = fresh(1526, 11, 20); at(s, 1526, 11, 20, 54); out.noKing = MH.pending();
      // ── 소식
      s = fresh(1526, 1, 1); s.mohacs = { told: {}, side: 'hu', mary: 'saved', king: 'zapolya' }; s.loc = { mode: 'sea', lon: 15, lat: 44 };
      const day = (y, m, d) => { s.date = { y, m, d }; return MH.daily().map(x => x.text).join(' | '); };
      out.news = { buda: day(1526, 9, 10), body: day(1526, 10, 18), zap: day(1526, 11, 10), fer: day(1526, 12, 17), tokaj: day(1527, 9, 27) };
      out.rel = !!(G.REL_EVENTS || []).find(e => e.id === 'cr_mohacs');
      s = fresh(1600, 1, 1); delete s.mohacs; out.oldSave = MH.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'mohacs');
      out.journal = !!(MH.daily && MH.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ court: r.court, ot: r.ot, wait: r.wait }));
    const g = r.gate;
    ok(!g.early && !g.late && g.open && g.belgrade && !g.bLate, '부다 1526.6.1~8.20 · 베오그라드 7.1~8.10');
    const c = r.court;
    ok(c.side === 'hu' && c.loan === 1 && c.date === '8.29' && /예니체리와 포병 77/.test(c.fight) && c.tomori && c.csele, '① 왕에게 금화를 빌려주면 적이 준다(90→77) · 모하치 8.29 · 토모리 · 첼레 개울');
    ok(c.mary === 'saved' && c.rank === 1 && c.book && c.gold >= 1500 && c.gold <= 1800 && c.crown, '도나우 강배로 왕비와 국고를 포조니로 → 헝가리 명예 작위 · 코르비누스 필사본 · 빌린 돈의 절반을 돌려받는다 (가는 동안의 품삯은 빠진다)');
    ok(r.wait.nobles && r.wait.side === 'none' && r.wait.court === 'wait' && r.wait.fights === 0, '「성벽 뒤에서 기다리자」 — 귀족들이 들고일어난다 · 사양하면 싸움 없음');
    const o = r.ot;
    ok(o.side === 'ot' && o.bridge === 'boats' && o.date === '8.29' && /헝가리 중기병/.test(o.fight) && o.rank === 1 && o.book && o.gold >= 2200 && o.gold <= 2500 && o.burn && o.suleyman, '② 오스만 편 — 드라바 강 부교(2,500) · 다리를 불태운다 · 모하치 · 술탄의 탄식 · 오스만 명예 작위 · 책');
    ok(r.zap.king === 'zapolya' && r.zap.gold === 2000 && r.zap.envoy && r.fer.king === 'ferdinand' && r.fer.mary && r.noKing === false, '③ 두 왕의 헝가리 — 부다의 서포여이 · 비엔나의 페르디난트(구한 왕비가 거든다) · 만난 적 없으면 없음');
    const n = r.news;
    ok(/코르비누스 문고/.test(n.buda) && /이방인 선장의 배/.test(n.buda) && /첼레 개울/.test(n.body) && /바다의 선장 자리/.test(n.zap) && /왕이 둘이다/.test(n.fer) && /오라비를 위해/.test(n.fer) && /다음은 빈이다/.test(n.tokaj) && r.rel, '소식 — 부다 입성 · 왕의 주검 · 서포여이 대관 · 두 왕 · 토커이 (전투 그날 소식은 relevents.js)');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
