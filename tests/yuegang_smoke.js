/* 융경개관 — 월항 (2026-11-05 사용자 요청) — node tests/yuegang_smoke.js   (BROWSER_EXE=크롬 경로)
   · ① 월항의 밤배(1565~1567.2, 하문·천주) — 밀무역(금화·악명·순찰 육상전) / 순무 도택민에게 「막으면 도적, 열면 백성」 / 지나친다
   · ② 월항이 열리다(1567.3~1572) — 진씨 상단의 동업(금화 4,000 → 월항의 선인 · 하문·천주 통행 허가 · mingTrade는 그대로) / 사양(60일 뒤 다시)
   · 배당 — 하문에 180일마다 · 마닐라(1571.6.24) 뒤로는 은으로 · 소식 · 옛 저장 · 소문 · 일지 · 콘솔 오류 0 */
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
    await page.waitForFunction(() => window.G && G.Game && G.Yuegang && G.World, null, { timeout: 120000 });
    const r = await page.evaluate(async () => {
      await G.Game.ensureGeo();
      const UI = G.UI, EV = G.Yuegang, said = [], asked = [], out = {};
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
      const b = () => G.Game.state.yuegang;
      let s = fresh(1565, 1, 1);
      out.gate = { early: (at(s, 1564, 12, 31, 287), EV.pending()), night: (at(s, 1566, 3, 1, 287), EV.pending()), quan: (at(s, 1566, 3, 1, 175), EV.pending()), fuzhou: (at(s, 1566, 3, 1, 176), EV.pending()) };
      at(s, 1566, 3, 1, 287); await go(['petition']);
      out.A1 = { night: b().night, tu: said.some(x => /잡으러 온 것이 아니다/.test(x)), quote: said.some(x => /막으면 도적이 되고/.test(x)) };
      out.waitOpen = (at(s, 1567, 2, 28, 287), EV.pending());
      let g0 = s.player.gold; at(s, 1567, 4, 1, 175); await go(['yes']);
      out.A2 = { open: b().open, paid: g0 - s.player.gold, lic: G.R.hasItem('yg_license'), noSell: !!G.ITEM.yg_license.noSell, pass287: G.Sneak.hasPass(G.CITY_DATA[287]), pass175: G.Sneak.hasPass(G.CITY_DATA[175]), pass176: G.Sneak.hasPass(G.CITY_DATA[176]), ming: !!s.flags.mingTrade, japan: said.some(x => /왜놈 땅으로 가는 배는/.test(x)), remember: said.some(x => /순무 영감께 그 말을 한 선장/.test(x)) };
      out.payEarly = (s.day += 100, at(s, 1567, 7, 1, 287), EV.pending());
      g0 = s.player.gold; s.day += 90; at(s, 1567, 10, 1, 287); await go([]);
      out.pay1 = { gold: s.player.gold - g0, silver: !!b().silver };
      g0 = s.player.gold; s.day += 200; at(s, 1572, 2, 1, 287); await go([]);
      out.pay2 = { gold: s.player.gold - g0, silver: !!b().silver, show: said.some(x => /마닐라에서 실어 온 은화/.test(x)), total: b().paid };
      out.notAmoy = (s.day += 200, at(s, 1573, 1, 1, 175), EV.pending());
      s.loc = { mode: 'sea', lon: 118, lat: 24 }; s.yuegang.told = {};
      const day = (y, m, d) => { s.date = { y, m, d }; return EV.daily().map(x => x.text).join(' | '); };
      out.news = { pet: day(1566, 12, 1), open: day(1567, 3, 1), manila: day(1571, 6, 24), silver: day(1573, 6, 1) };
      // ── 밀무역 (순찰에 걸려 지면 절반) · 동업 사양 → 60일 뒤 다시
      s = fresh(1566, 1, 1); luck = true; const n0 = s.player.notoriety || 0; g0 = s.player.gold; at(s, 1566, 5, 1, 287); await go(['smuggle'], ['lose']); luck = false;
      out.B = { night: b().night, caught: b().caught, gold: s.player.gold - g0, noto: (s.player.notoriety || 0) - n0, fight: said.some(x => /\[육상전\] 순무의 순찰 군사/.test(x)) };
      at(s, 1567, 5, 1, 287); await go(['no']); out.B2 = { open: b().open, again: EV.pending(), later: (s.day += 61, EV.pending()) };
      at(s, 1567, 7, 1, 287); await go(['yes']); out.B3 = { open: b().open, smug: said.some(x => /그 밤배의 선장이로군/.test(x)) };
      s = fresh(1700, 1, 1); delete s.yuegang; out.oldSave = EV.daily().length;
      out.rumor = !!(G.EVENT_RUMORS || []).find(x => x.id === 'yuegang');
      out.journal = !!(EV.daily && EV.daily._journal);
      return out;
    });
    console.log(JSON.stringify({ A2: r.A2, pay1: r.pay1, pay2: r.pay2, B: r.B, B2: r.B2 }));
    const g = r.gate;
    ok(!g.early && g.night && g.quan && !g.fuzhou, '① 월항의 밤배 — 1565~ 하문·천주');
    ok(r.A1.night === 'petition' && r.A1.tu && r.A1.quote && r.waitOpen === false, '① 순무 도택민 「잡으러 온 것이 아니다」 · 「막으면 도적이 되고 열면 백성이 되오」 · 1567.3 전에는 다음 장면 없음');
    const a = r.A2;
    ok(a.open === 'yes' && a.paid === 4000 && a.lic && a.noSell && a.pass287 && a.pass175 && !a.pass176 && !a.ming && a.japan && a.remember, '② 월항이 열리다 — 일본은 여전히 금지 · 진씨 상단 동업(4,000) · 선인(팔 수 없다) → 하문·천주만 통행 (mingTrade 그대로) · 상소를 기억한다');
    ok(r.payEarly === false && r.pay1.gold === 1000 && !r.pay1.silver, '배당 — 180일 전에는 없음 · 하문에서 4,000 × 25% = 1,000');
    ok(r.pay2.gold === 1600 && r.pay2.silver && r.pay2.show && r.pay2.total === 2600 && r.notAmoy === false, '마닐라 뒤 배당은 은으로 40% — 멕시코 은화 · 배당은 하문에서만');
    ok(/바다를 막으니 상인이 도적/.test(r.news.pet) && /선장의 말도 적혀/.test(r.news.pet) && /일본으로 가는 배는 여전히/.test(r.news.open) && /레가스피/.test(r.news.manila) && /동업자 몫/.test(r.news.silver), '소식 — 도택민의 상소(제독의 말) · 월항이 열리다 · 마닐라 · 은의 바다');
    ok(r.B.night === 'smuggle' && r.B.caught === 'lost' && r.B.fight && r.B.gold === 1250 && r.B.noto === 4, '밀무역 — 순찰에 걸려 지면 절반(1,250) · 악명 +4');
    ok(r.B2.open === 'no' && r.B2.again === false && r.B2.later && r.B3.open === 'yes' && r.B3.smug, '동업 사양 → 60일 뒤 다시 · 「그 밤배의 선장이로군」');
    ok(r.oldSave === 0 && r.rumor && r.journal, '옛 저장 · 소문 · 일지');
    ok(!errors.length, '콘솔 오류 0 ' + errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); }
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
