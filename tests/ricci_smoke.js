/* 마테오 리치의 중국 내륙 선교 (2026-11-05 사용자 요청) — node tests/ricci_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 조경으로 가는 길(1583.6~9.9, 오문·광주) — 자명종 / 배 / 지나친다 · 9.10 조경 · 왕반 · 「승복이냐 선비 옷이냐」
   · ② 산해여지도(1584.6~1585) — 명나라를 가운데에 · 제독의 해도(아는 도시·발견물)로 크게 / 조금 · 사본
   · ③ 북경의 두 사람(1601~1610.5.10) — 서광계 · 별의 각(항해·측량) · 『기하원본』(1607~ / 그 전이면 약속 → 다시 들르면)
   · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Ricci && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, EV = G.Ricci, said = [], asked = [], out = {};
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
      const go = async (choices, land) => { plan = choices.slice(); landRes = (land || []).slice(); said.length = 0; asked.length = 0; const p = EV.pending(); if (p) await EV.check(); return p; };
      const hired = (id) => G.Game.state.mates.some(m => m.id === id);
      const rank = () => G.Court.rank(G.COURT.realms.KR);
      const b = () => G.Game.state.ricci;
      let s = fresh(1583, 1, 1);
      out.gate = { early: (at(s, 1583, 5, 31, 173), EV.pending()), late: (at(s, 1583, 9, 10, 173), EV.pending()), other: (at(s, 1583, 7, 1, 175), EV.pending()), open: (at(s, 1583, 7, 1, 173), EV.pending()), canton: (at(s, 1583, 7, 1, 174), EV.pending()) };
      let g0 = s.player.gold; at(s, 1583, 7, 1, 173); await go(['clock', 'scholar']);
      out.A1 = { zq: b().zq, robe: b().robe, date: s.date.m + '.' + s.date.d, paid: g0 - s.player.gold, chime: said.some(x => /정오를 치자/.test(x)), tower: said.some(x => /숭희탑/.test(x)), monk: said.some(x => /서쪽에서 온 중/.test(x)) };
      s.known = Array.from({ length: 70 }, (_, i) => i + 1); s.stats.found = 25;
      at(s, 1584, 7, 1, 174); await go(['center']);
      out.A2 = { map: b().map, grade: b().mapGrade, item: G.R.hasItem('rc_map'), angry: said.some(x => /중국은 천하의 가운데요/.test(x)), pacific: said.some(x => /태평양이 가운데/.test(x)), lisbon: said.some(x => /리스본의 지리학자들도/.test(x)) };
      s.player.sk.nav = 2; at(s, 1608, 3, 1, 188); await go(['show']);
      out.A3 = { bj: b().beijing, eu: b().euclid, book: G.R.hasItem('rc_euclid'), robe: said.some(x => /선장님 말대로 선비의 옷을/.test(x)), angle: said.some(x => /각이로구나/.test(x)), again: EV.pending() };
      s.loc = { mode: 'sea', lon: 115, lat: 22 }; s.ricci.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return EV.daily().map(x => x.text).join(' | '); };
      out.news = { xh: day(1583, 9, 10), map: day(1584, 10, 15), kunyu: day(1602, 9, 1), death: day(1610, 5, 11) };
      // ── 배만 · 유럽 지도 · 해도 조금 · 북경 1602 → 약속 → 1607에 다시
      s = fresh(1583, 1, 1); at(s, 1583, 8, 1, 174); await go(['boat', 'monk']);
      s.known = [1, 2, 3]; s.stats.found = 1; at(s, 1585, 3, 1, 173); await go(['europe']);
      out.B = { zq: b().zq, robe: b().robe, map: b().map, grade: b().mapGrade, oops: said.some(x => /오랑캐의 지도로군/.test(x)) };
      at(s, 1602, 5, 1, 188); await go(['show']);
      out.B3 = { eu: b().euclid, book: G.R.hasItem('rc_euclid'), owe: b().owe };
      at(s, 1607, 3, 1, 188); await go([]); out.B4 = { book: G.R.hasItem('rc_euclid'), owe: b().owe };
      // ── 지나치면 그 뒤가 없다
      s = fresh(1583, 1, 1); at(s, 1583, 7, 1, 173); await go(['pass']); out.C = { zq: b().zq, map: (at(s, 1584, 7, 1, 173), EV.pending()), bj: (at(s, 1605, 1, 1, 188), EV.pending()) };
      s = fresh(1700, 1, 1); delete s.ricci; out.oldSave = EV.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'ricci');
      out.journal = !!(EV.daily && EV.daily._journal);
      out.macaoRicci = !!(G.Macao && G.Macao.state);
      return out;
    });
    console.log(JSON.stringify({ A1: r.A1, A2: r.A2, A3: r.A3, B: r.B, B3: r.B3 }));
    const g = r.gate;
    ok(!g.early && !g.late && !g.other && g.open && g.canton, '① 1583.6.1~9.9 · 오문·광주에서만');
    ok(r.A1.zq === 'clock' && r.A1.paid >= 1200 && r.A1.date === '9.10' && r.A1.chime && r.A1.tower && r.A1.monk && r.A1.robe === 'scholar', '① 자명종(1,200) → 9.10 조경 · 왕반이 정오를 치는 시계에 놀란다 · 숭희탑 곁 땅 · 「서쪽에서 온 중」 · 선비 옷을 권한다');
    ok(r.A2.map === 'center' && r.A2.grade === 'big' && r.A2.item && r.A2.angry && r.A2.pacific && r.A2.lisbon, '② 산해여지도 — 「중국은 천하의 가운데요」 · 태평양을 가운데로 · 제독의 해도가 크다(도시 70·발견 25) · 사본');
    ok(r.A3.bj === 1 && r.A3.eu === 'clear' && r.A3.book && r.A3.robe && r.A3.angle && !r.A3.again, '③ 북경 — 「선장님 말대로 선비의 옷을」 · 북극성의 각 · 『기하원본』(1608)');
    ok(/숭희탑/.test(r.news.xh) && /선장이었다고/.test(r.news.xh) && /해도로 고쳐/.test(r.news.map) && /이방인 선장이 처음 알려 준/.test(r.news.kunyu) && /묻힐 땅/.test(r.news.death), '소식 — 선화사 · 산해여지도 · 곤여만국전도 · 리치의 죽음 (제독이 한 일에 맞게)');
    ok(r.B.zq === 'boat' && r.B.robe === 'monk' && r.B.map === 'europe' && r.B.grade === 'small' && r.B.oops, '배만 내 준다 · 승복 · 유럽 지도대로 — 「오랑캐의 지도로군」 · 해도는 조금');
    ok(r.B3.eu === 'clear' || r.B3.eu === 'rough', '③ 1602 — 별의 각');
    ok(!r.B3.book && r.B3.owe === 1 && r.B4.book && !r.B4.owe, '1607 전이면 「다 옮기면 보내 드리지요」 → 1607에 북경에 다시 들르면 『기하원본』');
    ok(r.C.zq === 'pass' && r.C.map === false && r.C.bj === false, '지나치면 산해여지도·북경 장면이 없다');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
